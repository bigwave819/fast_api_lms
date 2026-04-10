"""
routers/marks.py
Teachers record and manage marks. Directors can view marks school-wide.
A teacher can only grade subjects they are assigned to in a given class.
"""

import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from core.database import get_db
from model import Teacher, Director, Mark, Student, Class, ClassAssignment, Subject
from schema import MarkCreate, MarkUpdate, MarkOut
from auth.dependencies import (
    get_current_teacher, get_current_director,
    require_teacher_in_school, require_director_in_school,
)

router = APIRouter(tags=["marks"])


# ------------------------------------------------------------------ guard helper

async def _assert_teacher_can_grade(
    teacher_id: uuid.UUID,
    class_id:   uuid.UUID,
    subject_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    """Teacher must be assigned to this exact class + subject pair."""
    result = await db.execute(
        select(ClassAssignment).where(
            and_(
                ClassAssignment.teacher_id == teacher_id,
                ClassAssignment.class_id   == class_id,
                ClassAssignment.subject_id == subject_id,
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to teach this subject in this class",
        )


# ------------------------------------------------------------------ record one mark

@router.post("/marks", response_model=MarkOut, status_code=201)
async def record_mark(
    payload: MarkCreate,
    teacher: Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Record a mark for one student in one subject."""
    student = await db.get(Student, payload.student_id)
    if not student or student.school_id != teacher.school_id:
        raise HTTPException(status_code=404, detail="Student not found in your school")

    if student.class_id != payload.class_id:
        raise HTTPException(status_code=422, detail="Student does not belong to the specified class")

    await _assert_teacher_can_grade(teacher.id, payload.class_id, payload.subject_id, db)

    subject = await db.get(Subject, payload.subject_id)
    if not subject or subject.school_id != teacher.school_id:
        raise HTTPException(status_code=404, detail="Subject not found in your school")

    existing = await db.execute(
        select(Mark).where(
            and_(
                Mark.student_id    == payload.student_id,
                Mark.subject_id    == payload.subject_id,
                Mark.exam_type     == payload.exam_type,
                Mark.term          == payload.term,
                Mark.academic_year == payload.academic_year,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Mark already recorded for this student/subject/exam/term. Use PATCH to correct it.",
        )

    mark = Mark(**payload.model_dump(), teacher_id=teacher.id)
    db.add(mark)
    await db.flush()
    await db.refresh(mark)
    return mark


# ------------------------------------------------------------------ bulk record

@router.post("/marks/bulk", response_model=List[MarkOut], status_code=201)
async def record_marks_bulk(
    payloads: List[MarkCreate],
    teacher:  Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """
    Record marks for multiple students at once after a class exam.
    Skips duplicates silently and returns only newly created marks.
    """
    if not payloads:
        raise HTTPException(status_code=422, detail="Provide at least one mark entry")

    created: List[Mark] = []

    for payload in payloads:
        student = await db.get(Student, payload.student_id)
        if not student or student.school_id != teacher.school_id:
            continue
        if student.class_id != payload.class_id:
            continue

        try:
            await _assert_teacher_can_grade(teacher.id, payload.class_id, payload.subject_id, db)
        except HTTPException:
            continue

        existing = await db.execute(
            select(Mark).where(
                and_(
                    Mark.student_id    == payload.student_id,
                    Mark.subject_id    == payload.subject_id,
                    Mark.exam_type     == payload.exam_type,
                    Mark.term          == payload.term,
                    Mark.academic_year == payload.academic_year,
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        mark = Mark(**payload.model_dump(), teacher_id=teacher.id)
        db.add(mark)
        created.append(mark)

    if created:
        await db.flush()
        for m in created:
            await db.refresh(m)

    return created


# ------------------------------------------------------------------ read marks

@router.get("/marks", response_model=List[MarkOut])
async def get_marks(
    student_id:    uuid.UUID | None = Query(None),
    subject_id:    uuid.UUID | None = Query(None),
    class_id:      uuid.UUID | None = Query(None),
    term:          str | None       = Query(None),
    academic_year: str | None       = Query(None),
    exam_type:     str | None       = Query(None),
    teacher: Annotated[Teacher, Depends(get_current_teacher)] = None,
    db: AsyncSession = Depends(get_db),
):
    """Fetch marks with flexible filters. Scoped to teacher's assigned classes."""
    assigned = await db.execute(
        select(ClassAssignment.class_id).where(ClassAssignment.teacher_id == teacher.id)
    )
    my_class_ids = [row[0] for row in assigned.all()]
    if not my_class_ids:
        return []

    conditions = [Mark.class_id.in_(my_class_ids)]
    if student_id:    conditions.append(Mark.student_id    == student_id)
    if subject_id:    conditions.append(Mark.subject_id    == subject_id)
    if class_id:      conditions.append(Mark.class_id      == class_id)
    if term:          conditions.append(Mark.term          == term)
    if academic_year: conditions.append(Mark.academic_year == academic_year)
    if exam_type:     conditions.append(Mark.exam_type     == exam_type)

    result = await db.execute(
        select(Mark).where(and_(*conditions)).order_by(Mark.created_at.desc())
    )
    return result.scalars().all()


@router.get("/marks/{mark_id}", response_model=MarkOut)
async def get_mark(
    mark_id: uuid.UUID,
    teacher: Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    mark = await db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")

    student = await db.get(Student, mark.student_id)
    if not student or student.school_id != teacher.school_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return mark


# ------------------------------------------------------------------ update / delete

@router.patch("/marks/{mark_id}", response_model=MarkOut)
async def update_mark(
    mark_id: uuid.UUID,
    payload: MarkUpdate,
    teacher: Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Correct a mark. Only the teacher who originally recorded it can edit it."""
    mark = await db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")

    if mark.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only edit marks you recorded")

    if payload.score > mark.max_score:
        raise HTTPException(
            status_code=422,
            detail=f"Score {payload.score} exceeds max_score {mark.max_score}",
        )

    mark.score = payload.score
    if payload.notes is not None:
        mark.notes = payload.notes

    await db.flush()
    await db.refresh(mark)
    return mark


@router.delete("/marks/{mark_id}", status_code=204)
async def delete_mark(
    mark_id: uuid.UUID,
    teacher: Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Delete a mark entry. Only the recording teacher can do this."""
    mark = await db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(status_code=404, detail="Mark not found")

    if mark.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only delete marks you recorded")

    await db.delete(mark)
    await db.flush()


# ------------------------------------------------------------------ director school-wide view

@router.get("/schools/{school_id}/marks", response_model=List[MarkOut])
async def director_get_marks(
    school_id:     uuid.UUID,
    student_id:    uuid.UUID | None = Query(None),
    subject_id:    uuid.UUID | None = Query(None),
    class_id:      uuid.UUID | None = Query(None),
    term:          str | None       = Query(None),
    academic_year: str | None       = Query(None),
    director: Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    """Director views all marks across the school with optional filters."""
    require_director_in_school(school_id, director)

    school_students = select(Student.id).where(Student.school_id == school_id)
    conditions = [Mark.student_id.in_(school_students)]

    if student_id:    conditions.append(Mark.student_id    == student_id)
    if subject_id:    conditions.append(Mark.subject_id    == subject_id)
    if class_id:      conditions.append(Mark.class_id      == class_id)
    if term:          conditions.append(Mark.term          == term)
    if academic_year: conditions.append(Mark.academic_year == academic_year)

    result = await db.execute(
        select(Mark).where(and_(*conditions)).order_by(Mark.created_at.desc())
    )
    return result.scalars().all()