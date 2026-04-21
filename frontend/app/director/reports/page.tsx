import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ReportsClient } from "@/components/director/ReportsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Reports — Director portal",
  description: "View and comment on student reports across all classes in your school.",
}

export default async function ReportsPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "director") redirect("/auth/login")

  const [classesRes, reportsRes, studentsRes] = await Promise.all([
    fetch(`${BACKEND}/schools/${payload.school_id}/classes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/schools/${payload.school_id}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/schools/${payload.school_id}/students`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  if (!classesRes.ok) redirect("/auth/login")

  const classes  = await classesRes.json()
  const reports  = reportsRes.ok  ? await reportsRes.json()  : []
  const students = studentsRes.ok ? await studentsRes.json() : []

  return (
    <ReportsClient
      initial={{ classes, reports, students }}
      schoolId={payload.school_id}
    />
  )
}