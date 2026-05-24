"""
routers/settings.py
Platform-wide configuration managed by the platform admin.
Stored as a single JSON row in the database.
"""

import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from core.database import get_db
from model import PlatformSettings, PlatformAdmin
from auth.dependencies import get_current_admin

router = APIRouter(prefix="/admin/settings", tags=["platform-settings"])


# ------------------------------------------------------------------ schemas

class PlatformSettingsUpdate(BaseModel):
    platform_name:       str | None = None
    default_academic_year: str | None = None
    default_term_names:  List[str] | None = None
    default_exam_types:  List[str] | None = None
    default_max_score:   int | None = None
    support_email:       str | None = None
    max_students_per_class: int | None = None


class PlatformSettingsOut(BaseModel):
    id:                     uuid.UUID
    platform_name:          str
    default_academic_year:  str
    default_term_names:     List[str]
    default_exam_types:     List[str]
    default_max_score:      int
    support_email:          str | None
    max_students_per_class: int | None

    class Config:
        from_attributes = True


# ------------------------------------------------------------------ routes

@router.get("", response_model=PlatformSettingsOut)
async def get_settings(
    admin: Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Get platform config. Creates defaults if none exist yet."""
    result = await db.execute(select(PlatformSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        # bootstrap defaults on first call
        settings = PlatformSettings(
            platform_name="EduPlatform",
            default_academic_year=_current_academic_year(),
            default_term_names=["Term 1", "Term 2", "Term 3"],
            default_exam_types=["CAT", "MID", "FINAL", "PRACTICAL", "ASSIGNMENT"],
            default_max_score=100,
            support_email=None,
            max_students_per_class=None,
        )
        db.add(settings)
        await db.flush()
        await db.refresh(settings)

    return settings


@router.patch("", response_model=PlatformSettingsOut)
async def update_settings(
    payload: PlatformSettingsUpdate,
    admin:   Annotated[PlatformAdmin, Depends(get_current_admin)],
    db: AsyncSession = Depends(get_db),
):
    """Update platform config. Creates row if it doesn't exist yet."""
    result = await db.execute(select(PlatformSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = PlatformSettings(
            platform_name=payload.platform_name or "EduPlatform",
            default_academic_year=payload.default_academic_year or _current_academic_year(),
            default_term_names=payload.default_term_names or ["Term 1", "Term 2", "Term 3"],
            default_exam_types=payload.default_exam_types or ["CAT", "MID", "FINAL", "PRACTICAL", "ASSIGNMENT"],
            default_max_score=payload.default_max_score or 100,
            support_email=payload.support_email,
            max_students_per_class=payload.max_students_per_class,
        )
        db.add(settings)
    else:
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(settings, field, value)

    await db.flush()
    await db.refresh(settings)
    return settings


# ------------------------------------------------------------------ helper

def _current_academic_year() -> str:
    from datetime import date
    y = date.today().year
    return f"{y}-{y + 1}"