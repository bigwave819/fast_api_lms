import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ClassesListClient } from "@/components/teacher/ClassesListClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "My classes — Teacher portal",
  description: "All classes and subjects you are assigned to teach.",
}

export default async function TeacherClassesPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "teacher") redirect("/auth/login")

  const res = await fetch(`${BACKEND}/teachers/me/classes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) redirect("/auth/login")

  const assignments = await res.json()

  return <ClassesListClient assignments={assignments} />
}