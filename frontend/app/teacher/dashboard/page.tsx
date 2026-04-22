import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TeacherDashboardClient } from "@/components/teacher/TeacherDashboardClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Dashboard — Teacher portal",
  description: "Your teaching overview: assigned classes, students and marks recorded.",
}

export default async function TeacherDashboardPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "teacher") redirect("/auth/login")

  const [dashRes, classesRes] = await Promise.all([
    fetch(`${BACKEND}/teachers/me/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/teachers/me/classes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  if (!dashRes.ok) redirect("/auth/login")

  const dashboard = await dashRes.json()
  const classes   = classesRes.ok ? await classesRes.json() : []

  return (
    <TeacherDashboardClient
      dashboard={dashboard}
      classes={classes}
      teacherName={payload.name ?? "Teacher"}
    />
  )
}