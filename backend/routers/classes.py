"""
routers/classes.py
Director manages classes. Teachers can view their assigned classes.
"""

import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from core.database import get_db
from model import Class, Director, Teacher, Student, ClassAssignment, Subject
from schema import (
    ClassCreate, ClassUpdate, ClassOut,
    ClassAssignmentCreate, ClassAssignmentOut, ClassAssignmentDetail,
)
from auth.dependencies import (
    get_current_director, get_current_teacher,
    require_director_in_school, require_teacher_in_school,
)

router = APIRouter(tags=["classes"])


# ------------------------------------------------------------------ helpers

async def _get_class_or_404(class_id: uuid.UUID, school_id: uuid.UUID, db: AsyncSession) -> Class:
    class_ = await db.get(Class, class_id)
    if not class_ or class_.school_id != school_id:
        raise HTTPException(status_code=404, detail="Class not found in your school")
    return class_


# ------------------------------------------------------------------ director: class CRUD

@router.post("/schools/{school_id}/classes", response_model=ClassOut, status_code=201)
async def create_class(
    school_id: uuid.UUID,
    payload:   ClassCreate,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)

    # No duplicate class names within same school + year
    dup = await db.execute(
        select(Class).where(
            and_(
                Class.school_id     == school_id,
                Class.name          == payload.name,
                Class.academic_year == payload.academic_year,
            )
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Class '{payload.name}' already exists for {payload.academic_year}",
        )

    class_ = Class(school_id=school_id, **payload.model_dump())
    db.add(class_)
    await db.flush()
    await db.refresh(class_)
    return class_


@router.get("/schools/{school_id}/classes", response_model=List[ClassOut])
async def list_classes(
    school_id:     uuid.UUID,
    academic_year: str | None = Query(None),
    director: Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)

    q = select(Class).where(Class.school_id == school_id).order_by(Class.grade_level, Class.name)
    if academic_year:
        q = q.where(Class.academic_year == academic_year)

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/schools/{school_id}/classes/{class_id}", response_model=ClassOut)
async def get_class(
    school_id: uuid.UUID,
    class_id:  uuid.UUID,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    return await _get_class_or_404(class_id, school_id, db)


@router.patch("/schools/{school_id}/classes/{class_id}", response_model=ClassOut)
async def update_class(
    school_id: uuid.UUID,
    class_id:  uuid.UUID,
    payload:   ClassUpdate,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    class_ = await _get_class_or_404(class_id, school_id, db)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(class_, field, value)

    await db.flush()
    await db.refresh(class_)
    return class_


@router.delete("/schools/{school_id}/classes/{class_id}", status_code=204)
async def delete_class(
    school_id: uuid.UUID,
    class_id:  uuid.UUID,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Hard delete. Will fail if students are still enrolled (FK constraint)."""
    require_director_in_school(school_id, director)
    class_ = await _get_class_or_404(class_id, school_id, db)

    # Guard: don't delete a class that still has active students
    count = await db.execute(
        select(func.count()).where(
            and_(Student.class_id == class_id, Student.is_active == True)
        )
    )
    if (count.scalar() or 0) > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a class that still has active students. Reassign or deactivate students first.",
        )

    await db.delete(class_)
    await db.flush()


# ------------------------------------------------------------------ assignments (teacher ↔ class ↔ subject)

@router.post("/schools/{school_id}/assignments", response_model=ClassAssignmentOut, status_code=201)
async def assign_teacher(
    school_id: uuid.UUID,
    payload:   ClassAssignmentCreate,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Assign a teacher to teach a specific subject in a specific class."""
    require_director_in_school(school_id, director)

    # Validate all referenced entities belong to this school
    teacher = await db.get(Teacher, payload.teacher_id)
    if not teacher or teacher.school_id != school_id:
        raise HTTPException(status_code=404, detail="Teacher not found in your school")

    class_ = await db.get(Class, payload.class_id)
    if not class_ or class_.school_id != school_id:
        raise HTTPException(status_code=404, detail="Class not found in your school")

    from model import Subject
    subject = await db.get(Subject, payload.subject_id)
    if not subject or subject.school_id != school_id:
        raise HTTPException(status_code=404, detail="Subject not found in your school")

    # Prevent duplicate assignment
    dup = await db.execute(
        select(ClassAssignment).where(
            and_(
                ClassAssignment.teacher_id == payload.teacher_id,
                ClassAssignment.class_id   == payload.class_id,
                ClassAssignment.subject_id == payload.subject_id,
            )
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="This teacher is already assigned to this class + subject")

    assignment = ClassAssignment(
        **payload.model_dump(),
        assigned_by=director.id,
    )
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


@router.get("/schools/{school_id}/assignments", response_model=List[ClassAssignmentDetail])
async def list_assignments(
    school_id: uuid.UUID,
    class_id:  uuid.UUID | None = Query(None),
    teacher_id: uuid.UUID | None = Query(None),
    director:   Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    """List all assignments with optional filters."""
    require_director_in_school(school_id, director)

    # Join through class to scope by school
    q = (
        select(ClassAssignment)
        .join(Class, ClassAssignment.class_id == Class.id)
        .where(Class.school_id == school_id)
    )
    if class_id:   q = q.where(ClassAssignment.class_id   == class_id)
    if teacher_id: q = q.where(ClassAssignment.teacher_id == teacher_id)

    result = await db.execute(q)
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


@router.delete("/schools/{school_id}/assignments/{assignment_id}", status_code=204)
async def remove_assignment(
    school_id:     uuid.UUID,
    assignment_id: uuid.UUID,
    director:      Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Remove a teacher-class-subject assignment."""
    require_director_in_school(school_id, director)

    assignment = await db.get(ClassAssignment, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Verify assignment belongs to this school via the class
    class_ = await db.get(Class, assignment.class_id)
    if not class_ or class_.school_id != school_id:
        raise HTTPException(status_code=403, detail="Assignment does not belong to your school")

    await db.delete(assignment)
    await db.flush()


# ------------------------------------------------------------------ teacher: view my classes

@router.get("/teachers/me/classes", response_model=List[ClassAssignmentDetail])
async def get_my_classes(
    teacher: Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Teacher sees all classes + subjects they are assigned to."""
    result = await db.execute(
        select(ClassAssignment).where(ClassAssignment.teacher_id == teacher.id)
    )
    assignments = result.scalars().all()

    details = []
    for a in assignments:
        subject = await db.get(Subject, a.subject_id)
        class_  = await db.get(Class,   a.class_id)
        details.append(ClassAssignmentDetail(
            id=a.id,
            teacher_id=a.teacher_id,
            teacher_name=teacher.name,
            class_id=a.class_id,
            class_name=class_.name if class_ else "",
            subject_id=a.subject_id,
            subject_name=subject.name if subject else "",
            assigned_by=a.assigned_by,
            created_at=a.created_at,
        ))
    return details