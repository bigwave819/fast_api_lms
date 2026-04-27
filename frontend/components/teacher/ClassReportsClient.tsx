"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Badge }    from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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

import {
  generateReportSchema,
  teacherCommentSchema,
  type GenerateReportValues,
  type TeacherCommentValues,
} from "@/lib/validation/report"
import type { Report } from "@/types/reports"

// ── theme — cream editorial
const T = {
  page:      "bg-[#fffdf7]",
  heading:   "text-[#1c1917]",
  muted:     "text-[#78716c]",
  card:      "bg-white border border-[#e7e5e0] rounded-xl",
  rowHov:    "hover:bg-[#fffdf7]",
  input:     "border-[#e7e5e0] text-[#1c1917] placeholder:text-[#c4bfba] focus-visible:ring-[#0d9488] focus-visible:ring-1 focus-visible:border-[#0d9488] h-9 text-[13px] rounded-lg bg-white",
  label:     "block text-[11px] font-semibold text-[#78716c] uppercase tracking-wider mb-1",
  accent:    "#0d9488",
}

const TERMS = ["Term 1", "Term 2", "Term 3"]

// ── grade stamp style
const GRADE_STAMP: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200",
  B: "bg-sky-50     text-sky-700     border-sky-300     ring-1 ring-sky-200",
  C: "bg-amber-50   text-amber-700   border-amber-300   ring-1 ring-amber-200",
  D: "bg-orange-50  text-orange-700  border-orange-300  ring-1 ring-orange-200",
  F: "bg-rose-50    text-rose-700    border-rose-300    ring-1 ring-rose-200",
}

function gradeStamp(g: string) {
  return GRADE_STAMP[g] ?? "bg-gray-50 text-gray-600 border-gray-200"
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="font-bold text-amber-500 text-[13px]">🥇 1st</span>
  if (rank === 2) return <span className="font-bold text-slate-400 text-[13px]">🥈 2nd</span>
  if (rank === 3) return <span className="font-bold text-amber-700 text-[13px]">🥉 3rd</span>
  return <span className="text-[#78716c] text-[13px] tabular-nums font-medium">#{rank}</span>
}

type Student = { id: string; name: string }

type Props = {
  classId:        string
  initialReports: Report[]
  students:       Student[]
}

export function ClassReportsClient({ classId, initialReports, students }: Props) {
  const [reports, setReports]   = useState<Report[]>(initialReports)
  const [termFilter, setTermFilter]   = useState("all")
  const [yearFilter, setYearFilter]   = useState("all")
  const [generating, setGenerating]   = useState(false)
  const [commentTarget, setCommentTarget] = useState<Report | null>(null)
  const [savingComment, setSavingComment] = useState(false)

  // ── generate form
  const genForm = useForm<GenerateReportValues>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      term:          "Term 1",
      academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    },
  })

  // ── comment form
  const commentForm = useForm<TeacherCommentValues>({
    resolver: zodResolver(teacherCommentSchema),
  })

  // ── derived filters
  const terms = useMemo(() => {
    const s = new Set(reports.map(r => r.term))
    return Array.from(s).sort()
  }, [reports])

  const years = useMemo(() => {
    const s = new Set(reports.map(r => r.academic_year))
    return Array.from(s).sort().reverse()
  }, [reports])

  const filtered = useMemo(() => {
    return reports
      .filter(r => {
        const matchT = termFilter === "all" || r.term          === termFilter
        const matchY = yearFilter === "all" || r.academic_year === yearFilter
        return matchT && matchY
      })
      .sort((a, b) => a.class_rank - b.class_rank)
  }, [reports, termFilter, yearFilter])

  // ── stats for filtered set
  const stats = useMemo(() => {
    if (filtered.length === 0) return null
    const avg    = filtered.reduce((s, r) => s + Number(r.average_score), 0) / filtered.length
    const gradeA = filtered.filter(r => r.grade === "A").length
    const top    = filtered[0] // already sorted by rank
    return { count: filtered.length, avg: avg.toFixed(1), gradeA, top }
  }, [filtered])

  function studentName(id: string) {
    return students.find(s => s.id === id)?.name ?? "Unknown"
  }

  // ── generate
  async function onGenerate(values: GenerateReportValues) {
    setGenerating(true)
    try {
      const res = await fetch(
        `/api/reports/generate?class_id=${classId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.detail ?? "Failed to generate reports")
        return
      }
      // data is ClassReportResponse — fetch fresh reports
      const fresh = await fetch(
        `/api/classes/${classId}/reports?term=${values.term}&academic_year=${values.academic_year}`
      )
      if (fresh.ok) {
        const freshData = await fresh.json()
        setReports(prev => {
          // merge: replace existing for this term/year, keep others
          const others = prev.filter(
            r => !(r.term === values.term && r.academic_year === values.academic_year)
          )
          return [...others, ...freshData]
        })
      }
      toast.success(
        `Generated ${data.total_students} report${data.total_students !== 1 ? "s" : ""} for ${values.term}`
      )
      // auto-apply filter to show just generated
      setTermFilter(values.term)
      setYearFilter(values.academic_year)
    } finally {
      setGenerating(false)
    }
  }

  // ── comment
  function openComment(r: Report) {
    setCommentTarget(r)
    commentForm.reset({ teacher_comment: r.teacher_comment ?? "" })
  }

  async function onCommentSubmit(values: TeacherCommentValues) {
    if (!commentTarget) return
    setSavingComment(true)
    try {
      const res = await fetch(`/api/reports/${commentTarget.id}/comment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_comment: values.teacher_comment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.detail ?? "Failed to save comment")
        return
      }
      setReports(prev => prev.map(r => r.id === data.id ? data : r))
      setCommentTarget(null)
      commentForm.reset()
      toast.success("Comment saved")
    } finally {
      setSavingComment(false)
    }
  }

  return (
    <div className={`${T.page} space-y-5`}>

      {/* Generate panel */}
      <div className={`${T.card} p-5`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className={`text-[14px] font-semibold ${T.heading}`}>
              Generate reports
            </h2>
            <p className={`text-[12px] ${T.muted} mt-0.5`}>
              Calculates averages, grades and ranks for all active students
            </p>
          </div>
          {/* document icon */}
          <div className="w-9 h-9 rounded-lg bg-[#f0fdfa] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#0d9488]" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        </div>

        <form onSubmit={genForm.handleSubmit(onGenerate)}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 mb-4">
            {/* Term */}
            <div>
              <label className={T.label}>Term</label>
              <Select
                value={genForm.watch("term")}
                onValueChange={v => genForm.setValue("term", v ?? "Term 1", { shouldValidate: true })}
              >
                <SelectTrigger className="border-[#e7e5e0] bg-white text-[#1c1917] h-9 text-[13px] rounded-lg w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {genForm.formState.errors.term && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {genForm.formState.errors.term.message}
                </p>
              )}
            </div>

            {/* Academic year */}
            <div>
              <label className={T.label}>Academic year</label>
              <Input
                {...genForm.register("academic_year")}
                className={T.input}
                placeholder="2024-2025"
              />
              {genForm.formState.errors.academic_year && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {genForm.formState.errors.academic_year.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={generating || !genForm.formState.isValid}
                className="w-full bg-[#1c1917] hover:bg-[#292524] text-white
                           text-[13px] h-9 rounded-lg shadow-none disabled:opacity-40"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Generating...
                  </span>
                ) : "Generate reports"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Reports",     value: stats.count },
            { label: "Class avg",   value: `${stats.avg}%` },
            { label: "Grade A",     value: stats.gradeA },
            { label: "Top student", value: studentName(stats.top.student_id), small: true },
          ].map(s => (
            <div key={s.label} className={`${T.card} p-4`}>
              <p className={`text-[11px] font-semibold ${T.muted} uppercase tracking-wider`}>
                {s.label}
              </p>
              <p className={`${s.small ? "text-[14px]" : "text-[24px]"} font-semibold
                            ${T.heading} mt-1 tabular-nums truncate`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + table */}
      <div className={`${T.card} overflow-hidden`}>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[#f3f4f6] bg-[#fafaf9]">
          <p className={`text-[13px] font-medium ${T.heading} flex-1`}>
            {filtered.length} report{filtered.length !== 1 ? "s" : ""}
            {termFilter !== "all" && ` · ${termFilter}`}
          </p>
          <Select value={termFilter} onValueChange={v => setTermFilter(v ?? "all")}>
            <SelectTrigger className="w-32 border-[#e7e5e0] bg-white text-[#78716c] text-[13px] h-8 rounded-lg">
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
            <SelectTrigger className="w-36 border-[#e7e5e0] bg-white text-[#78716c] text-[13px] h-8 rounded-lg">
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

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-[#fafaf9] hover:bg-[#fafaf9] border-b border-[#e7e5e0]">
              {["Rank", "Student", "Average", "Total", "Grade", "Term", "My comment", ""].map(h => (
                <TableHead
                  key={h}
                  className={`text-[11px] font-semibold ${T.muted} uppercase tracking-wider py-3`}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className={`text-center py-16 ${T.muted} text-[13px]`}
                >
                  {reports.length === 0
                    ? "No reports yet — generate reports above."
                    : "No reports match the current filter."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map(r => (
              <TableRow
                key={r.id}
                className={`border-b border-[#f3f4f6] ${T.rowHov} transition-colors`}
              >
                <TableCell className="py-3">
                  <RankBadge rank={r.class_rank} />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center
                                 text-[10px] font-bold text-white shrink-0"
                      style={{ background: "#0d9488" }}
                    >
                      {studentName(r.student_id).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className={`text-[13px] font-medium ${T.heading}`}>
                      {studentName(r.student_id)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`text-[13px] font-semibold ${T.heading} tabular-nums`}>
                    {Number(r.average_score).toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`text-[13px] ${T.muted} tabular-nums`}>
                    {Number(r.total_score).toFixed(0)}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8
                                rounded-full border text-[13px] font-bold
                                ${gradeStamp(r.grade)}`}
                  >
                    {r.grade}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className={`text-[12px] ${T.muted}`}>{r.term}</span>
                </TableCell>
                <TableCell className="py-3 max-w-45">
                  {r.teacher_comment ? (
                    <p className={`text-[12px] ${T.muted} truncate`}>
                      {r.teacher_comment}
                    </p>
                  ) : (
                    <span className="text-[12px] text-[#d4c9bd] italic">
                      No comment
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openComment(r)}
                    className="h-7 px-3 text-[12px] text-[#0d9488] hover:bg-[#f0fdfa]
                               hover:text-[#0f766e] rounded-md"
                  >
                    {r.teacher_comment ? "Edit" : "Comment"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Director comment note */}
        {filtered.some(r => r.director_comment) && (
          <div className="px-5 py-3 border-t border-[#f3f4f6] bg-[#fafaf9]">
            <p className={`text-[11px] font-semibold ${T.muted} uppercase tracking-wider mb-2`}>
              Director feedback
            </p>
            <div className="space-y-1.5">
              {filtered.filter(r => r.director_comment).map(r => (
                <div key={r.id} className="flex gap-3 text-[12px]">
                  <span className={`font-medium ${T.heading} shrink-0`}>
                    {studentName(r.student_id)}:
                  </span>
                  <span className={T.muted}>{r.director_comment}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── COMMENT DIALOG ── */}
      <Dialog
        open={!!commentTarget}
        onOpenChange={open => { if (!open) { setCommentTarget(null); commentForm.reset() } }}
      >
        <DialogContent className="border-[#e7e5e0] rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-[15px] font-semibold ${T.heading}`}>
              Teacher comment
            </DialogTitle>
            {commentTarget && (
              <p className={`text-[12px] ${T.muted} mt-1`}>
                {studentName(commentTarget.student_id)} ·{" "}
                {commentTarget.term} · {commentTarget.academic_year} ·{" "}
                <span className={`inline-flex items-center justify-center w-5 h-5
                                  rounded-full border text-[11px] font-bold
                                  ${gradeStamp(commentTarget.grade)}`}>
                  {commentTarget.grade}
                </span>
              </p>
            )}
          </DialogHeader>

          <form
            onSubmit={commentForm.handleSubmit(onCommentSubmit)}
            className="space-y-3 mt-1"
          >
            <div>
              <label className={T.label}>Your comment</label>
              <Textarea
                {...commentForm.register("teacher_comment")}
                rows={4}
                placeholder="Write your observation or encouragement for this student..."
                className="border-[#e7e5e0] text-[#1c1917] placeholder:text-[#c4bfba]
                           text-[13px] focus-visible:ring-[#0d9488] focus-visible:ring-1
                           focus-visible:border-[#0d9488] rounded-lg resize-none
                           leading-relaxed"
              />
              {commentForm.formState.errors.teacher_comment && (
                <p className="text-[11px] text-rose-500 mt-1">
                  {commentForm.formState.errors.teacher_comment.message}
                </p>
              )}
            </div>

            {/* Director comment — read only */}
            {commentTarget?.director_comment && (
              <div className="rounded-lg bg-[#f9f7f2] border border-[#e7e5e0] px-3 py-2">
                <p className={`text-[11px] font-semibold ${T.muted} uppercase tracking-wider mb-1`}>
                  Director feedback
                </p>
                <p className={`text-[12px] ${T.muted} leading-relaxed`}>
                  {commentTarget.director_comment}
                </p>
              </div>
            )}

            <DialogFooter className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setCommentTarget(null); commentForm.reset() }}
                className="border-[#e7e5e0] text-[#78716c] hover:bg-[#fffdf7] text-[13px] h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingComment || !commentForm.formState.isDirty}
                className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[13px] h-9 disabled:opacity-50"
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