"""
auth/router.py
Login endpoint that works for all roles (director, teacher, platform_admin).
Returns a signed JWT the client sends on every subsequent request.
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from model import Director, Teacher, PlatformAdmin
from auth.dependencies import SECRET_KEY, ALGORITHM, get_current_director, get_current_teacher

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8   # 8 hours


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         str
    name:         str


class PasswordChange(BaseModel):
    current_password: str
    new_password:     str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def create_access_token(subject: str, role: str, school_id: str | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub":       subject,
        "role":      role,
        "school_id": school_id,
        "exp":       expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Single login endpoint for all roles.
    We check directors first, then teachers, then platform admins.
    In production you could add a 'role' hint field to the request to skip lookups.
    """
    user = None
    role = None

    # 1. Try director
    result = await db.execute(select(Director).where(Director.email == payload.email))
    director = result.scalar_one_or_none()
    if director and verify_password(payload.password, director.password_hash):
        if not director.is_active:
            raise HTTPException(status_code=403, detail="Account is deactivated")
        user = director
        role = "director"

    # 2. Try teacher
    if not user:
        result = await db.execute(select(Teacher).where(Teacher.email == payload.email))
        teacher = result.scalar_one_or_none()
        if teacher and verify_password(payload.password, teacher.password_hash):
            if not teacher.is_active:
                raise HTTPException(status_code=403, detail="Account is deactivated")
            user = teacher
            role = "teacher"

    # 3. Try platform admin
    if not user:
        result = await db.execute(select(PlatformAdmin).where(PlatformAdmin.email == payload.email))
        admin = result.scalar_one_or_none()
        if admin and verify_password(payload.password, admin.password_hash):
            user = admin
            role = "platform_admin"

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    school_id = str(getattr(user, "school_id", None)) if hasattr(user, "school_id") else None

    token = create_access_token(
        subject=str(user.id),
        role=role,
        school_id=school_id,
    )

    return TokenResponse(access_token=token, role=role, name=user.name)


@router.get("/me")
async def get_me(
    director: Annotated[Director, Depends(get_current_director)] = None,
    teacher:  Annotated[Teacher,  Depends(get_current_teacher)]  = None,
):
    user = director or teacher
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"id": user.id, "name": user.name, "email": user.email}


@router.patch("/me/password", status_code=204)
async def change_password(
    payload:  PasswordChange,
    director: Annotated[Director, Depends(get_current_director)] = None,
    teacher:  Annotated[Teacher,  Depends(get_current_teacher)]  = None,
    db: AsyncSession = Depends(get_db),
):
    user = director or teacher
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is wrong")

    user.password_hash = hash_password(payload.new_password)
    await db.flush()