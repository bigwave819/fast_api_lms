// config/nav.ts

export const NAV_ITEMS = {
  director: [
    { label: "Dashboard",  href: "/director/dashboard" },
    { label: "Teachers",   href: "/director/teachers" },
    { label: "Students",   href: "/director/students" },
    { label: "Classes",    href: "/director/classes" },
    { label: "Reports",    href: "/director/reports" },
    { label: "Subjects",   href: "/director/subjects" },
  ],
  teacher: [
    { label: "Dashboard",  href: "/teacher/dashboard" },
    { label: "My classes", href: "/teacher/classes" },
    { label: "Marks",      href: "/teacher/marks" },
    { label: "Students",   href: "/teacher/students" },
    { label: "Reports",    href: "/teacher/reports" },
  ],
  platform_admin: [
    { label: "Schools",    href: "/admin/schools" },
    { label: "Directors",  href: "/admin/directors" },
    { label: "Billing",    href: "/admin/billing" },
    { label: "Settings",   href: "/admin/settings" },
  ],
} satisfies Record<string, { label: string; href: string }[]>