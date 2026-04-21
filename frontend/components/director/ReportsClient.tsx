"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Badge }    from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

import type { Report, ClassRecord, StudentRecord } from "@/types/reports"

// ── Zod schema for director comment
const commentSchema = z.object({
  director_comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment is too long (max 500 characters)"),
})
type CommentValues = z.infer<typeof commentSchema>

// ── Grade styling
const GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-200",
  B: "bg-indigo-50  text-indigo-700  border-indigo-200",
  C: "bg-amber-50   text-amber-700   border-amber-200",
  D: "bg-orange-50  text-orange-700  border-orange-200",
  F: "bg-red-50     text-red-700     border-red-200",
}

function gradeStyle(g: string) {
  return GRADE_STYLES[g] ?? "bg-gray-50 text-gray-600 border-gray-200"
}

// ── Rank medal
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-amber-500 font-bold text-[13px]">🥇 1st</span>
  if (rank === 2) return <span className="text-slate-400 font-bold text-[13px]">🥈 2nd</span>
  if (rank === 3) return <span className="text-amber-700 font-bold text-[13px]">🥉 3rd</span>
  return <span className="text-slate-500 text-[13px] tabular-nums">#{rank}</span>
}

type Props = {
  initial: {
    classes:  ClassRecord[]
    reports:  Report[]
    students: StudentRecord[]
  }
  schoolId: string
}

export function ReportsClient({ initial, schoolId }: Props) {
  const [reports, setReports]           = useState<Report[]>(initial.reports)
  const classes                         = initial.classes  as ClassRecord[]
  const students                        = initial.students as StudentRecord[]

  // ── left panel state
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null)
  const [termFilter, setTermFilter]       = useState("all")
  const [yearFilter, setYearFilter]       = useState("all")
  const [search, setSearch]               = useState("")

  // ── comment dialog state
  const [commentTarget, setCommentTarget] = useState<Report | null>(null)
  const [savingComment, setSavingComment] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
  })

  // ── derived lists
  const terms = useMemo(() => {
    const s = new Set(reports.map(r => r.term))
    return Array.from(s).sort()
  }, [reports])

  const years = useMemo(() => {
    const s = new Set(reports.map(r => r.academic_year))
    return Array.from(s).sort().reverse()
  }, [reports])

  // per-class report counts (for the class cards)
  const reportCountByClass = useMemo(() => {
    const m: Record<string, number> = {}
    reports.forEach(r => { m[r.class_id] = (m[r.class_id] ?? 0) + 1 })
    return m
  }, [reports])

  // top average per class (for summary in card)
  const topAverageByClass = useMemo(() => {
    const m: Record<string, number> = {}
    reports.forEach(r => {
      if (!m[r.class_id] || r.average_score > m[r.class_id]) {
        m[r.class_id] = Number(r.average_score)
      }
    })
    return m
  }, [reports])

  // reports for selected class, filtered by term/year/search
  const classReports = useMemo(() => {
    if (!selectedClass) return []
    const q = search.toLowerCase()
    return reports
      .filter(r => {
        if (r.class_id !== selectedClass.id) return false
        if (termFilter !== "all" && r.term !== termFilter) return false
        if (yearFilter !== "all" && r.academic_year !== yearFilter) return false
        if (q) {
          const sName = students.find(s => s.id === r.student_id)?.name ?? ""
          if (!sName.toLowerCase().includes(q)) return false
        }
        return true
      })
      .sort((a, b) => a.class_rank - b.class_rank)
  }, [reports, selectedClass, termFilter, yearFilter, search, students])

  function studentName(id: string) {
    return students.find(s => s.id === id)?.name ?? "Unknown"
  }

  function openComment(r: Report) {
    setCommentTarget(r)
    reset({ director_comment: r.director_comment ?? "" })
  }

  async function onCommentSubmit(values: CommentValues) {
    if (!commentTarget) return
    setSavingComment(true)
    try {
      const res = await fetch(`/api/reports/${commentTarget.id}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ director_comment: values.director_comment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.detail ?? "Failed to save comment")
        return
      }
      setReports(prev => prev.map(r => r.id === data.id ? data : r))
      setCommentTarget(null)
      reset()
      toast.success("Comment saved")
    } finally {
      setSavingComment(false)
    }
  }

  // ── class stats for selected class header
  const classStats = useMemo(() => {
    if (!selectedClass) return null
    const cr = reports.filter(r => {
      if (r.class_id !== selectedClass.id) return false
      if (termFilter !== "all" && r.term !== termFilter) return false
      if (yearFilter !== "all" && r.academic_year !== yearFilter) return false
      return true
    })
    if (cr.length === 0) return null
    const avg   = cr.reduce((s, r) => s + Number(r.average_score), 0) / cr.length
    const top   = cr.reduce((m, r) => Number(r.average_score) > Number(m.average_score) ? r : m)
    const gradeA = cr.filter(r => r.grade === "A").length
    return { count: cr.length, avg: avg.toFixed(1), topStudent: studentName(top.student_id), gradeA }
  }, [reports, selectedClass, termFilter, yearFilter, students])

  return (
    <div className="min-h-screen bg-white p-6">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-slate-900 tracking-tight">
          Reports
        </h1>
        <p className="text-[13px] text-slate-400 mt-0.5">
          Select a class to view student reports
        </p>
      </div>

      <div className="flex gap-6 items-start">

        {/* ── LEFT PANEL: class grid ── */}
        <div className="w-72 shrink-0 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Classes
          </p>

          {classes.length === 0 && (
            <p className="text-[13px] text-slate-400 py-6 text-center">
              No classes found.
            </p>
          )}

          {classes.map(cls => {
            const count   = reportCountByClass[cls.id] ?? 0
            const topAvg  = topAverageByClass[cls.id]
            const active  = selectedClass?.id === cls.id

            return (
              <button
                key={cls.id}
                onClick={() => { setSelectedClass(cls); setSearch("") }}
                className={`
                  w-full text-left rounded-xl border px-4 py-3
                  transition-all duration-150
                  ${active
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                  }
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[14px] font-semibold ${active ? "text-indigo-700" : "text-slate-800"}`}>
                    {cls.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${active ? "border-indigo-300 text-indigo-600" : "border-slate-200 text-slate-500"}`}
                  >
                    {cls.grade_level}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {count} report{count !== 1 ? "s" : ""}
                  </span>
                  {topAvg !== undefined && (
                    <span className="text-[11px] text-emerald-600 font-medium">
                      Top {topAvg.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{cls.academic_year}</p>
              </button>
            )
          })}
        </div>

        {/* ── RIGHT PANEL: reports table ── */}
        <div className="flex-1 min-w-0">

          {!selectedClass ? (
            <div className="flex flex-col items-center justify-center h-72 rounded-2xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m-6-8h6M5 8h.01M5 12h.01M5 16h.01M3 6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-slate-600">Select a class</p>
              <p className="text-[12px] text-slate-400 mt-1">Reports will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Class header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-slate-900">
                    {selectedClass.name}
                    <span className="ml-2 text-[13px] font-normal text-slate-400">
                      {selectedClass.academic_year}
                    </span>
                  </h2>
                  {classStats && (
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      {classStats.count} reports · avg {classStats.avg}% · {classStats.gradeA} A grade{classStats.gradeA !== 1 ? "s" : ""} · top: {classStats.topStudent}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                >
                  ← Back
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search student..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 h-9 text-[13px] border-slate-200 bg-white text-slate-800
                             placeholder:text-slate-300 focus-visible:ring-indigo-400
                             focus-visible:ring-1 focus-visible:border-indigo-400 rounded-lg"
                />
                <Select value={termFilter} onValueChange={v => setTermFilter(v ?? "all")}>
                  <SelectTrigger className="w-32 h-9 text-[13px] border-slate-200 bg-white text-slate-600 rounded-lg">
                    <SelectValue placeholder="All terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All terms</SelectItem>
                    {terms.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={v => setYearFilter(v ?? "all")}>
                  <SelectTrigger className="w-36 h-9 text-[13px] border-slate-200 bg-white text-slate-600 rounded-lg">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reports table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                      {["Rank", "Student", "Term", "Average", "Total", "Grade", "Director comment", ""].map(h => (
                        <TableHead
                          key={h}
                          className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-3"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classReports.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-14 text-slate-400 text-[13px]"
                        >
                          No reports found for this selection.
                        </TableCell>
                      </TableRow>
                    )}
                    {classReports.map(r => (
                      <TableRow
                        key={r.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="py-3">
                          <RankBadge rank={r.class_rank} />
                        </TableCell>
                        <TableCell className="py-3">
                          <p className="text-[13px] font-medium text-slate-800">
                            {studentName(r.student_id)}
                          </p>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-[12px] text-slate-500">
                            {r.term}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-[13px] font-semibold text-slate-800 tabular-nums">
                            {Number(r.average_score).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-[13px] text-slate-500 tabular-nums">
                            {Number(r.total_score).toFixed(0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-bold px-2 py-0.5 ${gradeStyle(r.grade)}`}
                          >
                            {r.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 max-w-[160px]">
                          {r.director_comment ? (
                            <p className="text-[12px] text-slate-500 truncate">
                              {r.director_comment}
                            </p>
                          ) : (
                            <span className="text-[12px] text-slate-300 italic">
                              No comment
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openComment(r)}
                            className="h-7 px-3 text-[12px] text-indigo-500 hover:text-indigo-700
                                       hover:bg-indigo-50 rounded-md"
                          >
                            {r.director_comment ? "Edit" : "Comment"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── COMMENT DIALOG ── */}
      <Dialog
        open={!!commentTarget}
        onOpenChange={open => { if (!open) { setCommentTarget(null); reset() } }}
      >
        <DialogContent className="border-slate-200 rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-slate-900">
              Director comment
            </DialogTitle>
            {commentTarget && (
              <p className="text-[12px] text-slate-400 mt-1">
                {studentName(commentTarget.student_id)} ·{" "}
                {commentTarget.term} · {commentTarget.academic_year} ·{" "}
                <span className={`font-semibold ${gradeStyle(commentTarget.grade)} px-1.5 py-0.5 rounded border text-[11px]`}>
                  {commentTarget.grade}
                </span>
              </p>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit(onCommentSubmit)} className="space-y-3 mt-1">
            <div>
              <label className="block text-[12px] font-medium text-slate-500 mb-1">
                Your comment
              </label>
              <Textarea
                {...register("director_comment")}
                rows={4}
                placeholder="Write your observation or feedback for this student's performance..."
                className="border-slate-200 text-slate-800 placeholder:text-slate-300 text-[13px]
                           focus-visible:ring-indigo-400 focus-visible:ring-1
                           focus-visible:border-indigo-400 rounded-lg resize-none leading-relaxed"
              />
              {errors.director_comment && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.director_comment.message}
                </p>
              )}
            </div>

            {/* teacher comment (read-only) */}
            {commentTarget?.teacher_comment && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Teacher comment
                </p>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  {commentTarget.teacher_comment}
                </p>
              </div>
            )}

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCommentTarget(null); reset() }}
                className="border-slate-200 text-slate-500 hover:bg-slate-50 text-[13px] h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingComment || !isDirty}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] h-9 disabled:opacity-50"
              >
                {savingComment ? "Saving..." : "Save comment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}