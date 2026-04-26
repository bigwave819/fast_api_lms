"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import type { ClassAssignmentDetail } from "@/types/teacher"

const SUBJECT_COLORS = [
  "#0d9488","#7c3aed","#db2777",
  "#d97706","#2563eb","#16a34a",
  "#dc2626","#0891b2",
]

function subjectColor(name: string) {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % SUBJECT_COLORS.length
  return SUBJECT_COLORS[idx]
}

function groupByClass(assignments: ClassAssignmentDetail[]) {
  const map = new Map<string, { classId: string; className: string; subjects: string[] }>()
  for (const a of assignments) {
    if (!map.has(a.class_id)) {
      map.set(a.class_id, { classId: a.class_id, className: a.class_name, subjects: [] })
    }
    map.get(a.class_id)!.subjects.push(a.subject_name)
  }
  return Array.from(map.values())
}

export function ClassesListClient({ assignments }: { assignments: ClassAssignmentDetail[] }) {
  const [search, setSearch] = useState("")
  const router = useRouter()
  const grouped = useMemo(() => groupByClass(assignments), [assignments])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return !q
      ? grouped
      : grouped.filter(
          c =>
            c.className.toLowerCase().includes(q) ||
            c.subjects.some(s => s.toLowerCase().includes(q))
        )
  }, [grouped, search])

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#0f2027] tracking-tight">
            My classes
          </h1>
          <p className="text-[13px] text-[#78716c] mt-0.5">
            {grouped.length} class{grouped.length !== 1 ? "es" : ""} assigned ·{" "}
            {assignments.length} subject assignment{assignments.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by class name or subject..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm h-9 text-[13px] border-[#e7e5e4] bg-white text-[#0f2027]
                   placeholder:text-[#c4bfba] focus-visible:ring-[#0d9488]
                   focus-visible:ring-1 focus-visible:border-[#0d9488] rounded-lg"
      />

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl
                        border border-dashed border-[#e7e5e4]">
          <div className="w-10 h-10 rounded-full bg-[#f0fdfa] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#0d9488]" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[#78716c]">No classes found</p>
          <p className="text-[12px] text-[#a8a29e] mt-1">
            {search ? "Try a different search" : "Contact your director to get assigned"}
          </p>
        </div>
      )}

      {/* Class grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cls, i) => {
          const primary = subjectColor(cls.subjects[0] ?? cls.className)
          return (
            // ── plain div, not Link — avoids nested <a> hydration error
            <div
              key={cls.classId}
              onClick={() => router.push(`/teacher/classes/${cls.classId}/students`)}
              className="bg-white border border-[#e7e5e4] rounded-2xl overflow-hidden
                         hover:border-[#0d9488] hover:shadow-sm transition-all
                         cursor-pointer group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ background: primary }} />

              <div className="p-5">
                {/* Class name */}
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-[16px] font-bold text-[#0f2027]
                                 group-hover:text-[#0d9488] transition-colors">
                    {cls.className}
                  </h2>
                  <svg
                    className="w-4 h-4 text-[#d4d0cb] group-hover:text-[#0d9488]
                               transition-colors mt-0.5 shrink-0"
                    fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Subject pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {cls.subjects.map(s => (
                    <span
                      key={s}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                      style={{
                        background:  subjectColor(s) + "15",
                        borderColor: subjectColor(s) + "40",
                        color:       subjectColor(s),
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Footer tab links — these are the only <a> tags, no nesting */}
                <div
                  className="flex items-center gap-3 pt-3 border-t border-[#f0efed]"
                  onClick={e => e.stopPropagation()} // prevent card click when clicking tabs
                >
                  {[
                    { label: "Students", seg: "students" },
                    { label: "Marks",    seg: "marks"    },
                    { label: "Reports",  seg: "reports"  },
                  ].map(tab => (
                    <Link
                      key={tab.seg}
                      href={`/teacher/classes/${cls.classId}/${tab.seg}`}
                      className="text-[11px] font-medium text-[#a8a29e]
                                 hover:text-[#0d9488] transition-colors"
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
