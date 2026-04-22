"use client"

import Link from "next/link"
import type { TeacherDashboard, ClassAssignmentDetail } from "@/types/teacher"

// ── theme
const T = {
  page:       "min-h-screen bg-[#fafaf9] p-6 space-y-6",
  heading:    "text-[#0f2027]",
  muted:      "text-[#78716c]",
  accent:     "#0d9488",
  accentText: "text-[#0d9488]",
  card:       "bg-white border border-[#e7e5e4] rounded-2xl",
  pill:       "bg-[#f0fdfa] text-[#0d9488] border border-[#99f6e4]",
}

// ── subject color strip — deterministic from subject name
const SUBJECT_COLORS = [
  "#0d9488", // teal
  "#7c3aed", // violet
  "#db2777", // pink
  "#d97706", // amber
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#0891b2", // cyan
]
function subjectColor(name: string) {
  const idx = name
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0) % SUBJECT_COLORS.length
  return SUBJECT_COLORS[idx]
}

// ── group assignments by class
function groupByClass(assignments: ClassAssignmentDetail[]) {
  const map = new Map<string, { className: string; classId: string; subjects: string[] }>()
  for (const a of assignments) {
    if (!map.has(a.class_id)) {
      map.set(a.class_id, {
        classId:   a.class_id,
        className: a.class_name,
        subjects:  [],
      })
    }
    map.get(a.class_id)!.subjects.push(a.subject_name)
  }
  return Array.from(map.values())
}

type Props = {
  dashboard:    TeacherDashboard
  classes:      ClassAssignmentDetail[]
  teacherName:  string
}

export function TeacherDashboardClient({ dashboard, classes, teacherName }: Props) {
  const grouped    = groupByClass(classes)
  const firstName  = teacherName.split(" ")[0]
  const hour       = new Date().getHours()
  const greeting   =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const stats = [
    {
      label: "Assigned classes",
      value: dashboard.assigned_classes,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
      color: "bg-[#f0fdfa] text-[#0d9488]",
      href:  "/teacher/classes",
    },
    {
      label: "Total students",
      value: dashboard.total_students,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      color: "bg-violet-50 text-violet-600",
      href:  "/teacher/students",
    },
    {
      label: "Marks recorded",
      value: dashboard.marks_recorded,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      ),
      color: "bg-amber-50 text-amber-600",
      href:  "/teacher/marks",
    },
  ]

  return (
    <div className={T.page}>

      {/* Greeting banner */}
      <div className="rounded-2xl bg-[#0f2027] px-6 py-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[#5eead4] font-medium mb-0.5">{greeting}</p>
          <h1 className="text-[20px] font-semibold text-white tracking-tight">
            {firstName} 👋
          </h1>
          <p className="text-[13px] text-[#94a3b8] mt-1">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day:     "numeric",
              month:   "long",
              year:    "numeric",
            })}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${T.pill}`}>
            {dashboard.assigned_classes} class{dashboard.assigned_classes !== 1 ? "es" : ""}
          </span>
          <span className="text-[12px] text-[#94a3b8]">
            {dashboard.total_students} students
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}>
            <div className={`${T.card} p-5 hover:border-[#0d9488] transition-colors cursor-pointer`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                {s.icon}
              </div>
              <p className="text-[28px] font-semibold text-[#0f2027] tabular-nums leading-none">
                {s.value.toLocaleString()}
              </p>
              <p className="text-[13px] text-[#78716c] mt-1.5">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-5 gap-4">

        {/* ── My classes (3/5) */}
        <div className={`col-span-3 ${T.card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[#0f2027]">My classes</h2>
            <Link
              href="/teacher/classes"
              className="text-[12px] text-[#0d9488] hover:text-[#0f766e] font-medium"
            >
              View all →
            </Link>
          </div>

          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 rounded-full bg-[#f0fdfa] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-[13px] text-[#78716c]">No classes assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {grouped.map(cls => (
                <Link key={cls.classId} href={`/teacher/classes/${cls.classId}/students`}>
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl
                                  border border-[#e7e5e4] hover:border-[#0d9488]
                                  hover:bg-[#f0fdfa] transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      {/* color strip */}
                      <div
                        className="w-1 h-8 rounded-full shrink-0"
                        style={{ background: subjectColor(cls.subjects[0] ?? cls.className) }}
                      />
                      <div>
                        <p className="text-[13px] font-semibold text-[#0f2027] group-hover:text-[#0d9488] transition-colors">
                          {cls.className}
                        </p>
                        <p className="text-[11px] text-[#78716c] mt-0.5">
                          {cls.subjects.slice(0, 3).join(" · ")}
                          {cls.subjects.length > 3 && ` +${cls.subjects.length - 3} more`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#a8a29e] group-hover:text-[#0d9488] transition-colors">
                        {cls.subjects.length} subject{cls.subjects.length !== 1 ? "s" : ""}
                      </span>
                      <svg className="w-4 h-4 text-[#d4d0cb] group-hover:text-[#0d9488] transition-colors"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick actions (2/5) */}
        <div className="col-span-2 space-y-4">

          {/* Quick actions card */}
          <div className={`${T.card} p-5`}>
            <h2 className="text-[14px] font-semibold text-[#0f2027] mb-4">Quick actions</h2>
            <div className="space-y-2">
              {[
                {
                  label: "Enter marks",
                  desc:  "Record student scores",
                  href:  "/teacher/marks",
                  icon:  (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  ),
                  color: "bg-[#f0fdfa] text-[#0d9488]",
                },
                {
                  label: "Enroll student",
                  desc:  "Add to a class",
                  href:  "/teacher/classes",
                  icon:  (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  ),
                  color: "bg-violet-50 text-violet-600",
                },
                {
                  label: "Generate reports",
                  desc:  "Create class reports",
                  href:  "/teacher/reports",
                  icon:  (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                    </svg>
                  ),
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  label: "Change password",
                  desc:  "Update credentials",
                  href:  "/teacher/profile",
                  icon:  (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  ),
                  color: "bg-slate-100 text-slate-600",
                },
              ].map(a => (
                <Link key={a.label} href={a.href}>
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                                  hover:bg-[#f5f5f4] transition-colors cursor-pointer group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.color}`}>
                      {a.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[#0f2027] group-hover:text-[#0d9488] transition-colors">
                        {a.label}
                      </p>
                      <p className="text-[11px] text-[#a8a29e]">{a.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Subject tags */}
          {classes.length > 0 && (
            <div className={`${T.card} p-5`}>
              <h2 className="text-[14px] font-semibold text-[#0f2027] mb-3">
                Subjects you teach
              </h2>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(classes.map(c => c.subject_name))).map(subj => (
                  <span
                    key={subj}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border"
                    style={{
                      background: subjectColor(subj) + "15",
                      borderColor: subjectColor(subj) + "40",
                      color: subjectColor(subj),
                    }}
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}