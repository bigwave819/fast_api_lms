"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// subject color — same fn used across app
const SUBJECT_COLORS = [
  "#0d9488","#7c3aed","#db2777",
  "#d97706","#2563eb","#16a34a",
  "#dc2626","#0891b2",
]
function subjectColor(name: string) {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % SUBJECT_COLORS.length
  return SUBJECT_COLORS[idx]
}

type Props = {
  classId:   string
  className: string
  subjects:  string[]
}

const TABS = [
  { label: "Students", segment: "students" },
  { label: "Marks",    segment: "marks"    },
  { label: "Reports",  segment: "reports"  },
]

export function ClassTabNav({ classId, className, subjects }: Props) {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-[#e7e5e4] px-6 pt-5 pb-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-[#a8a29e] mb-3">
        <Link href="/teacher/classes" className="hover:text-[#0d9488] transition-colors">
          My classes
        </Link>
        <span>/</span>
        <span className="text-[#0f2027] font-medium">{className}</span>
      </div>

      {/* Class name + subject pills */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[17px] font-semibold text-[#0f2027] tracking-tight">
            {className}
          </h1>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {subjects.map(s => (
              <span
                key={s}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  background:   subjectColor(s) + "15",
                  borderColor:  subjectColor(s) + "40",
                  color:        subjectColor(s),
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0">
        {TABS.map(tab => {
          const href   = `/teacher/classes/${classId}/${tab.segment}`
          const active = pathname.startsWith(href)
          return (
            <Link
              key={tab.segment}
              href={href}
              className={`
                px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors
                ${active
                  ? "border-[#0d9488] text-[#0d9488]"
                  : "border-transparent text-[#78716c] hover:text-[#0f2027] hover:border-[#d4d0cb]"
                }
              `}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}