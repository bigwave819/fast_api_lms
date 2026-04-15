"""
seed_admin.py — Run once to create your platform admin account.

Usage:
    python seed_admin.py

Never expose this as an API endpoint. The admin account is created
directly in the database and only needs to be done once.
"""

import asyncio
import os
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

# --- adjust this import path if you run from a subfolder
from model import Base, PlatformAdmin

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -----------------------------------------------------------------------
# Change these before running
# -----------------------------------------------------------------------
ADMIN_NAME     = "Hirwa Tresor"
ADMIN_EMAIL    = "waveb6133@gmail.com"
ADMIN_PASSWORD = "HiRw!!2"
# -----------------------------------------------------------------------


async def seed():
    engine = create_async_engine(DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with Session() as db:
        # Check if admin already exists
        existing = await db.execute(
            select(PlatformAdmin).where(PlatformAdmin.email == ADMIN_EMAIL)
        )
        if existing.scalar_one_or_none():
            print(f"Admin with email '{ADMIN_EMAIL}' already exists. Nothing created.")
            return

        admin = PlatformAdmin(
            name=ADMIN_NAME,
            email=ADMIN_EMAIL,
            password_hash=pwd_ctx.hash(ADMIN_PASSWORD),
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        await db.refresh(admin)

        print("Platform admin created successfully.")
        print(f"  ID:    {admin.id}")
        print(f"  Name:  {admin.name}")
        print(f"  Email: {admin.email}")
        print()
        print("You can now log in at POST /auth/login with these credentials.")
        print("Keep this password safe — there is no password reset endpoint yet.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())