"""
routers/subjects.py
Director manages subjects for their school.
"""

import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.database import get_db
from model import Subject, Director
from schema import SubjectCreate, SubjectUpdate, SubjectOut
from auth.dependencies import get_current_director, require_director_in_school

router = APIRouter(tags=["director — subjects"])


async def _get_subject_or_404(subject_id: uuid.UUID, school_id: uuid.UUID, db: AsyncSession) -> Subject:
    subject = await db.get(Subject, subject_id)
    if not subject or subject.school_id != school_id:
        raise HTTPException(status_code=404, detail="Subject not found in your school")
    return subject


@router.post("/schools/{school_id}/subjects", response_model=SubjectOut, status_code=201)
async def create_subject(
    school_id: uuid.UUID,
    payload:   SubjectCreate,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)

    # Duplicate code check within the same school
    dup = await db.execute(
        select(Subject).where(
            and_(Subject.school_id == school_id, Subject.code == payload.code)
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Subject code '{payload.code}' already exists")

    subject = Subject(school_id=school_id, **payload.model_dump())
    db.add(subject)
    await db.flush()
    await db.refresh(subject)
    return subject


@router.get("/schools/{school_id}/subjects", response_model=List[SubjectOut])
async def list_subjects(
    school_id: uuid.UUID,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    result = await db.execute(
        select(Subject).where(Subject.school_id == school_id).order_by(Subject.name)
    )
    return result.scalars().all()


@router.get("/schools/{school_id}/subjects/{subject_id}", response_model=SubjectOut)
async def get_subject(
    school_id:  uuid.UUID,
    subject_id: uuid.UUID,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    return await _get_subject_or_404(subject_id, school_id, db)


@router.patch("/schools/{school_id}/subjects/{subject_id}", response_model=SubjectOut)
async def update_subject(
    school_id:  uuid.UUID,
    subject_id: uuid.UUID,
    payload:    SubjectUpdate,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    subject = await _get_subject_or_404(subject_id, school_id, db)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(subject, field, value)

    await db.flush()
    await db.refresh(subject)
    return subject


@router.delete("/schools/{school_id}/subjects/{subject_id}", status_code=204)
async def delete_subject(
    school_id:  uuid.UUID,
    subject_id: uuid.UUID,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """
    Hard delete a subject.
    Will fail if any ClassAssignment or Mark references it
    (FK constraint) — remove those first.
    """
    require_director_in_school(school_id, director)
    subject = await _get_subject_or_404(subject_id, school_id, db)
    await db.delete(subject)
    await db.flush()