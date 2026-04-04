from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.database import Base, engine

@asynccontextmanager
async def lifespan(app: FastAPI):

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.creat_all)

    yield
    await engine.dispose()


app = FastAPI(
    title="College Dining System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_methods=["POST, PUT DELETE, PATCH, GET"],
    allow_credentials=True
)

@app.get("/", tags=["Health"])
async def root():
    return {"message": "College Dining System is running ✅", "docs": "/docs"}