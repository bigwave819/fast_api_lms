import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

export async function GET(req: NextRequest) {
  const token = await getToken()
  const schoolId = req.nextUrl.searchParams.get("schoolId")
  const classId = req.nextUrl.searchParams.get("class_id")
  const teacherId = req.nextUrl.searchParams.get("teacher_id")

  const url = new URL(`${BACKEND}/schools/${schoolId}/assignments`)
  if (classId)   url.searchParams.set("class_id", classId)
  if (teacherId) url.searchParams.set("teacher_id", teacherId)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  const { schoolId, ...body } = await req.json()

  const res = await fetch(`${BACKEND}/schools/${schoolId}/assignments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}