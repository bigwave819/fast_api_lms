// components/layout/Sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NAV_ITEMS } from "@/config/nav"

type Role = keyof typeof NAV_ITEMS

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname()
  const items = NAV_ITEMS[role] ?? []

  return (
    <aside className="w-56 min-h-screen bg-[#1558a8] flex flex-col">
      <div className="px-5 py-4 border-b border-blue-600">
        <p className="text-white font-medium text-sm">{name}</p>
        <p className="text-blue-200 text-xs capitalize">{role.replace("_", " ")}</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname.startsWith(item.href)
                ? "bg-white text-[#1558a8] font-medium"
                : "text-blue-100 hover:bg-blue-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-blue-600">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" })
            window.location.href = "/auth/login"
          }}
          className="w-full text-left px-3 py-2 text-sm text-blue-200 hover:text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}