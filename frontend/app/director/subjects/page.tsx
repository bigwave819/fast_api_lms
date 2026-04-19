import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SubjectsClient } from "@/components/director/SubjectsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Subject management — Director portal",
  description: "Create and manage subjects offered at your school.",
}

export default async function SubjectsPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "director") redirect("/auth/login")

  const res = await fetch(`${BACKEND}/schools/${payload.school_id}/subjects`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) redirect("/auth/login")

  const subjects = await res.json()

  return (
    <SubjectsClient
      initial={subjects}
      schoolId={payload.school_id}
    />
  )
}