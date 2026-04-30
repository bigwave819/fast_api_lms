"""
routers/admin.py
Platform admin — manages schools, directors and platform-wide visibility.
All endpoints require PlatformAdmin role.
"""

import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from pydantic import BaseModel, EmailStr

from core.database import get_db
from model import School, Director, Teacher, Student, PlatformAdmin
from auth.dependencies import get_current_admin
from auth.router import hash_password

router = APIRouter(prefix="/admin", tags=["platform-admin"])


# ------------------------------------------------------------------ schemas

class SchoolCreate(BaseModel):
    name:     str
    is_active: bool = True


class SchoolUpdate(BaseModel):
    name:      str | None = None
    is_active: bool | None = None


class SchoolOut(BaseModel):
    id:         uuid.UUID
    name:       str
    is_active:  bool
    created_at: str

    class Config:
        from_attributes = True


class DirectorCreate(BaseModel):
    name:      str
    email:     EmailStr
    password:  str
    school_id: uuid.UUID | None = None


class DirectorUpdate(BaseModel):
    name:      str | None  = None
    email:     EmailStr | None = None
    school_id: uuid.UUID | None = None
    is_active: bool | None = None


class DirectorOut(BaseModel):
    id:        uuid.UUID
    name:      str
    email:     str
    school_id: uuid.UUID | None
    is_active: bool

    class Config:
        from_attributes = True


class PlatformStats(BaseModel):
    total_schools:    int
    active_schools:   int
    inactive_schools: int
    total_directors:  int
    total_teachers:   int
    total_students:   int


# ------------------------------------------------------------------ schools

@router.post("/schools", response_model=SchoolOut, status_code=201)
async def create_school(
    payload: SchoolCreate,
    admin:   Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Create a new school on the platform."""
    dup = await db.execute(select(School).where(School.name == payload.name))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A school with this name already exists")

    school = School(name=payload.name, is_active=payload.is_active)
    db.add(school)
    await db.flush()
    await db.refresh(school)
    return school


@router.get("/schools", response_model=List[SchoolOut])
async def list_schools(
    is_active: bool | None = Query(None),
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all schools on the platform."""
    q = select(School).order_by(School.name)
    if is_active is not None:
        q = q.where(School.is_active == is_active)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/schools/{school_id}", response_model=SchoolOut)
async def get_school(
    school_id: uuid.UUID,
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    school = await db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school


@router.patch("/schools/{school_id}", response_model=SchoolOut)
async def update_school(
    school_id: uuid.UUID,
    payload:   SchoolUpdate,
    admin:     Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    school = await db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    if payload.name and payload.name != school.name:
        dup = await db.execute(select(School).where(School.name == payload.name))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="School name already taken")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(school, field, value)

    await db.flush()
    await db.refresh(school)
    return school


@router.delete("/schools/{school_id}", status_code=204)
async def delete_school(
    school_id: uuid.UUID,
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """
    Hard delete a school.
    Will fail if directors, teachers or students still reference it.
    Deactivate instead for soft removal.
    """
    school = await db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")

    # guard: block delete if any active members exist
    teacher_count = (await db.execute(
        select(func.count()).where(
            and_(Teacher.school_id == school_id, Teacher.is_active == True)
        )
    )).scalar() or 0

    if teacher_count > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a school that still has active teachers. Deactivate the school instead.",
        )

    await db.delete(school)
    await db.flush()


# ------------------------------------------------------------------ directors

@router.post("/directors", response_model=DirectorOut, status_code=201)
async def create_director(
    payload: DirectorCreate,
    admin:   Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Create a director account and optionally assign them to a school."""
    dup = await db.execute(select(Director).where(Director.email == payload.email))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use")

    if payload.school_id:
        school = await db.get(School, payload.school_id)
        if not school:
            raise HTTPException(status_code=404, detail="School not found")

    director = Director(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        school_id=payload.school_id,
        is_active=True,
    )
    db.add(director)
    await db.flush()
    await db.refresh(director)
    return director


@router.get("/directors", response_model=List[DirectorOut])
async def list_directors(
    school_id: uuid.UUID | None = Query(None),
    is_active: bool | None      = Query(None),
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all directors, optionally filtered by school or status."""
    q = select(Director).order_by(Director.name)
    if school_id:  q = q.where(Director.school_id == school_id)
    if is_active is not None: q = q.where(Director.is_active == is_active)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/directors/{director_id}", response_model=DirectorOut)
async def get_director(
    director_id: uuid.UUID,
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    director = await db.get(Director, director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director not found")
    return director


@router.patch("/directors/{director_id}", response_model=DirectorOut)
async def update_director(
    director_id: uuid.UUID,
    payload:     DirectorUpdate,
    admin:       Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Update director info, reassign to a school, or activate/deactivate."""
    director = await db.get(Director, director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director not found")

    if payload.email and payload.email != director.email:
        dup = await db.execute(select(Director).where(Director.email == payload.email))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already in use")

    if payload.school_id:
        school = await db.get(School, payload.school_id)
        if not school:
            raise HTTPException(status_code=404, detail="School not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(director, field, value)

    await db.flush()
    await db.refresh(director)
    return director


@router.delete("/directors/{director_id}", status_code=204)
async def deactivate_director(
    director_id: uuid.UUID,
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Soft-deactivate a director account."""
    director = await db.get(Director, director_id)
    if not director:
        raise HTTPException(status_code=404, detail="Director not found")
    director.is_active = False
    await db.flush()


# ------------------------------------------------------------------ stats

@router.get("/stats", response_model=PlatformStats)
async def platform_stats(
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Platform-wide aggregate counts for the admin dashboard."""
    total_schools    = (await db.execute(select(func.count(School.id)))).scalar() or 0
    active_schools   = (await db.execute(select(func.count(School.id)).where(School.is_active == True))).scalar() or 0
    total_directors  = (await db.execute(select(func.count(Director.id)))).scalar() or 0
    total_teachers   = (await db.execute(select(func.count(Teacher.id)).where(Teacher.is_active == True))).scalar() or 0
    total_students   = (await db.execute(select(func.count(Student.id)).where(Student.is_active == True))).scalar() or 0

    return PlatformStats(
        total_schools=total_schools,
        active_schools=active_schools,
        inactive_schools=total_schools - active_schools,
        total_directors=total_directors,
        total_teachers=total_teachers,
        total_students=total_students,
    )