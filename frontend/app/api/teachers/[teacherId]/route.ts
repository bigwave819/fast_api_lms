import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

export async function PATCH(req: NextRequest, { params }: { params: { teacherId: string } }) {
  const token = await getToken()
  const { schoolId, ...body } = await req.json()

  const res = await fetch(`${BACKEND}/schools/${schoolId}/teachers/${params.teacherId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function DELETE(_: NextRequest, { params }: { params: { teacherId: string } }) {
  const token = await getToken()
  const store = await cookies()
  const payload = JSON.parse(atob(store.get("access_token")!.value.split(".")[1]))

  const res = await fetch(
    `${BACKEND}/schools/${payload.school_id}/teachers/${params.teacherId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  )
  return new NextResponse(null, { status: res.status })
}