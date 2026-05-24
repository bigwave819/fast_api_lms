import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

export async function GET() {
  const token = await getToken()
  const res   = await fetch(`${BACKEND}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function PATCH(req: NextRequest) {
  const token = await getToken()
  const body  = await req.json()

  const res = await fetch(`${BACKEND}/admin/settings`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  return NextResponse.json(await res.json(), { status: res.status })
}