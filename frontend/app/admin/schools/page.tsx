import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminSchoolsClient } from "@/components/admin/AdminSchoolsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Schools — Admin console",
  description: "Manage all schools on the platform.",
}

export default async function AdminSchoolsPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "platform_admin") redirect("/auth/login")

  const [schoolsRes, directorsRes] = await Promise.all([
    fetch(`${BACKEND}/admin/schools`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/admin/directors`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  const schools   = schoolsRes.ok   ? await schoolsRes.json()   : []
  const directors = directorsRes.ok ? await directorsRes.json() : []

  return <AdminSchoolsClient schools={schools} directors={directors} />
}