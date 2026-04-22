import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "teacher") redirect("/auth/login")

  return (
    <div className="flex min-h-screen">
      <Sidebar role="teacher" name={payload.name ?? "Teacher"} />
      <main className="flex-1 bg-[#fafaf9]">{children}</main>
    </div>
  )
}