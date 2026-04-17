import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TeachersClient } from "@/components/director/TeachersClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Teacher management — Kigali Excellence Academy",
  description: "Director portal to add, edit and manage school teachers.",
}

export default async function TeachersPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "director") redirect("/auth/login")

  const res = await fetch(
    `${BACKEND}/schools/${payload.school_id}/teachers`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  )
  if (!res.ok) redirect("/auth/login")

  const teachers = await res.json()
  return <TeachersClient initial={teachers} schoolId={payload.school_id} />
}