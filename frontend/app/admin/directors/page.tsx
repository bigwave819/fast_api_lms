import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminDirectorsClient } from "@/components/admin/AdminDirectorsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Directors — Admin console",
  description: "Manage director accounts and school assignments.",
}

export default async function AdminDirectorsPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "platform_admin") redirect("/auth/login")

  const [directorsRes, schoolsRes] = await Promise.all([
    fetch(`${BACKEND}/admin/directors`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/admin/schools`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  const directors = directorsRes.ok ? await directorsRes.json() : []
  const schools   = schoolsRes.ok   ? await schoolsRes.json()   : []

  return <AdminDirectorsClient directors={directors} schools={schools} />
}