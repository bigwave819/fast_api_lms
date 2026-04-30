import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Dashboard — Admin console",
  description: "Platform-wide overview of schools, directors and activity.",
}

export default async function AdminDashboardPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "platform_admin") redirect("/auth/login")

  const [schoolsRes, directorsRes, statsRes] = await Promise.all([
    fetch(`${BACKEND}/admin/schools`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/admin/directors`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  const schools   = schoolsRes.ok   ? await schoolsRes.json()   : []
  const directors = directorsRes.ok ? await directorsRes.json() : []
  const stats     = statsRes.ok     ? await statsRes.json()     : null

  return (
    <AdminDashboardClient
      schools={schools}
      directors={directors}
      stats={stats}
      adminName={payload.name ?? "Admin"}
    />
  )
}