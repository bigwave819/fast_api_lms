import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ClassesClient } from "@/components/director/ClassesClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Class management — Director portal",
  description: "Create classes, manage assignments and assign teachers to subjects.",
}

export default async function ClassesPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "director") redirect("/auth/login")

  const [classesRes, assignmentsRes] = await Promise.all([
    fetch(`${BACKEND}/schools/${payload.school_id}/classes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/schools/${payload.school_id}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  if (!classesRes.ok) redirect("/auth/login")

  const classes = await classesRes.json()
  const assignments = assignmentsRes.ok ? await assignmentsRes.json() : []

  return (
    <ClassesClient
      initial={{ classes, assignments }}
      schoolId={payload.school_id}
    />
  )
}