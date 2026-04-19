import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

type Ctx = { params: { subjectId: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const token = await getToken()
  const { schoolId, ...body } = await req.json()

  const res = await fetch(
    `${BACKEND}/schools/${schoolId}/subjects/${params.subjectId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const token = await getToken()
  const schoolId = req.nextUrl.searchParams.get("schoolId")

  const res = await fetch(
    `${BACKEND}/schools/${schoolId}/subjects/${params.subjectId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json(), { status: res.status })
}