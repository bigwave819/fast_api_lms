import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ClassStudentsClient } from "@/components/teacher/ClassStudentsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function generateMetadata() {
  return { title: "Students — Teacher portal" }
}

export default async function ClassStudentsPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params

  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "teacher") redirect("/auth/login")

  const res = await fetch(`${BACKEND}/classes/${classId}/students`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) redirect("/teacher/classes")

  const students = await res.json()

  return (
    <ClassStudentsClient
      students={students}
      classId={classId}
    />
  )
}