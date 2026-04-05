"""
schemas.py — Pydantic v2 models for request validation and API responses
"""

import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict

from model import SubscriptionStatus, ExamType, DocumentType, Gender


# ---------------------------------------------------------------------------
# Shared base config
# ---------------------------------------------------------------------------

class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# School
# ---------------------------------------------------------------------------

class SchoolCreate(BaseModel):
    name:            str
    address:         str
    phone:           str
    email:           EmailStr
    registration_no: str


class SchoolOut(ORMBase):
    id:                     uuid.UUID
    name:                   str
    email:                  str
    is_active:              bool
    subscription_status:    SubscriptionStatus
    subscription_expires_at: Optional[datetime]
    created_at:             datetime


class SchoolToggle(BaseModel):
    is_active:              bool
    subscription_status:    Optional[SubscriptionStatus] = None
    subscription_expires_at: Optional[datetime]          = None


# ---------------------------------------------------------------------------
# Director
# ---------------------------------------------------------------------------

class DirectorCreate(BaseModel):
    name:     str
    email:    EmailStr
    password: str


class DirectorOut(ORMBase):
    id:        uuid.UUID
    school_id: uuid.UUID
    name:      str
    email:     str
    is_active: bool


# ---------------------------------------------------------------------------
# Teacher
# ---------------------------------------------------------------------------

class TeacherCreate(BaseModel):
    name:              str
    email:             EmailStr
    password:          str
    subject_specialty: Optional[str] = None


class TeacherOut(ORMBase):
    id:                uuid.UUID
    school_id:         uuid.UUID
    name:              str
    email:             str
    subject_specialty: Optional[str]
    is_active:         bool


# ---------------------------------------------------------------------------
# Subject
# ---------------------------------------------------------------------------

class SubjectCreate(BaseModel):
    name:        str
    code:        str
    description: Optional[str] = None


class SubjectOut(ORMBase):
    id:          uuid.UUID
    school_id:   uuid.UUID
    name:        str
    code:        str
    description: Optional[str]


# ---------------------------------------------------------------------------
# Class
# ---------------------------------------------------------------------------

class ClassCreate(BaseModel):
    name:          str
    grade_level:   str
    academic_year: str
    capacity:      Optional[int] = None


class ClassOut(ORMBase):
    id:            uuid.UUID
    school_id:     uuid.UUID
    name:          str
    grade_level:   str
    academic_year: str
    capacity:      Optional[int]


# ---------------------------------------------------------------------------
# ClassAssignment  (director assigns teacher to class+subject)
# ---------------------------------------------------------------------------

class ClassAssignmentCreate(BaseModel):
    teacher_id: uuid.UUID
    class_id:   uuid.UUID
    subject_id: uuid.UUID


class ClassAssignmentOut(ORMBase):
    id:         uuid.UUID
    teacher_id: uuid.UUID
    class_id:   uuid.UUID
    subject_id: uuid.UUID
    assigned_by: Optional[uuid.UUID]


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------

class StudentCreate(BaseModel):
    class_id:        uuid.UUID
    name:            str
    date_of_birth:   Optional[date]   = None
    gender:          Optional[Gender] = None
    guardian_name:   Optional[str]    = None
    guardian_phone:  Optional[str]    = None
    enrollment_date: Optional[date]   = None


class StudentOut(ORMBase):
    id:              uuid.UUID
    school_id:       uuid.UUID
    class_id:        Optional[uuid.UUID]
    name:            str
    date_of_birth:   Optional[date]
    gender:          Optional[Gender]
    guardian_name:   Optional[str]
    guardian_phone:  Optional[str]
    enrollment_date: date
    is_active:       bool


# ---------------------------------------------------------------------------
# Mark
# ---------------------------------------------------------------------------

class MarkCreate(BaseModel):
    student_id:    uuid.UUID
    subject_id:    uuid.UUID
    class_id:      uuid.UUID
    exam_type:     ExamType
    score:         Decimal
    max_score:     Decimal = Decimal("100")
    term:          str
    academic_year: str
    notes:         Optional[str] = None


class MarkOut(ORMBase):
    id:            uuid.UUID
    student_id:    uuid.UUID
    subject_id:    uuid.UUID
    class_id:      uuid.UUID
    teacher_id:    Optional[uuid.UUID]
    exam_type:     ExamType
    score:         Decimal
    max_score:     Decimal
    term:          str
    academic_year: str
    notes:         Optional[str]
    created_at:    datetime


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

class ReportOut(ORMBase):
    id:               uuid.UUID
    student_id:       uuid.UUID
    class_id:         uuid.UUID
    school_id:        uuid.UUID
    term:             str
    academic_year:    str
    total_score:      Optional[Decimal]
    average_score:    Optional[Decimal]
    grade:            Optional[str]
    class_rank:       Optional[int]
    teacher_comment:  Optional[str]
    director_comment: Optional[str]
    generated_at:     datetime
    pdf_url:          Optional[str]


class ReportCommentUpdate(BaseModel):
    teacher_comment:  Optional[str] = None
    director_comment: Optional[str] = None