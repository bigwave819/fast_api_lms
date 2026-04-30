import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "platform_admin") redirect("/auth/login")

  return (
    <div className="flex min-h-screen bg-[#080d14]">
      <Sidebar role="platform_admin" name={payload.name ?? "Admin"} />
      <main className="flex-1">{children}</main>
    </div>
  )
}