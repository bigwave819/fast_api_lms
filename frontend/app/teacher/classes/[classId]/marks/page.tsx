import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { MarksClient } from "@/components/teacher/MarksClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export async function generateMetadata() {
  return { title: "Marks — Teacher portal" }
}

export default async function MarksPage({
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

  const [studentsRes, assignmentsRes, marksRes] = await Promise.all([
    fetch(`${BACKEND}/classes/${classId}/students`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/teachers/me/classes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/marks?class_id=${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  if (!studentsRes.ok) redirect("/teacher/classes")

  const students    = await studentsRes.json()
  const assignments = assignmentsRes.ok ? await assignmentsRes.json() : []
  const marks       = marksRes.ok       ? await marksRes.json()       : []

  // subjects for this class only
  const subjects = Array.from(
    new Map(
      assignments
        .filter((a: { class_id: string; subject_id: string; subject_name: string }) =>
          a.class_id === classId
        )
        .map((a: { subject_id: string; subject_name: string }) => [
          a.subject_id,
          { id: a.subject_id, name: a.subject_name },
        ])
    ).values()
  ) as { id: string; name: string }[]

  return (
    <MarksClient
      classId={classId}
      students={students}
      subjects={subjects}
      initialMarks={marks}
    />
  )
}