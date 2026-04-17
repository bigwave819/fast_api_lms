import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"

export default async function DirectorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "director") redirect("/auth/login")

  return (
    <div className="flex min-h-screen">
      <Sidebar role="director" name={payload.name ?? "Director"} />
      <main className="flex-1 bg-blue-50">{children}</main>
    </div>
  )
}