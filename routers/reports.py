"""
routers/reports.py
Report generation and retrieval.
Teachers generate reports. Directors view + comment on them.
"""

import uuid
from decimal import Decimal
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from core.database import get_db
from model import Teacher, Director, Student, Mark, Report, Class, ClassAssignment
from schema import (
    ReportOut, ReportCommentUpdate,
    ClassReportRequest, ClassReportResponse, StudentReportSummary,
)
from auth.dependencies import (
    get_current_teacher, get_current_director,
    require_teacher_in_school, require_director_in_school,
)

router = APIRouter(tags=["reports"])


# ------------------------------------------------------------------ helpers

def _calculate_grade(average: Decimal) -> str:
    if average >= 80: return "A"
    if average >= 70: return "B"
    if average >= 60: return "C"
    if average >= 50: return "D"
    return "F"


async def _assert_teacher_assigned_to_class(
    teacher_id: uuid.UUID,
    class_id:   uuid.UUID,
    db: AsyncSession,
) -> None:
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


# ------------------------------------------------------------------ generate for whole class

@router.post("/reports/generate-class", response_model=ClassReportResponse)
async def generate_class_reports(
    payload:  ClassReportRequest,
    class_id: uuid.UUID = Query(...),
    teacher:  Annotated[Teacher, Depends(get_current_teacher)] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate (or re-generate) reports for every student in a class.

    Logic:
     1. Load class + verify ownership
     2. Confirm teacher is assigned to this class
     3. Load all active students
     4. Load ALL marks for the class/term in ONE query (avoids N+1)
     5. Compute average per student
     6. Sort by average → assign rank by position
     7. Upsert one Report per student (safe to call multiple times)
    """
    class_ = await db.get(Class, class_id)
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")

    require_teacher_in_school(class_.school_id, teacher)
    await _assert_teacher_assigned_to_class(teacher.id, class_id, db)

    # Load active students
    students_result = await db.execute(
        select(Student).where(
            and_(Student.class_id == class_id, Student.is_active == True)
        )
    )
    students: List[Student] = students_result.scalars().all()

    if not students:
        raise HTTPException(status_code=400, detail="No active students in this class")

    # Load ALL marks for this class + term in one query
    marks_result = await db.execute(
        select(Mark).where(
            and_(
                Mark.class_id      == class_id,
                Mark.term          == payload.term,
                Mark.academic_year == payload.academic_year,
            )
        )
    )
    # Group by student_id in Python — avoids N+1
    marks_by_student: dict[uuid.UUID, List[Mark]] = {}
    for mark in marks_result.scalars().all():
        marks_by_student.setdefault(mark.student_id, []).append(mark)

    # First pass: compute averages
    student_stats: List[tuple[Student, Decimal, Decimal]] = []
    for student in students:
        s_marks = marks_by_student.get(student.id, [])
        if not s_marks:
            continue  # skip students with no marks yet
        total   = Decimal(str(round(sum(float(m.score) for m in s_marks), 2)))
        average = Decimal(str(round(float(total) / len(s_marks), 2)))
        student_stats.append((student, total, average))

    if not student_stats:
        raise HTTPException(
            status_code=400,
            detail=f"No marks recorded for term '{payload.term}' / {payload.academic_year}",
        )

    # Sort descending by average → rank = position in list
    student_stats.sort(key=lambda x: x[2], reverse=True)

    # Load existing reports for this class/term (for upsert)
    existing_result = await db.execute(
        select(Report).where(
            and_(
                Report.class_id      == class_id,
                Report.term          == payload.term,
                Report.academic_year == payload.academic_year,
            )
        )
    )
    existing_reports: dict[uuid.UUID, Report] = {
        r.student_id: r for r in existing_result.scalars().all()
    }

    summaries: List[StudentReportSummary] = []

    for rank, (student, total, average) in enumerate(student_stats, start=1):
        grade  = _calculate_grade(average)
        report = existing_reports.get(student.id)

        if report:
            # Update existing
            report.total_score   = total
            report.average_score = average
            report.grade         = grade
            report.class_rank    = rank
        else:
            # Create new
            report = Report(
                student_id=student.id,
                class_id=class_id,
                school_id=class_.school_id,
                term=payload.term,
                academic_year=payload.academic_year,
                total_score=total,
                average_score=average,
                grade=grade,
                class_rank=rank,
            )
            db.add(report)

        await db.flush()

        summaries.append(StudentReportSummary(
            student_id=student.id,
            student_name=student.name,
            average_score=average,
            total_score=total,
            grade=grade,
            class_rank=rank,
            report_id=report.id,
        ))

    return ClassReportResponse(
        class_id=class_id,
        class_name=class_.name,
        term=payload.term,
        academic_year=payload.academic_year,
        total_students=len(summaries),
        reports=summaries,
    )


# ------------------------------------------------------------------ generate for one student

@router.post("/reports/generate", response_model=ReportOut)
async def generate_single_report(
    student_id:    uuid.UUID,
    term:          str,
    academic_year: str,
    teacher: Annotated[Teacher, Depends(get_current_teacher)] = None,
    db: AsyncSession = Depends(get_db),
):
    """Generate or re-generate a report for one student."""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    require_teacher_in_school(student.school_id, teacher)
    await _assert_teacher_assigned_to_class(teacher.id, student.class_id, db)

    marks_result = await db.execute(
        select(Mark).where(
            and_(
                Mark.student_id    == student_id,
                Mark.term          == term,
                Mark.academic_year == academic_year,
            )
        )
    )
    marks = marks_result.scalars().all()
    if not marks:
        raise HTTPException(status_code=400, detail="No marks found for this student/term")

    total   = Decimal(str(round(sum(float(m.score) for m in marks), 2)))
    average = Decimal(str(round(float(total) / len(marks), 2)))
    grade   = _calculate_grade(average)

    # Rank: count reports in same class/term that have a higher average
    better_count = (await db.execute(
        select(func.count()).where(
            and_(
                Report.class_id      == student.class_id,
                Report.term          == term,
                Report.academic_year == academic_year,
                Report.average_score > average,
            )
        )
    )).scalar() or 0
    rank = better_count + 1

    existing = (await db.execute(
        select(Report).where(
            and_(
                Report.student_id    == student_id,
                Report.term          == term,
                Report.academic_year == academic_year,
            )
        )
    )).scalar_one_or_none()

    if existing:
        existing.total_score   = total
        existing.average_score = average
        existing.grade         = grade
        existing.class_rank    = rank
        report = existing
    else:
        report = Report(
            student_id=student_id,
            class_id=student.class_id,
            school_id=student.school_id,
            term=term,
            academic_year=academic_year,
            total_score=total,
            average_score=average,
            grade=grade,
            class_rank=rank,
        )
        db.add(report)

    await db.flush()
    await db.refresh(report)
    return report


# ------------------------------------------------------------------ view reports

@router.get("/students/{student_id}/reports", response_model=List[ReportOut])
async def get_student_reports(
    student_id: uuid.UUID,
    teacher: Annotated[Teacher, Depends(get_current_teacher)] = None,
    db: AsyncSession = Depends(get_db),
):
    """All reports for a student, newest first."""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    require_teacher_in_school(student.school_id, teacher)
    await _assert_teacher_assigned_to_class(teacher.id, student.class_id, db)

    result = await db.execute(
        select(Report)
        .where(Report.student_id == student_id)
        .order_by(Report.generated_at.desc())
    )
    return result.scalars().all()


@router.get("/classes/{class_id}/reports", response_model=List[ReportOut])
async def get_class_reports(
    class_id:      uuid.UUID,
    term:          str | None = Query(None),
    academic_year: str | None = Query(None),
    teacher: Annotated[Teacher, Depends(get_current_teacher)] = None,
    db: AsyncSession = Depends(get_db),
):
    """All reports for a class, ordered by rank."""
    class_ = await db.get(Class, class_id)
    if not class_:
        raise HTTPException(status_code=404, detail="Class not found")

    require_teacher_in_school(class_.school_id, teacher)
    await _assert_teacher_assigned_to_class(teacher.id, class_id, db)

    conditions = [Report.class_id == class_id]
    if term:          conditions.append(Report.term          == term)
    if academic_year: conditions.append(Report.academic_year == academic_year)

    result = await db.execute(
        select(Report).where(and_(*conditions)).order_by(Report.class_rank.asc().nullslast())
    )
    return result.scalars().all()


# ------------------------------------------------------------------ director: school-wide reports

@router.get("/schools/{school_id}/reports", response_model=List[ReportOut])
async def director_get_reports(
    school_id:     uuid.UUID,
    class_id:      uuid.UUID | None = Query(None),
    term:          str | None       = Query(None),
    academic_year: str | None       = Query(None),
    director: Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    """Director views all reports across the school."""
    require_director_in_school(school_id, director)

    conditions = [Report.school_id == school_id]
    if class_id:      conditions.append(Report.class_id      == class_id)
    if term:          conditions.append(Report.term          == term)
    if academic_year: conditions.append(Report.academic_year == academic_year)

    result = await db.execute(
        select(Report)
        .where(and_(*conditions))
        .order_by(Report.generated_at.desc())
    )
    return result.scalars().all()


# ------------------------------------------------------------------ comments

@router.patch("/reports/{report_id}/comment", response_model=ReportOut)
async def add_comment(
    report_id: uuid.UUID,
    payload:   ReportCommentUpdate,
    teacher:   Annotated[Teacher,  Depends(get_current_teacher)]  = None,
    director:  Annotated[Director, Depends(get_current_director)] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Add a comment to a report.
    - Teacher can set teacher_comment only.
    - Director can set director_comment only.
    Both roles enforce their own field.
    """
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if teacher:
        require_teacher_in_school(report.school_id, teacher)
        if payload.teacher_comment is not None:
            report.teacher_comment = payload.teacher_comment

    if director:
        require_director_in_school(report.school_id, director)
        if payload.director_comment is not None:
            report.director_comment = payload.director_comment

    await db.flush()
    await db.refresh(report)
    return report