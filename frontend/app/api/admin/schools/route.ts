import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

export async function GET(req: NextRequest) {
  const token    = await getToken()
  const isActive = req.nextUrl.searchParams.get("is_active")
  const url      = new URL(`${BACKEND}/admin/schools`)
  if (isActive) url.searchParams.set("is_active", isActive)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  const body  = await req.json()

  const res = await fetch(`${BACKEND}/admin/schools`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}