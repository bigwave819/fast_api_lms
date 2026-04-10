"""
routers/dashboard.py
Summary stats for directors and teachers.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from core.database import get_db
from model import (
    Teacher, Director, Student, Class, Subject,
    ClassAssignment, Mark, Report,
)
from schema import DirectorDashboard, TeacherDashboard, ReportOut
from auth.dependencies import get_current_director, get_current_teacher, require_director_in_school

router = APIRouter(tags=["dashboard"])


@router.get("/schools/{school_id}/dashboard", response_model=DirectorDashboard)
async def director_dashboard(
    school_id: uuid.UUID,
    director:  Annotated[Director, Depends(get_current_director)],
    db: AsyncSession = Depends(get_db),
):
    """Overview stats for the director: counts + 5 most recent reports."""
    require_director_in_school(school_id, director)

    # Parallel count queries
    teacher_count = (await db.execute(
        select(func.count()).where(and_(Teacher.school_id == school_id, Teacher.is_active == True))
    )).scalar() or 0

    student_count = (await db.execute(
        select(func.count()).where(and_(Student.school_id == school_id, Student.is_active == True))
    )).scalar() or 0

    class_count = (await db.execute(
        select(func.count()).where(Class.school_id == school_id)
    )).scalar() or 0

    subject_count = (await db.execute(
        select(func.count()).where(Subject.school_id == school_id)
    )).scalar() or 0

    recent_result = await db.execute(
        select(Report)
        .where(Report.school_id == school_id)
        .order_by(Report.generated_at.desc())
        .limit(5)
    )
    recent_reports = recent_result.scalars().all()

    from model import School
    school = await db.get(School, school_id)

    return DirectorDashboard(
        school_name=school.name if school else "",
        total_teachers=teacher_count,
        total_students=student_count,
        total_classes=class_count,
        total_subjects=subject_count,
        recent_reports=recent_reports,
    )


@router.get("/teachers/me/dashboard", response_model=TeacherDashboard)
async def teacher_dashboard(
    teacher: Annotated[Teacher, Depends(get_current_teacher)],
    db: AsyncSession = Depends(get_db),
):
    """Summary for a teacher: how many classes, students, marks recorded."""
    assignments_result = await db.execute(
        select(ClassAssignment).where(ClassAssignment.teacher_id == teacher.id)
    )
    assignments = assignments_result.scalars().all()
    class_ids   = list({a.class_id for a in assignments})

    student_count = 0
    if class_ids:
        student_count = (await db.execute(
            select(func.count()).where(
                and_(Student.class_id.in_(class_ids), Student.is_active == True)
            )
        )).scalar() or 0

    marks_count = (await db.execute(
        select(func.count()).where(Mark.teacher_id == teacher.id)
    )).scalar() or 0

    return TeacherDashboard(
        teacher_name=teacher.name,
        assigned_classes=len(class_ids),
        total_students=student_count,
        marks_recorded=marks_count,
    )