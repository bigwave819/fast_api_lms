"""
routers/teachers.py
Director manages teachers for their own school.
"""

import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.database import get_db
from model import Teacher, Director, ClassAssignment, Subject, Class
from schema import (
    TeacherCreate, TeacherUpdate, TeacherOut,
    ClassAssignmentDetail,
)
from auth.dependencies import get_current_director, require_director_in_school
from auth.router import hash_password

router = APIRouter(tags=["director — teachers"])


# ------------------------------------------------------------------ helpers

async def _get_teacher_or_404(
    teacher_id: uuid.UUID,
    school_id:  uuid.UUID,
    db: AsyncSession,
) -> Teacher:
    teacher = await db.get(Teacher, teacher_id)
    if not teacher or teacher.school_id != school_id:
        raise HTTPException(status_code=404, detail="Teacher not found in your school")
    return teacher


# ------------------------------------------------------------------ CRUD

@router.post("/schools/{school_id}/teachers", response_model=TeacherOut, status_code=201)
async def add_teacher(
    school_id: uuid.UUID,
    payload:   TeacherCreate,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Add a new teacher to the school."""
    require_director_in_school(school_id, director)

    # Email uniqueness across all teachers
    dup = await db.execute(select(Teacher).where(Teacher.email == payload.email))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use")

    teacher = Teacher(
        school_id=school_id,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        subject_specialty=payload.subject_specialty,
    )
    db.add(teacher)
    await db.flush()
    await db.refresh(teacher)
    return teacher


@router.get("/schools/{school_id}/teachers", response_model=List[TeacherOut])
async def list_teachers(
    school_id: uuid.UUID,
    is_active: bool | None = Query(None),
    director:  Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all teachers in the school."""
    require_director_in_school(school_id, director)

    q = select(Teacher).where(Teacher.school_id == school_id).order_by(Teacher.name)
    if is_active is not None:
        q = q.where(Teacher.is_active == is_active)

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/schools/{school_id}/teachers/{teacher_id}", response_model=TeacherOut)
async def get_teacher(
    school_id:  uuid.UUID,
    teacher_id: uuid.UUID,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    return await _get_teacher_or_404(teacher_id, school_id, db)


@router.patch("/schools/{school_id}/teachers/{teacher_id}", response_model=TeacherOut)
async def update_teacher(
    school_id:  uuid.UUID,
    teacher_id: uuid.UUID,
    payload:    TeacherUpdate,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Update teacher info or activate/deactivate them."""
    require_director_in_school(school_id, director)
    teacher = await _get_teacher_or_404(teacher_id, school_id, db)

    # Check email uniqueness if changing email
    if payload.email and payload.email != teacher.email:
        dup = await db.execute(select(Teacher).where(Teacher.email == payload.email))
        if dup.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email already in use")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(teacher, field, value)

    await db.flush()
    await db.refresh(teacher)
    return teacher


@router.delete("/schools/{school_id}/teachers/{teacher_id}", status_code=204)
async def deactivate_teacher(
    school_id:  uuid.UUID,
    teacher_id: uuid.UUID,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Soft-deactivate a teacher (preserves all marks they recorded)."""
    require_director_in_school(school_id, director)
    teacher = await _get_teacher_or_404(teacher_id, school_id, db)
    teacher.is_active = False
    await db.flush()


# ------------------------------------------------------------------ teacher assignments view

@router.get("/schools/{school_id}/teachers/{teacher_id}/assignments", response_model=List[ClassAssignmentDetail])
async def get_teacher_assignments(
    school_id:  uuid.UUID,
    teacher_id: uuid.UUID,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """See every class+subject this teacher is assigned to."""
    require_director_in_school(school_id, director)
    await _get_teacher_or_404(teacher_id, school_id, db)

    result = await db.execute(
        select(ClassAssignment).where(ClassAssignment.teacher_id == teacher_id)
    )
    assignments = result.scalars().all()

    details = []
    for a in assignments:
        subject = await db.get(Subject, a.subject_id)
        class_  = await db.get(Class,   a.class_id)
        teacher = await db.get(Teacher, a.teacher_id)
        details.append(ClassAssignmentDetail(
            id=a.id,
            teacher_id=a.teacher_id,
            teacher_name=teacher.name if teacher else "",
            class_id=a.class_id,
            class_name=class_.name if class_ else "",
            subject_id=a.subject_id,
            subject_name=subject.name if subject else "",
            assigned_by=a.assigned_by,
            created_at=a.created_at,
        ))
    return details