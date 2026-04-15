"""
routers/students.py
Teachers enroll and manage students in their assigned classes.
Directors can view all students across their school.
"""

import uuid
from datetime import date
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from core.database import get_db
from model import Student, Teacher, Director, Class, ClassAssignment
from schema import StudentCreate, StudentUpdate, StudentOut
from auth.dependencies import (
    get_current_teacher, get_current_director,
    require_teacher_in_school, require_director_in_school,
)

router = APIRouter(tags=["students"])


# ------------------------------------------------------------------ helpers

async def _assert_teacher_assigned(teacher_id: uuid.UUID, class_id: uuid.UUID, db: AsyncSession) -> None:
    result = await db.execute(
        select(ClassAssignment).where(
            and_(
                ClassAssignment.teacher_id == teacher_id,
                ClassAssignment.class_id   == class_id,
            )
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="You are not assigned to this class")


async def _get_student_or_404(student_id: uuid.UUID, school_id: uuid.UUID, db: AsyncSession) -> Student:
    student = await db.get(Student, student_id)
    if not student or student.school_id != school_id:
        raise HTTPException(status_code=404, detail="Student not found in your school")
    return student


# ------------------------------------------------------------------ teacher: enroll students

@router.post("/classes/{class_id}/students", response_model=StudentOut, status_code=201)
async def enroll_student(
    class_id: uuid.UUID,
    payload:  StudentCreate,
    teacher:  Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Enroll a new student in one of your assigned classes."""
    class_ = await db.get(Class, class_id)
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")

    require_teacher_in_school(class_.school_id, teacher)
    await _assert_teacher_assigned(teacher.id, class_id, db)

    # Capacity check
    if class_.capacity:
        count_result = await db.execute(
            select(func.count()).where(
                and_(Student.class_id == class_id, Student.is_active == True)
            )
        )
        current_count = count_result.scalar() or 0
        if current_count >= class_.capacity:
            raise HTTPException(
                status_code=409,
                detail=f"Class is full ({class_.capacity} students max)",
            )

    student = Student(
        school_id=class_.school_id,
        class_id=class_id,
        added_by=teacher.id,
        name=payload.name,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        enrollment_date=payload.enrollment_date or date.today(),
    )
    db.add(student)
    await db.flush()
    await db.refresh(student)
    return student


@router.get("/classes/{class_id}/students", response_model=List[StudentOut])
async def list_students_in_class(
    class_id:  uuid.UUID,
    is_active: bool | None = Query(None),
    teacher:   Annotated[Teacher, Depends(get_current_teacher)] = None,
    db: AsyncSession = Depends(get_db),
):
    """List students in one of your assigned classes."""
    class_ = await db.get(Class, class_id)
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")

    require_teacher_in_school(class_.school_id, teacher)
    await _assert_teacher_assigned(teacher.id, class_id, db)

    q = select(Student).where(Student.class_id == class_id).order_by(Student.name)
    if is_active is not None:
        q = q.where(Student.is_active == is_active)

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/students/{student_id}", response_model=StudentOut)
async def get_student(
    student_id: uuid.UUID,
    teacher:    Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    student = await _get_student_or_404(student_id, teacher.school_id, db)

    # Teacher can only see students in their assigned classes
    await _assert_teacher_assigned(teacher.id, student.class_id, db)
    return student


@router.patch("/students/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: uuid.UUID,
    payload:    StudentUpdate,
    teacher:    Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Update student info (guardian contact, class transfer, etc.)."""
    student = await _get_student_or_404(student_id, teacher.school_id, db)
    await _assert_teacher_assigned(teacher.id, student.class_id, db)

    # If moving to another class, verify teacher is also assigned there
    if payload.class_id and payload.class_id != student.class_id:
        new_class = await db.get(Class, payload.class_id)
        if not new_class or new_class.school_id != teacher.school_id:
            raise HTTPException(status_code=404, detail="Target class not found in your school")
        await _assert_teacher_assigned(teacher.id, payload.class_id, db)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(student, field, value)

    await db.flush()
    await db.refresh(student)
    return student


# ------------------------------------------------------------------ director: school-wide student view

@router.get("/schools/{school_id}/students", response_model=List[StudentOut])
async def list_all_students(
    school_id:  uuid.UUID,
    class_id:   uuid.UUID | None = Query(None),
    is_active:  bool | None      = Query(None),
    director:   Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    """Director sees all students in the school, optionally filtered by class."""
    require_director_in_school(school_id, director)

    q = select(Student).where(Student.school_id == school_id).order_by(Student.name)
    if class_id:   q = q.where(Student.class_id  == class_id)
    if is_active is not None:
        q = q.where(Student.is_active == is_active)

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/schools/{school_id}/students/{student_id}", response_model=StudentOut)
async def director_get_student(
    school_id:  uuid.UUID,
    student_id: uuid.UUID,
    director:   Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    require_director_in_school(school_id, director)
    return await _get_student_or_404(student_id, school_id, db)