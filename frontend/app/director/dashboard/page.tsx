
// app/director/dashboard/page.tsx
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DirectorDashboard } from "@/components/director/DirectorDashboard"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000"

async function getDirectorDashboard(schoolId: string, token: string) {
  const res = await fetch(`${BACKEND_URL}/schools/${schoolId}/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DirectorDashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) redirect("/auth/login")

  // Decode school_id from the JWT payload (no verification needed — just reading)
  const payload = JSON.parse(atob(token.split(".")[1]))
  const schoolId: string = payload.school_id
  if (!schoolId) redirect("/auth/login")

  const data = await getDirectorDashboard(schoolId, token)
  if (!data) redirect("/auth/login")

  return <DirectorDashboard data={data} />
}