import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function PATCH(req: NextRequest) {
  const store = await cookies()
  const token = store.get("access_token")?.value
  const body  = await req.json()

  const res = await fetch(`${BACKEND}/auth/me/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  // backend returns 204 No Content on success
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json(), { status: res.status })
}