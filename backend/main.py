"""
main.py — School Management System
FastAPI application entry point.

Startup order:
  1. Environment config is read
  2. DB tables are created (dev) or Alembic handles migrations (prod)
  3. All routers are registered with their prefixes
  4. Middleware is applied (CORS, request logging)

Run:
  uvicorn main:app --reload                        # development
  uvicorn main:app --host 0.0.0.0 --port 8000     # production
"""

import os
import sys
import time
import logging
import asyncio
from contextlib import asynccontextmanager

# Fix for Windows asyncpg SSL hang
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

from core.database import create_tables

# --- routers
from auth.router          import router as auth_router
from routers.schools      import router as schools_router
from routers.teachers     import router as teachers_router
from routers.subjects     import router as subjects_router
from routers.classes      import router as classes_router
from routers.students     import router as students_router
from routers.marks        import router as marks_router
from routers.reports      import router as reports_router
from routers.dashboard    import router as dashboard_router


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("school_api")


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once on startup, then yields (app serves requests),
    then runs cleanup on shutdown.
    """
    logger.info("Starting up — connecting to database...")

    # In development, auto-create tables from models.
    # In production, comment this out and use:
    #   alembic upgrade head
    if os.getenv("ENV", "development") == "development":
        await create_tables()
        logger.info("Database tables verified.")

    logger.info("Application ready.")
    yield

    # Shutdown cleanup (close connection pools, flush caches, etc.)
    logger.info("Shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------

app = FastAPI(
    title="School Management API",
    description=(
        "Multi-school platform with role-based access control.\n\n"
        "**Roles:**\n"
        "- `platform_admin` — registers and manages schools\n"
        "- `director` — manages teachers, classes, subjects within their school\n"
        "- `teacher` — enrolls students, records marks, generates reports\n\n"
        "All protected routes require a Bearer JWT obtained from `POST /auth/login`."
    ),
    version="1.0.0",
    lifespan=lifespan,
    # Disable the default /docs and /redoc in production if needed:
    # docs_url=None, redoc_url=None,
)


# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173",   # React / Vite dev servers
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request timing middleware  (logs slow requests)
# ---------------------------------------------------------------------------

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000

    log_fn = logger.warning if duration_ms > 500 else logger.info
    log_fn(
        "%s %s  →  %d  (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """
    Pydantic validation errors → 422 with clean, readable messages.
    Default FastAPI output is verbose; this flattens it for clients.
    """
    errors = []
    for error in exc.errors():
        field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
        errors.append({"field": field or "body", "message": error["msg"]})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": errors},
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """
    Catch database unique-constraint violations that slip past
    application-level duplicate checks (race conditions, etc.)
    """
    logger.warning("DB IntegrityError on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "A record with this data already exists."},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    """Catch-all — never leak stack traces to clients in production."""
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

# Auth (login, password change, /me)
app.include_router(auth_router)

# Platform admin — school lifecycle
app.include_router(schools_router)

# Director scope — academic setup
app.include_router(teachers_router)
app.include_router(subjects_router)
app.include_router(classes_router)    # also includes assignment routes

# Teacher scope — students + grading
app.include_router(students_router)
app.include_router(marks_router)
app.include_router(reports_router)

# Dashboards
app.include_router(dashboard_router)


# ---------------------------------------------------------------------------
# Health + root
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "School Management API is running. Visit /docs for the API reference."}


@app.get("/health", tags=["system"], summary="Health check")
async def health_check():
    """
    Used by load balancers and monitoring tools.
    Returns 200 when the app is up and can accept requests.
    """
    return {"status": "healthy", "version": app.version}