import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { TeacherProfileClient } from "@/components/teacher/TeacherProfileClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "My profile — Teacher portal",
  description: "View your profile and manage your account credentials.",
}

export default async function TeacherProfilePage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "teacher") redirect("/auth/login")

  const res = await fetch(`${BACKEND}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) redirect("/auth/login")

  const me = await res.json()

  return <TeacherProfileClient me={me} />
}