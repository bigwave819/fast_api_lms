"""
School Management System - SQLAlchemy Models
Stack: FastAPI + SQLAlchemy (async) + PostgreSQL
"""

import uuid
import enum
from datetime import datetime, date
from typing import Optional, List

from sqlalchemy import (
    Column, String, Boolean, Integer, Decimal,
    ForeignKey, Text, Date, Enum as SAEnum,
    UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.sql import func
from sqlalchemy import DateTime


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class SubscriptionStatus(str, enum.Enum):
    trial   = "trial"
    active  = "active"
    expired = "expired"


class DocumentType(str, enum.Enum):
    license       = "license"
    tax_cert      = "tax_cert"
    accreditation = "accreditation"
    other         = "other"


class ExamType(str, enum.Enum):
    quiz     = "quiz"
    cat      = "cat"
    mid_term = "mid_term"
    end_term = "end_term"


class UserRole(str, enum.Enum):
    platform_admin = "platform_admin"
    director       = "director"
    teacher        = "teacher"
    student        = "student"


class Gender(str, enum.Enum):
    male   = "male"
    female = "female"
    other  = "other"


class ContentType(str, enum.Enum):
    video = "video"
    pdf   = "pdf"
    text  = "text"


# ---------------------------------------------------------------------------
# Mixins
# ---------------------------------------------------------------------------

class TimestampMixin:
    """Adds created_at and updated_at to any model."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class UUIDMixin:
    """Uses UUID as primary key."""
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)


# ---------------------------------------------------------------------------
# Platform owner (super admin — you)
# ---------------------------------------------------------------------------

class PlatformAdmin(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "platform_admins"

    name          = Column(String(120), nullable=False)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active     = Column(Boolean, default=True, nullable=False)

    # Relationships
    schools_verified: List["School"] = relationship(
        "School", back_populates="verified_by_admin", foreign_keys="School.verified_by"
    )
    documents_verified: List["SchoolDocument"] = relationship(
        "SchoolDocument", back_populates="verified_by_admin"
    )


# ---------------------------------------------------------------------------
# School
# ---------------------------------------------------------------------------

class School(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "schools"

    name                    = Column(String(200), nullable=False)
    address                 = Column(Text, nullable=False)
    phone                   = Column(String(30), nullable=False)
    email                   = Column(String(255), unique=True, nullable=False, index=True)
    registration_no         = Column(String(100), unique=True, nullable=False)
    is_active               = Column(Boolean, default=False, nullable=False)   # off until verified + subscribed
    subscription_status     = Column(SAEnum(SubscriptionStatus), default=SubscriptionStatus.trial, nullable=False)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    verified_by             = Column(UUID(as_uuid=True), ForeignKey("platform_admins.id"), nullable=True)

    # Relationships
    verified_by_admin: Optional["PlatformAdmin"] = relationship(
        "PlatformAdmin", back_populates="schools_verified", foreign_keys=[verified_by]
    )
    documents:  List["SchoolDocument"]  = relationship("SchoolDocument",  back_populates="school", cascade="all, delete-orphan")
    directors:  List["Director"]        = relationship("Director",         back_populates="school", cascade="all, delete-orphan")
    teachers:   List["Teacher"]         = relationship("Teacher",          back_populates="school", cascade="all, delete-orphan")
    students:   List["Student"]         = relationship("Student",          back_populates="school", cascade="all, delete-orphan")
    classes:    List["Class"]           = relationship("Class",            back_populates="school", cascade="all, delete-orphan")
    subjects:   List["Subject"]         = relationship("Subject",          back_populates="school", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# School registration documents
# ---------------------------------------------------------------------------

class SchoolDocument(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "school_documents"

    school_id     = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type = Column(SAEnum(DocumentType), nullable=False)
    document_url  = Column(String(500), nullable=False)
    verified      = Column(Boolean, default=False, nullable=False)
    verified_by   = Column(UUID(as_uuid=True), ForeignKey("platform_admins.id"), nullable=True)
    verified_at   = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    school:             "School"               = relationship("School",        back_populates="documents")
    verified_by_admin:  Optional["PlatformAdmin"] = relationship("PlatformAdmin", back_populates="documents_verified")


# ---------------------------------------------------------------------------
# Director  (one school, full academic control within it)
# ---------------------------------------------------------------------------

class Director(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "directors"

    school_id     = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name          = Column(String(120), nullable=False)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active     = Column(Boolean, default=True, nullable=False)

    # Relationships
    school:           "School"                  = relationship("School",          back_populates="directors")
    class_assignments: List["ClassAssignment"]  = relationship("ClassAssignment", back_populates="assigned_by_director")


# ---------------------------------------------------------------------------
# Teacher
# ---------------------------------------------------------------------------

class Teacher(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "teachers"

    school_id         = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name              = Column(String(120), nullable=False)
    email             = Column(String(255), unique=True, nullable=False, index=True)
    password_hash     = Column(String(255), nullable=False)
    subject_specialty = Column(String(100), nullable=True)
    is_active         = Column(Boolean, default=True, nullable=False)

    # Relationships
    school:           "School"                 = relationship("School",          back_populates="teachers")
    class_assignments: List["ClassAssignment"] = relationship("ClassAssignment", back_populates="teacher")
    marks:             List["Mark"]            = relationship("Mark",            back_populates="teacher")
    students_added:    List["Student"]         = relationship("Student",         back_populates="added_by_teacher")


# ---------------------------------------------------------------------------
# Subject
# ---------------------------------------------------------------------------

class Subject(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "subjects"
    __table_args__ = (
        UniqueConstraint("school_id", "code", name="uq_subject_school_code"),
    )

    school_id   = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(100), nullable=False)
    code        = Column(String(20),  nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    school:           "School"                 = relationship("School",          back_populates="subjects")
    class_assignments: List["ClassAssignment"] = relationship("ClassAssignment", back_populates="subject")
    marks:             List["Mark"]            = relationship("Mark",            back_populates="subject")


# ---------------------------------------------------------------------------
# Class  (e.g. "S3 A", "Form 4B")
# ---------------------------------------------------------------------------

class Class(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "classes"

    school_id     = Column(UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name          = Column(String(50),  nullable=False)
    grade_level   = Column(String(20),  nullable=False)
    academic_year = Column(String(9),   nullable=False)     # e.g. "2024-2025"
    capacity      = Column(Integer,     nullable=True)

    # Relationships
    school:           "School"                 = relationship("School",          back_populates="classes")
    class_assignments: List["ClassAssignment"] = relationship("ClassAssignment", back_populates="class_")
    students:          List["Student"]         = relationship("Student",         back_populates="class_")
    marks:             List["Mark"]            = relationship("Mark",            back_populates="class_")
    reports:           List["Report"]          = relationship("Report",          back_populates="class_")


# ---------------------------------------------------------------------------
# ClassAssignment  (junction: teacher ↔ class ↔ subject, assigned by director)
# ---------------------------------------------------------------------------

class ClassAssignment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "class_assignments"
    __table_args__ = (
        UniqueConstraint("teacher_id", "class_id", "subject_id", name="uq_teacher_class_subject"),
    )

    teacher_id   = Column(UUID(as_uuid=True), ForeignKey("teachers.id",  ondelete="CASCADE"), nullable=False, index=True)
    class_id     = Column(UUID(as_uuid=True), ForeignKey("classes.id",   ondelete="CASCADE"), nullable=False, index=True)
    subject_id   = Column(UUID(as_uuid=True), ForeignKey("subjects.id",  ondelete="CASCADE"), nullable=False, index=True)
    assigned_by  = Column(UUID(as_uuid=True), ForeignKey("directors.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    teacher:              "Teacher"           = relationship("Teacher",  back_populates="class_assignments")
    class_:               "Class"             = relationship("Class",    back_populates="class_assignments")
    subject:              "Subject"           = relationship("Subject",  back_populates="class_assignments")
    assigned_by_director: Optional["Director"] = relationship("Director", back_populates="class_assignments")


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------

class Student(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "students"

    school_id       = Column(UUID(as_uuid=True), ForeignKey("schools.id",  ondelete="CASCADE"), nullable=False, index=True)
    class_id        = Column(UUID(as_uuid=True), ForeignKey("classes.id",  ondelete="SET NULL"), nullable=True,  index=True)
    added_by        = Column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    name            = Column(String(120), nullable=False)
    date_of_birth   = Column(Date,        nullable=True)
    gender          = Column(SAEnum(Gender), nullable=True)
    guardian_name   = Column(String(120), nullable=True)
    guardian_phone  = Column(String(30),  nullable=True)
    enrollment_date = Column(Date,        default=date.today, nullable=False)
    is_active       = Column(Boolean,     default=True, nullable=False)

    # Relationships
    school:          "School"         = relationship("School",  back_populates="students")
    class_:          Optional["Class"] = relationship("Class",   back_populates="students")
    added_by_teacher: Optional["Teacher"] = relationship("Teacher", back_populates="students_added")
    marks:           List["Mark"]     = relationship("Mark",    back_populates="student", cascade="all, delete-orphan")
    reports:         List["Report"]   = relationship("Report",  back_populates="student", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Mark / Grade
# ---------------------------------------------------------------------------

class Mark(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "marks"
    __table_args__ = (
        UniqueConstraint("student_id", "subject_id", "exam_type", "term", "academic_year",
                         name="uq_mark_per_exam"),
        Index("ix_marks_student_term", "student_id", "term", "academic_year"),
    )

    student_id    = Column(UUID(as_uuid=True), ForeignKey("students.id",  ondelete="CASCADE"), nullable=False, index=True)
    subject_id    = Column(UUID(as_uuid=True), ForeignKey("subjects.id",  ondelete="CASCADE"), nullable=False, index=True)
    class_id      = Column(UUID(as_uuid=True), ForeignKey("classes.id",   ondelete="CASCADE"), nullable=False, index=True)
    teacher_id    = Column(UUID(as_uuid=True), ForeignKey("teachers.id",  ondelete="SET NULL"), nullable=True)
    exam_type     = Column(SAEnum(ExamType),   nullable=False)
    score         = Column(Decimal(5, 2),      nullable=False)
    max_score     = Column(Decimal(5, 2),      nullable=False, default=100)
    term          = Column(String(20),         nullable=False)    # e.g. "Term 1"
    academic_year = Column(String(9),          nullable=False)    # e.g. "2024-2025"
    notes         = Column(Text,               nullable=True)

    # Relationships
    student: "Student"         = relationship("Student", back_populates="marks")
    subject: "Subject"         = relationship("Subject", back_populates="marks")
    class_:  "Class"           = relationship("Class",   back_populates="marks")
    teacher: Optional["Teacher"] = relationship("Teacher", back_populates="marks")


# ---------------------------------------------------------------------------
# Report  (auto-generated per student per term)
# ---------------------------------------------------------------------------

class Report(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reports"
    __table_args__ = (
        UniqueConstraint("student_id", "term", "academic_year", name="uq_report_per_term"),
    )

    student_id       = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id         = Column(UUID(as_uuid=True), ForeignKey("classes.id",  ondelete="CASCADE"), nullable=False, index=True)
    school_id        = Column(UUID(as_uuid=True), ForeignKey("schools.id",  ondelete="CASCADE"), nullable=False, index=True)
    term             = Column(String(20),    nullable=False)
    academic_year    = Column(String(9),     nullable=False)
    total_score      = Column(Decimal(7, 2), nullable=True)
    average_score    = Column(Decimal(5, 2), nullable=True)
    grade            = Column(String(5),     nullable=True)    # A, B, C, D, F
    class_rank       = Column(Integer,       nullable=True)
    teacher_comment  = Column(Text,          nullable=True)
    director_comment = Column(Text,          nullable=True)
    generated_at     = Column(DateTime(timezone=True), server_default=func.now())
    pdf_url          = Column(String(500),   nullable=True)

    # Relationships
    student: "Student" = relationship("Student", back_populates="reports")
    class_:  "Class"   = relationship("Class",   back_populates="reports")
    school:  "School"  = relationship("School")


# ---------------------------------------------------------------------------
# ---- FUTURE EXPANSION ----
# ---------------------------------------------------------------------------

class LearningMaterial(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "learning_materials"

    school_id    = Column(UUID(as_uuid=True), ForeignKey("schools.id",   ondelete="CASCADE"), nullable=False, index=True)
    subject_id   = Column(UUID(as_uuid=True), ForeignKey("subjects.id",  ondelete="CASCADE"), nullable=False, index=True)
    class_id     = Column(UUID(as_uuid=True), ForeignKey("classes.id",   ondelete="CASCADE"), nullable=False, index=True)
    teacher_id   = Column(UUID(as_uuid=True), ForeignKey("teachers.id",  ondelete="SET NULL"), nullable=True)
    title        = Column(String(200),        nullable=False)
    content_type = Column(SAEnum(ContentType), nullable=False)
    file_url     = Column(String(500),        nullable=True)
    body         = Column(Text,               nullable=True)     # for text content
    is_published = Column(Boolean,            default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)


class Quiz(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "quizzes"

    school_id       = Column(UUID(as_uuid=True), ForeignKey("schools.id",   ondelete="CASCADE"), nullable=False, index=True)
    subject_id      = Column(UUID(as_uuid=True), ForeignKey("subjects.id",  ondelete="CASCADE"), nullable=False, index=True)
    class_id        = Column(UUID(as_uuid=True), ForeignKey("classes.id",   ondelete="CASCADE"), nullable=False, index=True)
    teacher_id      = Column(UUID(as_uuid=True), ForeignKey("teachers.id",  ondelete="SET NULL"), nullable=True)
    title           = Column(String(200),  nullable=False)
    time_limit_mins = Column(Integer,      nullable=True)
    due_date        = Column(DateTime(timezone=True), nullable=True)
    is_published    = Column(Boolean,      default=False)

    questions:    List["QuizQuestion"]    = relationship("QuizQuestion",    back_populates="quiz", cascade="all, delete-orphan")
    submissions:  List["QuizSubmission"]  = relationship("QuizSubmission",  back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(UUIDMixin, Base):
    __tablename__ = "quiz_questions"

    quiz_id         = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text   = Column(Text,         nullable=False)
    options         = Column(Text,         nullable=True)    # JSON string: ["A","B","C","D"]
    correct_answer  = Column(String(255),  nullable=False)
    marks           = Column(Decimal(4,1), default=1, nullable=False)
    order           = Column(Integer,      default=0)

    quiz: "Quiz" = relationship("Quiz", back_populates="questions")


class QuizSubmission(UUIDMixin, Base):
    __tablename__ = "quiz_submissions"
    __table_args__ = (
        UniqueConstraint("quiz_id", "student_id", name="uq_one_submission_per_student"),
    )

    quiz_id      = Column(UUID(as_uuid=True), ForeignKey("quizzes.id",   ondelete="CASCADE"), nullable=False, index=True)
    student_id   = Column(UUID(as_uuid=True), ForeignKey("students.id",  ondelete="CASCADE"), nullable=False, index=True)
    answers      = Column(Text,         nullable=True)    # JSON string
    score        = Column(Decimal(5,2), nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz:    "Quiz"    = relationship("Quiz",    back_populates="submissions")
    student: "Student" = relationship("Student")