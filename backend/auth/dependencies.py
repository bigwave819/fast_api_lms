"""
auth/dependencies.py
JWT authentication + role-based access control dependencies.
Inject these into any route with FastAPI's Depends().
"""

import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from model import Teacher, Director, PlatformAdmin, School, UserRole

SECRET_KEY = "change-this-to-a-long-random-secret-in-production"
ALGORITHM  = "HS256"

bearer_scheme = HTTPBearer()


# ---------------------------------------------------------------------------
# Token decoder
# ---------------------------------------------------------------------------

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------------------------------------------------------------------------
# Current user dependencies
# ---------------------------------------------------------------------------

async def get_current_teacher(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> Teacher:
    payload = decode_token(credentials.credentials)

    if payload.get("role") != UserRole.Teacher:
        raise HTTPException(status_code=403, detail="Teachers only")

    teacher = await db.get(Teacher, uuid.UUID(payload["sub"]))
    if not teacher or not teacher.is_active:
        raise HTTPException(status_code=401, detail="Teacher account inactive or not found")

    return teacher


async def get_current_director(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> Director:
    payload = decode_token(credentials.credentials)

    if payload.get("role") != UserRole.Director:
        raise HTTPException(status_code=403, detail="Directors only")

    director = await db.get(Director, uuid.UUID(payload["sub"]))
    if not director or not director.is_active:
        raise HTTPException(status_code=401, detail="Director account inactive")

    return director


async def get_current_admin(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: AsyncSession = Depends(get_db),
) -> PlatformAdmin:
    payload = decode_token(credentials.credentials)

    if payload.get("role") != UserRole.Platform_admin:
        raise HTTPException(status_code=403, detail="Platform admins only")

    admin = await db.get(PlatformAdmin, uuid.UUID(payload["sub"]))
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")

    return admin


# ---------------------------------------------------------------------------
# School scope guard
# Ensures a director or teacher actually belongs to the school in the URL.
# ---------------------------------------------------------------------------

async def verify_school_active(school_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> School:
    school = await db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    if not school.is_active:
        raise HTTPException(status_code=403, detail="School subscription is inactive")
    return school


def require_director_in_school(school_id: uuid.UUID, director: Director) -> None:
    """Call this inside a route to confirm the director owns this school."""
    if director.school_id != school_id:
        raise HTTPException(status_code=403, detail="You do not manage this school")


def require_teacher_in_school(school_id: uuid.UUID, teacher: Teacher) -> None:
    if teacher.school_id != school_id:
        raise HTTPException(status_code=403, detail="You do not belong to this school")