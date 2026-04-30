"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { School, Director, PlatformStats } from "@/types/admin"

const T = {
  heading: "text-white",
  muted:   "text-[#2d4a6a]",
  soft:    "text-[#4a6e94]",
  card:    "bg-[#080f18] border border-[#0f1e2e] rounded-2xl",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full
                         rounded-full bg-emerald-400 opacity-60" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full
        ${active ? "bg-emerald-400" : "bg-[#1e3448]"}`} />
    </span>
  )
}

type Props = {
  schools:   School[]
  directors: Director[]
  stats:     PlatformStats | null
  adminName: string
}

export function AdminDashboardClient({ schools, directors, stats, adminName }: Props) {
  const computed = useMemo(() => ({
    totalSchools:    stats?.total_schools    ?? schools.length,
    activeSchools:   stats?.active_schools   ?? schools.filter(s => s.is_active).length,
    inactiveSchools: stats?.inactive_schools ?? schools.filter(s => !s.is_active).length,
    totalDirectors:  stats?.total_directors  ?? directors.length,
    totalTeachers:   stats?.total_teachers   ?? 0,
    totalStudents:   stats?.total_students   ?? 0,
  }), [stats, schools, directors])

  const recentSchools = [...schools]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  function directorForSchool(id: string) {
    return directors.find(d => d.school_id === id)
  }

  return (
    <div className="min-h-screen bg-[#060b12] p-7 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-[#7c3aed] uppercase
                        tracking-widest mb-1">
            Platform overview
          </p>
          <h1 className="text-[22px] font-bold text-white tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
            {adminName.split(" ")[0]}
          </h1>
          <p className={`text-[13px] ${T.soft} mt-1`}>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric",
              month: "long", year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/schools"
            className="text-[12px] font-semibold px-4 py-2 rounded-xl
                       bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
          >
            + New school
          </Link>
          <Link
            href="/admin/directors"
            className="text-[12px] font-semibold px-4 py-2 rounded-xl
                       bg-[#0f1e2e] text-[#4a6e94] border border-[#1e3448]
                       hover:text-white hover:border-[#2d4a6a] transition-colors"
          >
            + New director
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: "Total schools",    value: computed.totalSchools,    color: "text-[#a78bfa]", bg: "bg-[#7c3aed]/10", border: "border-[#7c3aed]/20" },
          { label: "Active schools",   value: computed.activeSchools,   color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
          { label: "Inactive schools", value: computed.inactiveSchools, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20" },
          { label: "Directors",        value: computed.totalDirectors,  color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20" },
          { label: "Teachers",         value: computed.totalTeachers,   color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
          { label: "Students",         value: computed.totalStudents,   color: "text-teal-400", bg: "bg-teal-400/10", border: "border-teal-400/20" },
        ].map(s => (
          <div key={s.label}
            className={`${T.card} border ${s.border} p-4`}>
            <p className={`text-[28px] font-bold tabular-nums leading-none ${s.color}`}>
              {s.value.toLocaleString()}
            </p>
            <p className={`text-[10px] font-semibold ${T.muted} uppercase
                          tracking-wider mt-2`}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two col */}
      <div className="grid grid-cols-3 gap-5">

        {/* Recent schools */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-white">Recent schools</h2>
            <Link href="/admin/schools"
              className="text-[12px] text-[#7c3aed] hover:text-[#a78bfa]">
              View all →
            </Link>
          </div>
          <div className={`${T.card} divide-y divide-[#0f1e2e]`}>
            {recentSchools.length === 0 && (
              <p className={`px-5 py-10 text-center text-[13px] ${T.muted}`}>
                No schools yet
              </p>
            )}
            {recentSchools.map(school => {
              const dir = directorForSchool(school.id)
              return (
                <div key={school.id}
                  className="flex items-center gap-4 px-5 py-3.5
                             hover:bg-[#0a1520] transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center
                               text-[12px] font-bold text-white shrink-0"
                    style={{
                      background: school.is_active
                        ? "linear-gradient(135deg,#7c3aed,#6366f1)"
                        : "#1e3448",
                    }}
                  >
                    {initials(school.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-white truncate">
                        {school.name}
                      </p>
                      <LiveDot active={school.is_active} />
                    </div>
                    <p className={`text-[11px] ${T.muted} mt-0.5`}>
                      {dir
                        ? <span>Director: <span className="text-[#4a6e94]">{dir.name}</span></span>
                        : <span className="text-amber-500/60">No director assigned</span>
                      }
                    </p>
                  </div>
                  <p className={`text-[11px] ${T.muted} shrink-0`}>
                    {new Date(school.created_at).toLocaleDateString()}
                  </p>
                  <Link
                    href="/admin/schools"
                    className="text-[11px] font-medium text-[#7c3aed]
                               hover:text-[#a78bfa] shrink-0"
                  >
                    Manage →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Directors panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-white">Directors</h2>
            <Link href="/admin/directors"
              className="text-[12px] text-[#7c3aed] hover:text-[#a78bfa]">
              View all →
            </Link>
          </div>
          <div className={`${T.card} p-4 space-y-3`}>
            {directors.length === 0 && (
              <p className={`text-[12px] ${T.muted} py-6 text-center`}>
                No directors yet
              </p>
            )}
            {directors.slice(0, 7).map(d => {
              const school = schools.find(s => s.id === d.school_id)
              return (
                <div key={d.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center
                               text-[10px] font-bold text-white shrink-0"
                    style={{
                      background: d.is_active
                        ? "linear-gradient(135deg,#0891b2,#7c3aed)"
                        : "#1e3448",
                    }}
                  >
                    {initials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white truncate">
                      {d.name}
                    </p>
                    <p className={`text-[10px] ${T.muted} truncate`}>
                      {school?.name ?? <span className="text-amber-500/60">Unassigned</span>}
                    </p>
                  </div>
                  <LiveDot active={d.is_active} />
                </div>
              )
            })}
            {directors.length > 7 && (
              <p className={`text-[11px] ${T.muted} text-center pt-1`}>
                +{directors.length - 7} more
              </p>
            )}
          </div>

          {/* Quick stats card */}
          <div className={`${T.card} p-4`}>
            <p className={`text-[11px] font-semibold ${T.muted} uppercase
                          tracking-wider mb-3`}>
              Assignment coverage
            </p>
            {(() => {
              const assigned   = directors.filter(d => d.school_id).length
              const total      = directors.length
              const pct        = total > 0 ? Math.round((assigned / total) * 100) : 0
              const schoolsCov = schools.filter(s =>
                directors.some(d => d.school_id === s.id)
              ).length
              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className={T.muted}>Directors assigned</span>
                      <span className="text-[#a78bfa] font-semibold">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0f1e2e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#7c3aed] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#0f1e2e] rounded-xl p-2">
                      <p className="text-[16px] font-bold text-white">{assigned}</p>
                      <p className={`text-[9px] ${T.muted} uppercase tracking-wider`}>
                        Assigned
                      </p>
                    </div>
                    <div className="bg-[#0f1e2e] rounded-xl p-2">
                      <p className="text-[16px] font-bold text-white">{schoolsCov}</p>
                      <p className={`text-[9px] ${T.muted} uppercase tracking-wider`}>
                        Schools covered
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}