import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ClassTabNav } from "@/components/teacher/ClassTabNav"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { classId: string }
}) {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "teacher") redirect("/auth/login")

  // Fetch all assignments to find this class's details
  const res = await fetch(`${BACKEND}/teachers/me/classes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (!res.ok) redirect("/teacher/classes")

  const assignments = await res.json()

  // Find assignments for this classId
  const classAssignments = assignments.filter(
    (a: { class_id: string }) => a.class_id === params.classId
  )
  if (classAssignments.length === 0) redirect("/teacher/classes")

  const className   = classAssignments[0].class_name
  const subjects    = classAssignments.map((a: { subject_name: string }) => a.subject_name)

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <ClassTabNav
        classId={params.classId}
        className={className}
        subjects={subjects}
      />
      <div className="p-6">{children}</div>
    </div>
  )
}