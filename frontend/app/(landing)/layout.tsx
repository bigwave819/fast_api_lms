import type { Metadata } from "next"
import { LandingNav } from "@/components/landing/LandingNav"
import { LandingFooter } from "@/components/landing/LandingFooter"

export const metadata: Metadata = {
  title: { default: "E-Shuri — The School Management Platform", template: "%s | E-Shuri" },
  description: "E-Shuri is the all-in-one school management platform for African schools. Manage teachers, students, marks and reports with ease.",
  keywords: ["school management", "LMS", "Rwanda", "Africa", "EdTech", "E-Shuri"],
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans antialiased">
      <LandingNav />
      <main>{children}</main>
      <LandingFooter />
    </div>
  )
}