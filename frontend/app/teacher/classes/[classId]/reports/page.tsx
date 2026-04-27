import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ClassReportsClient } from "@/components/teacher/ClassReportsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function generateMetadata() {
  return { title: "Reports — Teacher portal" }
}

export default async function ClassReportsPage({
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

  const [reportsRes, studentsRes] = await Promise.all([
    fetch(`${BACKEND}/classes/${classId}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/classes/${classId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  const reports  = reportsRes.ok  ? await reportsRes.json()  : []
  const students = studentsRes.ok ? await studentsRes.json() : []

  return (
    <ClassReportsClient
      classId={classId}
      initialReports={reports}
      students={students}
    />
  )
}