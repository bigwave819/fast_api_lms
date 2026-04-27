import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

type Ctx = { params: Promise<{ markId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { markId } = await params
  const store = await cookies()
  const token = store.get("access_token")?.value
  const body  = await req.json()

  const res = await fetch(`${BACKEND}/marks/${markId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const { markId } = await params
  const store = await cookies()
  const token = store.get("access_token")?.value

  const res = await fetch(`${BACKEND}/marks/${markId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json(), { status: res.status })
}