import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { StudentsClient } from "@/components/director/StudentsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Students — Director portal",
  description: "View and manage all students enrolled across your school.",
}

export default async function StudentsPage() {
  const store   = await cookies()
  const token   = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "director") redirect("/auth/login")

  const [studentsRes, classesRes] = await Promise.all([
    fetch(`${BACKEND}/schools/${payload.school_id}/students`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/schools/${payload.school_id}/classes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  if (!studentsRes.ok) redirect("/auth/login")

  const students = await studentsRes.json()
  const classes  = classesRes.ok ? await classesRes.json() : []

  return (
    <StudentsClient
      initial={{ students, classes }}
      schoolId={payload.school_id}
    />
  )
}