"use client"

import { useMemo } from "react"
import Link from "next/link"
import type { School, Director, PlatformStats } from "@/types/admin"
import { ArrowRight, Building2, UsersRound } from "lucide-react"

const T = {
  heading: "text-foreground",
  muted:   "text-muted-foreground",
  soft:    "text-muted-foreground/80",
  card:    "bg-card border border-border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function LiveDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full
                         rounded-full bg-emerald-500 opacity-60" />
      )}
      <span className={`relative inline-flex h-2 w-2 rounded-full
        ${active ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
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
    <div className="min-h-screen p-7 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary uppercase
                        tracking-widest mb-1">
            Platform overview
          </p>
          <h1 className="text-[24px] font-bold text-foreground tracking-tight">
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
        <div className="flex gap-3">
          <Link
            href="/admin/schools"
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-xl
                       bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm hover:shadow"
          >
            <Building2 className="w-4 h-4" />
            New school
          </Link>
          <Link
            href="/admin/directors"
            className="flex items-center gap-2 text-[13px] font-semibold px-4 py-2 rounded-xl
                       bg-secondary text-secondary-foreground border border-border
                       hover:bg-secondary/80 transition-all shadow-sm hover:shadow"
          >
            <UsersRound className="w-4 h-4" />
            New director
          </Link>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total schools",    value: computed.totalSchools,    color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
          { label: "Active schools",   value: computed.activeSchools,   color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { label: "Inactive schools", value: computed.inactiveSchools, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
          { label: "Directors",        value: computed.totalDirectors,  color: "text-sky-500", bg: "bg-sky-500/10", border: "border-sky-500/20" },
          { label: "Teachers",         value: computed.totalTeachers,   color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
          { label: "Students",         value: computed.totalStudents,   color: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
        ].map(s => (
          <div key={s.label}
            className={`${T.card} border ${s.border} p-5 flex flex-col justify-center`}>
            <p className={`text-[32px] font-bold tabular-nums leading-none ${s.color}`}>
              {s.value.toLocaleString()}
            </p>
            <p className={`text-[11px] font-semibold ${T.muted} uppercase
                          tracking-wider mt-3`}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Two col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent schools */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-foreground">Recent schools</h2>
            <Link href="/admin/schools"
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className={`${T.card} divide-y divide-border overflow-hidden`}>
            {recentSchools.length === 0 && (
              <p className={`px-5 py-10 text-center text-[14px] ${T.muted}`}>
                No schools yet
              </p>
            )}
            {recentSchools.map(school => {
              const dir = directorForSchool(school.id)
              return (
                <div key={school.id}
                  className="flex items-center gap-4 px-5 py-4
                             hover:bg-accent/50 transition-colors group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center
                               text-[13px] font-bold text-white shrink-0 shadow-sm"
                    style={{
                      background: school.is_active
                        ? "linear-gradient(135deg, var(--color-primary), #6366f1)"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {initials(school.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {school.name}
                      </p>
                      <LiveDot active={school.is_active} />
                    </div>
                    <p className={`text-[12px] ${T.muted} mt-1`}>
                      {dir
                        ? <span>Director: <span className="text-foreground/80 font-medium">{dir.name}</span></span>
                        : <span className="text-amber-500/80 font-medium">No director assigned</span>
                      }
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className={`text-[12px] ${T.muted} shrink-0`}>
                      {new Date(school.created_at).toLocaleDateString()}
                    </p>
                    <Link
                      href="/admin/schools"
                      className="text-[12px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Directors panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-foreground">Directors</h2>
            <Link href="/admin/directors"
              className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className={`${T.card} p-5 space-y-4`}>
            {directors.length === 0 && (
              <p className={`text-[13px] ${T.muted} py-6 text-center`}>
                No directors yet
              </p>
            )}
            {directors.slice(0, 6).map(d => {
              const school = schools.find(s => s.id === d.school_id)
              return (
                <div key={d.id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent/50 transition-colors">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center
                               text-[11px] font-bold text-white shrink-0 shadow-sm"
                    style={{
                      background: d.is_active
                        ? "linear-gradient(135deg, #0891b2, var(--color-primary))"
                        : "var(--color-muted-foreground)",
                    }}
                  >
                    {initials(d.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {d.name}
                    </p>
                    <p className={`text-[11px] ${T.muted} truncate mt-0.5`}>
                      {school?.name ?? <span className="text-amber-500/80 font-medium">Unassigned</span>}
                    </p>
                  </div>
                  <LiveDot active={d.is_active} />
                </div>
              )
            })}
            {directors.length > 6 && (
              <div className="pt-2 border-t border-border mt-2">
                <p className={`text-[12px] font-medium ${T.muted} text-center`}>
                  +{directors.length - 6} more
                </p>
              </div>
            )}
          </div>

          {/* Quick stats card */}
          <div className={`${T.card} p-5 bg-gradient-to-br from-card to-muted/20`}>
            <p className={`text-[12px] font-bold text-foreground uppercase
                          tracking-wider mb-4 flex items-center gap-2`}>
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
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[12px] mb-2 font-medium">
                      <span className={T.muted}>Directors assigned</span>
                      <span className="text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-background border border-border rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
                      <p className="text-[20px] font-bold text-foreground">{assigned}</p>
                      <p className={`text-[10px] font-semibold ${T.muted} uppercase tracking-wider mt-1`}>
                        Assigned
                      </p>
                    </div>
                    <div className="bg-background border border-border rounded-xl p-3 shadow-sm hover:shadow transition-shadow">
                      <p className="text-[20px] font-bold text-foreground">{schoolsCov}</p>
                      <p className={`text-[10px] font-semibold ${T.muted} uppercase tracking-wider mt-1`}>
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