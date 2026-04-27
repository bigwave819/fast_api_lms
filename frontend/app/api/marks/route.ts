import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

export async function GET(req: NextRequest) {
  const token   = await getToken()
  const url     = new URL(`${BACKEND}/marks`)
  const params  = ["student_id","subject_id","class_id","term","academic_year","exam_type"]
  params.forEach(p => {
    const v = req.nextUrl.searchParams.get(p)
    if (v) url.searchParams.set(p, v)
  })
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest) {
  const token = await getToken()
  const body  = await req.json()

  // use bulk endpoint always — handles single too
  const res = await fetch(`${BACKEND}/marks/bulk`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(Array.isArray(body) ? body : [body]),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}