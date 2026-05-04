// components/layout/Sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "@/config/nav"
import * as LucideIcons from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut } from "lucide-react"

type Role = keyof typeof NAV_ITEMS

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role] ?? []

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-colors duration-200">
      <div className="px-6 py-5 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <p className="text-sidebar-foreground font-semibold text-sm truncate">{name}</p>
          <p className="text-sidebar-muted-foreground text-xs capitalize">{role.replace("_", " ")}</p>
        </div>
        <ThemeToggle />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon ? (LucideIcons as any)[item.icon] : null

          const isActive = pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50"}`} />}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-5 border-t border-sidebar-border">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" })
            window.location.href = "/auth/login"
          }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <LogOut className="h-4 w-4 text-sidebar-foreground/50" />
          Log out
        </button>
      </div>
    </aside>
  )
}