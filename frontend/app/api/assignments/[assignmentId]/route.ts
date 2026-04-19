import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

type Ctx = { params: { assignmentId: string } }

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const store = await cookies()
  const token = store.get("access_token")?.value
  const schoolId = req.nextUrl.searchParams.get("schoolId")

  const res = await fetch(
    `${BACKEND}/schools/${schoolId}/assignments/${params.assignmentId}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  )

  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json(), { status: res.status })
}