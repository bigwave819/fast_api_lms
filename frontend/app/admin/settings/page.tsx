import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient"

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000"

export const metadata = {
  title: "Settings — Admin console",
  description: "Platform-wide configuration and defaults.",
}

export default async function AdminSettingsPage() {
  const store = await cookies()
  const token = store.get("access_token")?.value
  if (!token) redirect("/auth/login")

  const payload = JSON.parse(atob(token.split(".")[1]))
  if (payload.role !== "platform_admin") redirect("/auth/login")

  const [settingsRes, meRes] = await Promise.all([
    fetch(`${BACKEND}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${BACKEND}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ])

  const settings = settingsRes.ok ? await settingsRes.json() : null
  const me       = meRes.ok       ? await meRes.json()       : null

  return (
    <AdminSettingsClient
      initialSettings={settings}
      me={me}
    />
  )
}