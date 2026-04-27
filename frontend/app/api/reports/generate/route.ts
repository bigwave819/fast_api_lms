import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

// Generate whole class
export async function POST(req: NextRequest) {
  const token   = await getToken()
  const body    = await req.json()
  const classId = req.nextUrl.searchParams.get("class_id")

  const res = await fetch(
    `${BACKEND}/reports/generate-class?class_id=${classId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ term: body.term, academic_year: body.academic_year }),
    }
  )
  return NextResponse.json(await res.json(), { status: res.status })
}