"""
schemas.py — Pydantic v2 request/response models.

Naming convention:
  XCreate  — fields the client sends when creating a resource
  XUpdate  — fields allowed on PATCH (all Optional)
  XOut     — what the API returns (never includes password_hash)
  XDetail  — richer Out that includes nested / computed data
"""

import re
import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, model_validator

from model import SubscriptionStatus, ExamType, DocumentType, Gender, ContentType


# ---------------------------------------------------------------------------
# Shared base
# ---------------------------------------------------------------------------

class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ============================================================
# SCHOOL
# ============================================================

class SchoolCreate(BaseModel):
    name:            str
    address:         str
    phone:           str
    email:           EmailStr
    registration_no: str

    @field_validator("name", "address", "phone", "registration_no")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


class SchoolUpdate(BaseModel):
    name:    Optional[str]      = None
    address: Optional[str]      = None
    phone:   Optional[str]      = None
    email:   Optional[EmailStr] = None


class SchoolSubscriptionUpdate(BaseModel):
    subscription_status:     SubscriptionStatus
    subscription_expires_at: Optional[datetime] = None
    is_active:               Optional[bool]     = None


class SchoolOut(ORMBase):
    id:                      uuid.UUID
    name:                    str
    address:                 str
    phone:                   str
    email:                   str
    registration_no:         str
    is_active:               bool
    subscription_status:     SubscriptionStatus
    subscription_expires_at: Optional[datetime]
    created_at:              datetime


class SchoolDocumentOut(ORMBase):
    id:            uuid.UUID
    school_id:     uuid.UUID
    document_type: DocumentType
    document_url:  str
    verified:      bool
    verified_at:   Optional[datetime]
    created_at:    datetime


# ============================================================
# DIRECTOR
# ============================================================

class DirectorCreate(BaseModel):
    name:     str
    email:    EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()


class DirectorUpdate(BaseModel):
    name:      Optional[str]      = None
    email:     Optional[EmailStr] = None
    is_active: Optional[bool]     = None


class DirectorOut(ORMBase):
    id:         uuid.UUID
    school_id:  uuid.UUID
    name:       str
    email:      str
    is_active:  bool
    created_at: datetime


# ============================================================
# TEACHER
# ============================================================

class TeacherCreate(BaseModel):
    name:              str
    email:             EmailStr
    password:          str
    subject_specialty: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()


class TeacherUpdate(BaseModel):
    name:              Optional[str]      = None
    email:             Optional[EmailStr] = None
    subject_specialty: Optional[str]      = None
    is_active:         Optional[bool]     = None


class TeacherOut(ORMBase):
    id:                uuid.UUID
    school_id:         uuid.UUID
    name:              str
    email:             str
    subject_specialty: Optional[str]
    is_active:         bool
    created_at:        datetime


# ============================================================
# SUBJECT
# ============================================================

class SubjectCreate(BaseModel):
    name:        str
    code:        str
    description: Optional[str] = None

    @field_validator("code")
    @classmethod
    def code_upper(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Subject name cannot be blank")
        return v.strip()


class SubjectUpdate(BaseModel):
    name:        Optional[str] = None
    description: Optional[str] = None


class SubjectOut(ORMBase):
    id:          uuid.UUID
    school_id:   uuid.UUID
    name:        str
    code:        str
    description: Optional[str]


# ============================================================
# CLASS
# ============================================================

def _validate_academic_year(v: str) -> str:
    if not re.match(r"^\d{4}-\d{4}$", v):
        raise ValueError("academic_year must be YYYY-YYYY, e.g. 2024-2025")
    parts = v.split("-")
    if int(parts[1]) != int(parts[0]) + 1:
        raise ValueError("academic_year end must be start + 1, e.g. 2024-2025")
    return v


class ClassCreate(BaseModel):
    name:          str
    grade_level:   str
    academic_year: str
    capacity:      Optional[int] = None

    @field_validator("academic_year")
    @classmethod
    def valid_year(cls, v: str) -> str:
        return _validate_academic_year(v)

    @field_validator("capacity")
    @classmethod
    def positive_capacity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 1:
            raise ValueError("Capacity must be at least 1")
        return v


class ClassUpdate(BaseModel):
    name:        Optional[str] = None
    grade_level: Optional[str] = None
    capacity:    Optional[int] = None


class ClassOut(ORMBase):
    id:            uuid.UUID
    school_id:     uuid.UUID
    name:          str
    grade_level:   str
    academic_year: str
    capacity:      Optional[int]
    created_at:    datetime


# ============================================================
# CLASS ASSIGNMENT
# ============================================================

class ClassAssignmentCreate(BaseModel):
    teacher_id: uuid.UUID
    class_id:   uuid.UUID
    subject_id: uuid.UUID


class ClassAssignmentOut(ORMBase):
    id:          uuid.UUID
    teacher_id:  uuid.UUID
    class_id:    uuid.UUID
    subject_id:  uuid.UUID
    assigned_by: Optional[uuid.UUID]
    created_at:  datetime


class ClassAssignmentDetail(ORMBase):
    """Includes resolved names for frontend display."""
    id:           uuid.UUID
    teacher_id:   uuid.UUID
    teacher_name: str
    class_id:     uuid.UUID
    class_name:   str
    subject_id:   uuid.UUID
    subject_name: str
    assigned_by:  Optional[uuid.UUID]
    created_at:   datetime


# ============================================================
# STUDENT
# ============================================================

class StudentCreate(BaseModel):
    class_id:        uuid.UUID
    name:            str
    date_of_birth:   Optional[date]   = None
    gender:          Optional[Gender] = None
    guardian_name:   Optional[str]    = None
    guardian_phone:  Optional[str]    = None
    enrollment_date: Optional[date]   = None

    @field_validator("name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Student name cannot be blank")
        return v.strip()


class StudentUpdate(BaseModel):
    name:           Optional[str]       = None
    class_id:       Optional[uuid.UUID] = None
    date_of_birth:  Optional[date]      = None
    gender:         Optional[Gender]    = None
    guardian_name:  Optional[str]       = None
    guardian_phone: Optional[str]       = None
    is_active:      Optional[bool]      = None


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
    created_at:      datetime


# ============================================================
# MARK
# ============================================================

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

    @model_validator(mode="after")
    def score_within_range(self) -> "MarkCreate":
        if self.score < 0:
            raise ValueError("Score cannot be negative")
        if self.score > self.max_score:
            raise ValueError(f"Score {self.score} exceeds max_score {self.max_score}")
        return self

    @field_validator("academic_year")
    @classmethod
    def valid_year(cls, v: str) -> str:
        return _validate_academic_year(v)

    @field_validator("term")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Term cannot be blank")
        return v.strip()


class MarkUpdate(BaseModel):
    score: Decimal
    notes: Optional[str] = None

    @field_validator("score")
    @classmethod
    def non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Score cannot be negative")
        return v


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
    updated_at:    datetime


# ============================================================
# REPORT
# ============================================================

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

    @model_validator(mode="after")
    def at_least_one(self) -> "ReportCommentUpdate":
        if self.teacher_comment is None and self.director_comment is None:
            raise ValueError("Provide at least one of teacher_comment or director_comment")
        return self


# ============================================================
# AUTH
# ============================================================

class LoginRequest(BaseModel):
    email:    EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    role:         str
    name:         str
    school_id:    Optional[uuid.UUID] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password:     str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("New password must be at least 8 characters")
        return v


# ============================================================
# DASHBOARD
# ============================================================

class DirectorDashboard(BaseModel):
    school_name:    str
    total_teachers: int
    total_students: int
    total_classes:  int
    total_subjects: int
    recent_reports: List[ReportOut] = []


class TeacherDashboard(BaseModel):
    teacher_name:     str
    assigned_classes: int
    total_students:   int
    marks_recorded:   int


# ============================================================
# CLASS REPORT (bulk generation response)
# ============================================================

class StudentReportSummary(BaseModel):
    student_id:    uuid.UUID
    student_name:  str
    average_score: Decimal
    total_score:   Decimal
    grade:         str
    class_rank:    int
    report_id:     uuid.UUID

    model_config = ConfigDict(from_attributes=True)


class ClassReportResponse(BaseModel):
    class_id:       uuid.UUID
    class_name:     str
    term:           str
    academic_year:  str
    total_students: int
    reports:        List[StudentReportSummary]


class ClassReportRequest(BaseModel):
    term:          str
    academic_year: str

    @field_validator("academic_year")
    @classmethod
    def valid_year(cls, v: str) -> str:
        return _validate_academic_year(v)