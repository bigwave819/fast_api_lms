// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"
const COOKIE_NAME = "access_token"
const MAX_AGE = 60 * 60 * 8 // 8 hours — matches backend token expiry

export async function POST(req: NextRequest) {
  const body = await req.json()

  const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({ detail: "Login failed" }))
    return NextResponse.json(
      { detail: error.detail ?? "Login failed" },
      { status: backendRes.status }
    )
  }

  const data: { access_token: string; role: string; name: string } =
    await backendRes.json()

  const response = NextResponse.json({ role: data.role, name: data.name })

  // Set the token in a secure httpOnly cookie — JS cannot read this
  response.cookies.set(COOKIE_NAME, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  })

  return response
}