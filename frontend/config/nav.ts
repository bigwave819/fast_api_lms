// config/nav.ts

export const NAV_ITEMS = {
  director: [
    { label: "Dashboard",  href: "/director/dashboard", icon: "LayoutDashboard" },
    { label: "Teachers",   href: "/director/teachers", icon: "Users" },
    { label: "Students",   href: "/director/students", icon: "GraduationCap" },
    { label: "Classes",    href: "/director/classes", icon: "School" },
    { label: "Reports",    href: "/director/reports", icon: "FileText" },
    { label: "Subjects",   href: "/director/subjects", icon: "BookOpen" },
  ],
  teacher: [
    { label: "Dashboard",  href: "/teacher/dashboard", icon: "LayoutDashboard" },
    { label: "My classes", href: "/teacher/classes", icon: "School" },
  ],
  platform_admin: [
    { label: "Dashboard",  href: "/admin/dashboard", icon: "LayoutDashboard" },
    { label: "Schools",    href: "/admin/schools", icon: "Building2" },
    { label: "Directors",  href: "/admin/directors", icon: "UsersRound" },
    { label: "Billing",    href: "/admin/billing", icon: "CreditCard" },
    { label: "Settings",   href: "/admin/settings", icon: "Settings" },
  ],
} satisfies Record<string, { label: string; href: string, icon?: string }[]>