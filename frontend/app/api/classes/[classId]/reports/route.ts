import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

type Ctx = { params: Promise<{ classId: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  const { classId } = await params
  const store = await cookies()
  const token = store.get("access_token")?.value

  const url  = new URL(`${BACKEND}/classes/${classId}/reports`)
  const term = req.nextUrl.searchParams.get("term")
  const year = req.nextUrl.searchParams.get("academic_year")
  if (term) url.searchParams.set("term",          term)
  if (year) url.searchParams.set("academic_year", year)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}