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
  const term     = req.nextUrl.searchParams.get("term")
  const year     = req.nextUrl.searchParams.get("academic_year")

  const url = new URL(`${BACKEND}/schools/${schoolId}/reports`)
  if (classId) url.searchParams.set("class_id",      classId)
  if (term)    url.searchParams.set("term",           term)
  if (year)    url.searchParams.set("academic_year",  year)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}