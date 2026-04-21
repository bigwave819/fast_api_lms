import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

type Ctx = { params: { reportId: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const store = await cookies()
  const token = store.get("access_token")?.value
  const body  = await req.json()

  const res = await fetch(
    `${BACKEND}/reports/${params.reportId}/comment`,
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