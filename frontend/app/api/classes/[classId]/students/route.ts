import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getToken() {
  const store = await cookies()
  return store.get("access_token")?.value
}

type Ctx = { params: { classId: string } }

export async function GET(_: NextRequest, { params }: Ctx) {
  const token = await getToken()

  const res = await fetch(
    `${BACKEND}/classes/${params.classId}/students`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  )
  return NextResponse.json(await res.json(), { status: res.status })
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const token = await getToken()
  const body  = await req.json()

  const res = await fetch(
    `${BACKEND}/classes/${params.classId}/students`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )
  return NextResponse.json(await res.json(), { status: res.status })
}