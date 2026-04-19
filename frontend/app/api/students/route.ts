import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

export async function GET(req: NextRequest) {
  const token    = await getToken()
  const schoolId = req.nextUrl.searchParams.get("schoolId")
  const classId  = req.nextUrl.searchParams.get("class_id")
  const isActive = req.nextUrl.searchParams.get("is_active")

  const url = new URL(`${BACKEND}/schools/${schoolId}/students`)
  if (classId)  url.searchParams.set("class_id",  classId)
  if (isActive) url.searchParams.set("is_active", isActive)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}