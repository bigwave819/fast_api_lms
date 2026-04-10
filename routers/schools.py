"""
routers/schools.py
Platform-admin routes for registering, toggling, and managing schools.
All routes require a valid platform_admin JWT.
"""

import uuid
from datetime import datetime, timezone
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from model import School, SchoolDocument, Director, DocumentType
from schema import (
    SchoolCreate, SchoolUpdate, SchoolOut,
    SchoolSubscriptionUpdate, SchoolDocumentOut,
    DirectorCreate, DirectorOut,
)
from auth.dependencies import get_current_admin
from auth.router import hash_password

router = APIRouter(prefix="/admin", tags=["admin — schools"])


# ------------------------------------------------------------------ helpers

async def _get_school_or_404(school_id: uuid.UUID, db: AsyncSession) -> School:
    school = await db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school


# ------------------------------------------------------------------ schools

@router.post("/schools", response_model=SchoolOut, status_code=201)
async def create_school(
    payload: SchoolCreate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Register a new school (starts as inactive / trial)."""
    # Duplicate email / registration_no check
    dup = await db.execute(
        select(School).where(
            (School.email == payload.email) |
            (School.registration_no == payload.registration_no)
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="A school with this email or registration number already exists",
        )

    school = School(**payload.model_dump())
    db.add(school)
    await db.flush()
    await db.refresh(school)
    return school


@router.get("/schools", response_model=List[SchoolOut])
async def list_schools(
    is_active: bool | None = Query(None, description="Filter by active status"),
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all schools with optional active filter."""
    q = select(School).order_by(School.created_at.desc())
    if is_active is not None:
        q = q.where(School.is_active == is_active)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/schools/{school_id}", response_model=SchoolOut)
async def get_school(
    school_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    return await _get_school_or_404(school_id, db)


@router.patch("/schools/{school_id}", response_model=SchoolOut)
async def update_school(
    school_id: uuid.UUID,
    payload: SchoolUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update basic school info (name, address, phone, email)."""
    school = await _get_school_or_404(school_id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(school, field, value)
    await db.flush()
    await db.refresh(school)
    return school


@router.patch("/schools/{school_id}/subscription", response_model=SchoolOut)
async def update_subscription(
    school_id: uuid.UUID,
    payload: SchoolSubscriptionUpdate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update subscription status and optionally activate/deactivate.
    Typical flow:
      - School pays → status=active, is_active=True, expires_at=<date>
      - School doesn't pay → status=expired, is_active=False
    """
    school = await _get_school_or_404(school_id, db)
    school.subscription_status     = payload.subscription_status
    school.subscription_expires_at = payload.subscription_expires_at

    if payload.is_active is not None:
        school.is_active = payload.is_active

    await db.flush()
    await db.refresh(school)
    return school


@router.delete("/schools/{school_id}", status_code=204)
async def deactivate_school(
    school_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Deactivate a school (soft delete — data is preserved).
    Use the subscription endpoint to re-activate.
    """
    school = await _get_school_or_404(school_id, db)
    school.is_active = False
    await db.flush()


# ------------------------------------------------------------------ documents

@router.get("/schools/{school_id}/documents", response_model=List[SchoolDocumentOut])
async def list_documents(
    school_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    await _get_school_or_404(school_id, db)
    result = await db.execute(
        select(SchoolDocument).where(SchoolDocument.school_id == school_id)
    )
    return result.scalars().all()


@router.post("/schools/{school_id}/documents/{document_id}/verify", response_model=SchoolDocumentOut)
async def verify_document(
    school_id:   uuid.UUID,
    document_id: uuid.UUID,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Mark a registration document as verified."""
    doc = await db.get(SchoolDocument, document_id)
    if not doc or doc.school_id != school_id:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.verified    = True
    doc.verified_by = admin.id
    doc.verified_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(doc)
    return doc


# ------------------------------------------------------------------ seed director

@router.post("/schools/{school_id}/directors", response_model=DirectorOut, status_code=201)
async def create_director(
    school_id: uuid.UUID,
    payload:   DirectorCreate,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Create the first director for a school.
    Directors can be created by the platform admin, or later by other directors.
    """
    school = await _get_school_or_404(school_id, db)

    dup = await db.execute(select(Director).where(Director.email == payload.email))
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already in use")

    director = Director(
        school_id=school_id,
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(director)
    await db.flush()
    await db.refresh(director)
    return director