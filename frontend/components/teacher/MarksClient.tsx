"use client"

import { useState, useMemo, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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

import { markContextSchema, type MarkContextValues } from "@/lib/validation/mark"
import type { Mark, MarkCreate } from "@/types/marks"

// ── theme tokens
const T = {
  page:      "bg-[#fafaf9]",
  heading:   "text-[#111827]",
  muted:     "text-[#6b7280]",
  card:      "bg-white border border-[#e5e7eb] rounded-xl",
  input:     "border-[#e5e7eb] text-[#111827] placeholder:text-[#d1d5db] focus-visible:ring-[#0d9488] focus-visible:ring-1 focus-visible:border-[#0d9488] h-9 text-[13px] rounded-lg bg-white",
  label:     "block text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider mb-1",
}

const EXAM_TYPES = ["CAT", "MID", "FINAL", "PRACTICAL", "ASSIGNMENT"]
const TERMS      = ["Term 1", "Term 2", "Term 3"]

type Student = { id: string; name: string; is_active: boolean }
type Subject = { id: string; name: string }

// cell key for looking up marks
function cellKey(studentId: string, subjectId: string) {
  return `${studentId}::${subjectId}`
}

// score color
function scoreColor(score: number, max: number) {
  const pct = (score / max) * 100
  if (pct >= 80) return "text-emerald-600"
  if (pct >= 60) return "text-amber-600"
  if (pct >= 50) return "text-orange-500"
  return "text-rose-600"
}

type Props = {
  classId:      string
  students:     Student[]
  subjects:     Subject[]
  initialMarks: Mark[]
}

type CellState = {
  markId:  string | null   // null = not yet saved
  value:   string          // string for input binding
  dirty:   boolean         // changed since last save
  saving:  boolean
  error:   string | null
}

export function MarksClient({ classId, students, subjects, initialMarks }: Props) {
  // ── context form (term, year, exam type, max score)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<MarkContextValues>({
    resolver: zodResolver(markContextSchema),
    defaultValues: {
      term:          "Term 1",
      academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      exam_type:     "CAT",
      max_score:     100,
    },
    mode: "onChange",
  })

  const context = watch()

  // ── active context (committed when teacher clicks "Load / Apply")
  const [activeCtx, setActiveCtx] = useState<MarkContextValues | null>(null)

  // ── cell grid: key → CellState
  const [cells, setCells] = useState<Record<string, CellState>>({})

  // ── marks index (from initial load + server updates)
  const [marksIndex, setMarksIndex] = useState<Record<string, Mark>>(() => {
    const idx: Record<string, Mark> = {}
    initialMarks.forEach(m => { idx[cellKey(m.student_id, m.subject_id)] = m })
    return idx
  })

  // ── active students only
  const activeStudents = useMemo(
    () => students.filter(s => s.is_active),
    [students]
  )

  // ── load / switch context
  function onLoadContext(values: MarkContextValues) {
    setActiveCtx(values)

    // pre-fill cells from existing marks for this context
    const next: Record<string, CellState> = {}
    activeStudents.forEach(s => {
      subjects.forEach(sub => {
        const key  = cellKey(s.id, sub.id)
        const mark = Object.values(marksIndex).find(
          m =>
            m.student_id    === s.id         &&
            m.subject_id    === sub.id       &&
            m.term          === values.term  &&
            m.academic_year === values.academic_year &&
            m.exam_type     === values.exam_type
        )
        next[key] = {
          markId:  mark?.id   ?? null,
          value:   mark        ? String(mark.score) : "",
          dirty:   false,
          saving:  false,
          error:   null,
        }
      })
    })
    setCells(next)
    toast.success(`Loaded ${values.term} · ${values.exam_type}`)
  }

  // ── cell change
  const onCellChange = useCallback(
    (studentId: string, subjectId: string, value: string) => {
      const key = cellKey(studentId, subjectId)
      setCells(prev => ({
        ...prev,
        [key]: { ...prev[key], value, dirty: true, error: null },
      }))
    },
    []
  )

  // ── validate a single score string
  function validateScore(value: string, max: number): string | null {
    if (value === "") return null          // empty = skip
    const n = Number(value)
    if (isNaN(n))       return "Must be a number"
    if (n < 0)          return "Min 0"
    if (n > max)        return `Max ${max}`
    return null
  }

  // ── save all dirty cells
  async function saveAll() {
    if (!activeCtx) return

    const toCreate: MarkCreate[] = []
    const toUpdate: { markId: string; score: number; key: string }[] = []

    // validate first
    let hasError = false
    const validated = { ...cells }

    activeStudents.forEach(s => {
      subjects.forEach(sub => {
        const key  = cellKey(s.id, sub.id)
        const cell = cells[key]
        if (!cell || !cell.dirty || cell.value === "") return

        const err = validateScore(cell.value, activeCtx.max_score)
        if (err) {
          validated[key] = { ...cell, error: err }
          hasError = true
          return
        }

        const score = Number(cell.value)
        if (cell.markId) {
          toUpdate.push({ markId: cell.markId, score, key })
        } else {
          toCreate.push({
            student_id:    s.id,
            subject_id:    sub.id,
            class_id:      classId,
            term:          activeCtx.term,
            academic_year: activeCtx.academic_year,
            exam_type:     activeCtx.exam_type,
            score,
            max_score:     activeCtx.max_score,
          })
        }
      })
    })

    if (hasError) {
      setCells(validated)
      toast.error("Fix validation errors before saving")
      return
    }

    if (toCreate.length === 0 && toUpdate.length === 0) {
      toast("No changes to save")
      return
    }

    // mark all as saving
    setCells(prev => {
      const next = { ...prev }
      ;[...toCreate.map(c => cellKey(c.student_id, c.subject_id)),
        ...toUpdate.map(u => u.key)].forEach(k => {
        if (next[k]) next[k] = { ...next[k], saving: true }
      })
      return next
    })

    let createErrors = 0
    let updateErrors = 0

    // bulk create
    if (toCreate.length > 0) {
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toCreate),
      })
      if (res.ok) {
        const created: Mark[] = await res.json()
        setMarksIndex(prev => {
          const next = { ...prev }
          created.forEach(m => { next[cellKey(m.student_id, m.subject_id)] = m })
          return next
        })
        setCells(prev => {
          const next = { ...prev }
          created.forEach(m => {
            const k = cellKey(m.student_id, m.subject_id)
            if (next[k]) next[k] = { ...next[k], markId: m.id, dirty: false, saving: false }
          })
          return next
        })
      } else {
        createErrors++
      }
    }

    // individual patches
    await Promise.all(
      toUpdate.map(async ({ markId, score, key }) => {
        const res = await fetch(`/api/marks/${markId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score }),
        })
        if (res.ok) {
          const updated: Mark = await res.json()
          setMarksIndex(prev => ({
            ...prev,
            [cellKey(updated.student_id, updated.subject_id)]: updated,
          }))
          setCells(prev => ({
            ...prev,
            [key]: { ...prev[key], dirty: false, saving: false },
          }))
        } else {
          updateErrors++
          setCells(prev => ({
            ...prev,
            [key]: { ...prev[key], saving: false, error: "Save failed" },
          }))
        }
      })
    )

    if (createErrors === 0 && updateErrors === 0) {
      toast.success(`Saved ${toCreate.length + toUpdate.length} mark${toCreate.length + toUpdate.length !== 1 ? "s" : ""}`)
    } else {
      toast.error(`${createErrors + updateErrors} mark(s) failed to save`)
    }
  }

  // ── dirty count
  const dirtyCount = useMemo(
    () => Object.values(cells).filter(c => c.dirty && c.value !== "").length,
    [cells]
  )

  return (
    <div className={`${T.page} space-y-5`}>

      {/* Context bar */}
      <div className={`${T.card} p-5`}>
        <h2 className={`text-[14px] font-semibold ${T.heading} mb-4`}>
          Gradebook context
        </h2>

        <form onSubmit={handleSubmit(onLoadContext)}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">

            {/* Term */}
            <div>
              <label className={T.label}>Term</label>
              <Select
                value={context.term}
                onValueChange={v => setValue("term", v ?? "Term 1", { shouldValidate: true })}
              >
                <SelectTrigger className="border-[#e5e7eb] bg-white text-[#111827] h-9 text-[13px] rounded-lg w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERMS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.term && <p className="text-[11px] text-rose-500 mt-1">{errors.term.message}</p>}
            </div>

            {/* Academic year */}
            <div>
              <label className={T.label}>Academic year</label>
              <Input
                {...register("academic_year")}
                className={T.input}
                placeholder="2024-2025"
              />
              {errors.academic_year && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.academic_year.message}</p>
              )}
            </div>

            {/* Exam type */}
            <div>
              <label className={T.label}>Exam type</label>
              <Select
                value={context.exam_type}
                onValueChange={v => setValue("exam_type", v as MarkContextValues["exam_type"] ?? "CAT", { shouldValidate: true })}
              >
                <SelectTrigger className="border-[#e5e7eb] bg-white text-[#111827] h-9 text-[13px] rounded-lg w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_TYPES.map(e => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.exam_type && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.exam_type.message}</p>
              )}
            </div>

            {/* Max score */}
            <div>
              <label className={T.label}>Max score</label>
              <Input
                {...register("max_score", { valueAsNumber: true })}
                type="number"
                className={T.input}
                placeholder="100"
              />
              {errors.max_score && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.max_score.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={!isValid}
              className="bg-[#111827] hover:bg-[#1f2937] text-white text-[13px] h-9 px-5 rounded-lg shadow-none disabled:opacity-40"
            >
              Load gradebook
            </Button>
            {activeCtx && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#e5e7eb] text-[#6b7280] text-[11px]">
                  {activeCtx.term}
                </Badge>
                <Badge variant="outline" className="border-[#e5e7eb] text-[#6b7280] text-[11px]">
                  {activeCtx.exam_type}
                </Badge>
                <Badge variant="outline" className="border-[#e5e7eb] text-[#6b7280] text-[11px]">
                  /{activeCtx.max_score}
                </Badge>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Gradebook grid */}
      {!activeCtx ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl
                        border border-dashed border-[#e5e7eb]">
          <div className="w-10 h-10 rounded-full bg-[#f0fdfa] flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-[#0d9488]" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V6.375m0 0A2.25 2.25 0 015.625 4.125h12.75A2.25 2.25 0 0120.625 6.375m0 12V6.375m0 0v-.75A2.25 2.25 0 0018.375 3.375H5.625A2.25 2.25 0 003.375 5.625v.75" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[#6b7280]">Set context to load gradebook</p>
          <p className="text-[12px] text-[#9ca3af] mt-1">
            Select term, year and exam type above then click Load
          </p>
        </div>
      ) : (
        <div className={`${T.card} overflow-hidden`}>

          {/* Table header + save bar */}
          <div className="flex items-center justify-between px-5 py-3
                          border-b border-[#e5e7eb] bg-[#f9fafb]">
            <p className={`text-[13px] font-medium ${T.heading}`}>
              {activeStudents.length} students · {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-3">
              {dirtyCount > 0 && (
                <span className="text-[12px] text-amber-600 font-medium">
                  {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
                </span>
              )}
              <Button
                onClick={saveAll}
                disabled={dirtyCount === 0}
                className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[13px]
                           h-8 px-4 rounded-lg shadow-none disabled:opacity-40"
              >
                Save all
              </Button>
            </div>
          </div>

          {/* Scrollable grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#111827]">
                  <th className="sticky left-0 z-10 bg-[#111827] text-left px-4 py-3
                                 text-[11px] font-semibold text-[#9ca3af] uppercase
                                 tracking-wider w-48 min-w-48">
                    Student
                  </th>
                  {subjects.map(sub => (
                    <th
                      key={sub.id}
                      className="px-3 py-3 text-center text-[11px] font-semibold
                                 text-[#9ca3af] uppercase tracking-wider min-w-25"
                    >
                      {sub.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-[11px] font-semibold
                                 text-[#9ca3af] uppercase tracking-wider min-w-20">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeStudents.map((student, si) => {
                  // row total
                  const rowScores = subjects.map(sub => {
                    const cell = cells[cellKey(student.id, sub.id)]
                    const v    = Number(cell?.value)
                    return isNaN(v) || cell?.value === "" ? null : v
                  })
                  const filled = rowScores.filter(v => v !== null) as number[]
                  const total  = filled.length > 0
                    ? filled.reduce((a, b) => a + b, 0)
                    : null
                  const maxTotal = activeCtx.max_score * filled.length

                  return (
                    <tr
                      key={student.id}
                      className={`border-b border-[#f3f4f6] transition-colors
                        ${si % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}
                        hover:bg-[#f0fdfa]`}
                    >
                      {/* Student name — sticky */}
                      <td className={`sticky left-0 z-10 px-4 py-2 font-medium
                        ${T.heading} border-r border-[#f3f4f6]
                        ${si % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}
                        group-hover:bg-[#f0fdfa]`}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center
                                       text-[9px] font-bold text-white shrink-0"
                            style={{ background: "#0d9488" }}
                          >
                            {student.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate max-w-32.5">{student.name}</span>
                        </div>
                      </td>

                      {/* Score cells */}
                      {subjects.map(sub => {
                        const key  = cellKey(student.id, sub.id)
                        const cell = cells[key]
                        const isDirty  = cell?.dirty  ?? false
                        const isSaving = cell?.saving ?? false
                        const hasError = !!cell?.error

                        return (
                          <td key={sub.id} className="px-2 py-1.5 text-center">
                            <div className="relative flex items-center justify-center">
                              <input
                                type="number"
                                min={0}
                                max={activeCtx.max_score}
                                step="0.5"
                                value={cell?.value ?? ""}
                                onChange={e => onCellChange(student.id, sub.id, e.target.value)}
                                disabled={isSaving}
                                placeholder="—"
                                className={`
                                  w-16 h-8 text-center text-[13px] font-mono rounded-lg
                                  border transition-all outline-none
                                  disabled:opacity-50
                                  [appearance:textfield]
                                  [&::-webkit-outer-spin-button]:appearance-none
                                  [&::-webkit-inner-spin-button]:appearance-none
                                  ${hasError
                                    ? "border-rose-400 bg-rose-50 text-rose-600"
                                    : isDirty
                                      ? "border-amber-400 bg-amber-50 text-amber-700 font-semibold"
                                      : cell?.markId
                                        ? "border-[#e5e7eb] bg-white " + scoreColor(Number(cell.value), activeCtx.max_score)
                                        : "border-[#e5e7eb] bg-white text-[#6b7280]"
                                  }
                                  focus:border-[#0d9488] focus:ring-1 focus:ring-[#0d9488]
                                `}
                              />
                              {hasError && (
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2
                                               text-[9px] text-rose-500 whitespace-nowrap z-20">
                                  {cell.error}
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      })}

                      {/* Row total */}
                      <td className="px-4 py-2 text-center border-l border-[#f3f4f6]">
                        {total !== null ? (
                          <span className={`text-[13px] font-semibold font-mono
                            ${scoreColor(total, maxTotal)}`}>
                            {total}/{maxTotal}
                          </span>
                        ) : (
                          <span className="text-[#d1d5db] text-[12px]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          <div className="flex items-center gap-5 px-5 py-3 border-t border-[#f3f4f6]
                          bg-[#f9fafb] text-[11px] text-[#9ca3af]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400" />
              Unsaved change
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400" />
              ≥ 80% (A)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400" />
              60–79% (C/B)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-400" />
              &lt; 50% (F)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}