import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

type Ctx = { params: { studentId: string } }

export async function GET(_: NextRequest, { params }: Ctx) {
  const token = await getToken()
  const store = await cookies()
  const p     = JSON.parse(atob(store.get("access_token")!.value.split(".")[1]))

  const res = await fetch(
    `${BACKEND}/schools/${p.school_id}/students/${params.studentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const token           = await getToken()
  const { schoolId, ...body } = await req.json()

  const res = await fetch(`${BACKEND}/students/${params.studentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}