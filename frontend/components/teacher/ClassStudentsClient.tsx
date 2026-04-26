"use client"

import { useState, useMemo } from "react"
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
  studentEnrollSchema,
  studentUpdateSchema,
  type StudentEnrollValues,
  type StudentUpdateValues,
} from "@/lib/validation/students"
import type { Student } from "@/types/students"

// ── theme  (teal + warm off-white, consistent with teacher portal)
const T = {
  page:      "min-h-screen bg-[#fafaf9]",
  card:      "bg-white border border-[#e7e5e4] rounded-2xl",
  heading:   "text-[#0f2027]",
  muted:     "text-[#78716c]",
  accent:    "#0d9488",
  accentBg:  "bg-[#0d9488]",
  accentHov: "hover:bg-[#0f766e]",
  accentTxt: "text-[#0d9488]",
  border:    "border-[#e7e5e4]",
  rowHov:    "hover:bg-[#fafaf9]",
  input:     `border-[#e7e5e4] text-[#0f2027] placeholder:text-[#c4bfba]
              focus-visible:ring-[#0d9488] focus-visible:ring-1
              focus-visible:border-[#0d9488] h-9 text-[13px] rounded-lg bg-white`,
  label:     "block text-[12px] font-medium text-[#78716c] mb-1",
  error:     "text-[11px] text-rose-500 mt-1",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function age(dob: string) {
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )
}

// gender label
const GENDER_LABEL: Record<string, string> = { M: "Male", F: "Female", Other: "Other" }

type Props = { students: Student[]; classId: string }

// ── plain value/error shape — no react-hook-form types
type StudentFieldValues = {
  name:            string
  date_of_birth:   string
  gender:          string
  guardian_name:   string
  guardian_phone:  string
  enrollment_date: string
}

type StudentFieldErrors = Partial<Record<keyof StudentFieldValues, string>>

// ── purely controlled presentational component
function StudentFields({
  values,
  errors,
  onChange,
  inputCls,
}: {
  values:   StudentFieldValues
  errors:   StudentFieldErrors
  onChange: (field: keyof StudentFieldValues, value: string) => void
  inputCls: string
}) {
  return (
    <div className="space-y-3">
      {/* Name */}
      <div>
        <label className={T.label}>Full name *</label>
        <Input
          value={values.name}
          onChange={e => onChange("name", e.target.value)}
          className={inputCls}
          placeholder="e.g. Alice Uwimana"
        />
        {errors.name && <p className={T.error}>{errors.name}</p>}
      </div>

      {/* DOB + Gender */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={T.label}>Date of birth *</label>
          <Input
            value={values.date_of_birth}
            onChange={e => onChange("date_of_birth", e.target.value)}
            className={inputCls}
            placeholder="YYYY-MM-DD"
          />
          {errors.date_of_birth && (
            <p className={T.error}>{errors.date_of_birth}</p>
          )}
        </div>
        <div>
          <label className={T.label}>Gender *</label>
          <Select
            value={values.gender}
            onValueChange={v => onChange("gender", v ?? "")}
          >
            <SelectTrigger className="border-[#e7e5e4] bg-white text-[#0f2027] h-9 text-[13px] rounded-lg w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Male</SelectItem>
              <SelectItem value="F">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className={T.error}>{errors.gender}</p>}
        </div>
      </div>

      {/* Guardian */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={T.label}>Guardian name</label>
          <Input
            value={values.guardian_name}
            onChange={e => onChange("guardian_name", e.target.value)}
            className={inputCls}
            placeholder="Parent or guardian"
          />
          {errors.guardian_name && (
            <p className={T.error}>{errors.guardian_name}</p>
          )}
        </div>
        <div>
          <label className={T.label}>Guardian phone</label>
          <Input
            value={values.guardian_phone}
            onChange={e => onChange("guardian_phone", e.target.value)}
            className={inputCls}
            placeholder="+250 7XX XXX XXX"
          />
          {errors.guardian_phone && (
            <p className={T.error}>{errors.guardian_phone}</p>
          )}
        </div>
      </div>

      {/* Enrollment date */}
      <div>
        <label className={T.label}>Enrollment date</label>
        <Input
          value={values.enrollment_date}
          onChange={e => onChange("enrollment_date", e.target.value)}
          className={inputCls}
          placeholder={`Defaults to today (${new Date().toISOString().slice(0, 10)})`}
        />
        {errors.enrollment_date && (
          <p className={T.error}>{errors.enrollment_date}</p>
        )}
      </div>
    </div>
  )
}

export function ClassStudentsClient({ students: initial, classId }: Props) {
  const [students, setStudents]         = useState<Student[]>(initial)
  const [search, setSearch]             = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // dialogs
  const [enrollOpen, setEnrollOpen]   = useState(false)
  const [editTarget, setEditTarget]   = useState<Student | null>(null)
  const [detailTarget, setDetailTarget] = useState<Student | null>(null)
  const [saving, setSaving]           = useState(false)

  // ── shared blank field state
  const BLANK: StudentFieldValues = {
    name: "", date_of_birth: "", gender: "",
    guardian_name: "", guardian_phone: "", enrollment_date: "",
  }

  // ── enroll form
  const enrollForm = useForm<StudentEnrollValues>({
    resolver: zodResolver(studentEnrollSchema),
  })
  const [enrollValues, setEnrollValues] = useState<StudentFieldValues>(BLANK)

  // ── edit form
  const editForm = useForm<StudentUpdateValues>({
    resolver: zodResolver(studentUpdateSchema),
  })
  const [editValues, setEditValues] = useState<StudentFieldValues>(BLANK)

  function onEnrollChange(field: keyof StudentFieldValues, value: string) {
  setEnrollValues(prev => ({ ...prev, [field]: value }))
  enrollForm.setValue(field as keyof StudentEnrollValues, value as never, {
    shouldDirty: true,
    shouldValidate: true,
  })
}

function onEditChange(field: keyof StudentFieldValues, value: string) {
  setEditValues(prev => ({ ...prev, [field]: value }))
  editForm.setValue(field as keyof StudentUpdateValues, value as never, {
    shouldDirty: true,
    shouldValidate: true,
  })
}

  // ── derived list
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter(s => {
      const matchQ = !q
        || s.name.toLowerCase().includes(q)
        || (s.guardian_name ?? "").toLowerCase().includes(q)
      const matchS =
        statusFilter === "all" ||
        (statusFilter === "active" ? s.is_active : !s.is_active)
      return matchQ && matchS
    })
  }, [students, search, statusFilter])

  const stats = {
    total:   students.length,
    active:  students.filter(s => s.is_active).length,
    inactive: students.filter(s => !s.is_active).length,
  }

  // ── enroll
  async function onEnroll(values: StudentEnrollValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/classes/${classId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.detail ?? "Failed to enroll student")
        return
      }
      setStudents(prev => [...prev, data])
      setEnrollOpen(false)
      enrollForm.reset()
      toast.success(`${data.name} enrolled`)
    } finally {
      setSaving(false)
    }
  }

  function openEdit(s: Student) {
    setEditTarget(s)
    const v: StudentFieldValues = {
      name:            s.name,
      date_of_birth:   s.date_of_birth,
      gender:          s.gender,
      guardian_name:   s.guardian_name  ?? "",
      guardian_phone:  s.guardian_phone ?? "",
      enrollment_date: s.enrollment_date,
    }
    setEditValues(v)
    editForm.reset({
      name:            s.name,
      date_of_birth:   s.date_of_birth,
      gender:          s.gender,
      guardian_name:   s.guardian_name  ?? "",
      guardian_phone:  s.guardian_phone ?? "",
      enrollment_date: s.enrollment_date,
    })
  }

  // ── save edit
  async function onEdit(values: StudentUpdateValues) {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/students/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.detail ?? "Failed to update")
        return
      }
      setStudents(prev => prev.map(s => s.id === data.id ? data : s))
      if (detailTarget?.id === data.id) setDetailTarget(data)
      setEditTarget(null)
      editForm.reset()
      toast.success("Student updated")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={T.page}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`text-[16px] font-semibold ${T.heading}`}>Students</h2>
            <p className={`text-[13px] ${T.muted} mt-0.5`}>
              {stats.active} active · {stats.inactive} inactive
            </p>
          </div>
          <Button
            onClick={() => { enrollForm.reset(); setEnrollOpen(true) }}
            className={`${T.accentBg} ${T.accentHov} text-white text-[13px] h-9 px-4 rounded-lg shadow-none`}
          >
            + Enroll student
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total",   value: stats.total,    color: "bg-[#f0fdfa] text-[#0d9488]" },
            { label: "Active",  value: stats.active,   color: "bg-violet-50 text-violet-600" },
            { label: "Inactive", value: stats.inactive, color: "bg-rose-50 text-rose-500" },
          ].map(s => (
            <div key={s.label} className={`${T.card} p-4`}>
              <p className={`text-[11px] font-medium ${T.muted} uppercase tracking-wider`}>
                {s.label}
              </p>
              <p className={`text-[26px] font-semibold ${T.heading} mt-1 tabular-nums`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex gap-3">
          <Input
            placeholder="Search by name or guardian..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`flex-1 ${T.input}`}
          />
          <Select
            value={statusFilter}
            onValueChange={v => setStatusFilter(v ?? "all")}
          >
            <SelectTrigger className="w-36 border-[#e7e5e4] bg-white text-[#78716c] text-[13px] h-9 rounded-lg">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className={`${T.card} overflow-hidden`}>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#fafaf9] hover:bg-[#fafaf9] border-b border-[#e7e5e4]">
                {["Student", "Age", "Gender", "Guardian", "Enrolled", "Status", ""].map(h => (
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
                    colSpan={7}
                    className={`text-center py-14 ${T.muted} text-[13px]`}
                  >
                    {search ? "No students match your search." : "No students enrolled yet."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(s => (
                <TableRow
                  key={s.id}
                  className={`border-b ${T.border} ${T.rowHov} transition-colors`}
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center
                                   text-[11px] font-semibold text-white shrink-0"
                        style={{ background: "#0d9488" }}
                      >
                        {initials(s.name)}
                      </div>
                      <p className={`text-[13px] font-medium ${T.heading}`}>{s.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className={`text-[13px] ${T.heading} tabular-nums`}>
                    {age(s.date_of_birth)}
                  </TableCell>
                  <TableCell className={`text-[12px] ${T.muted}`}>
                    {GENDER_LABEL[s.gender] ?? s.gender}
                  </TableCell>
                  <TableCell>
                    <p className={`text-[13px] ${T.heading}`}>{s.guardian_name ?? "—"}</p>
                    {s.guardian_phone && (
                      <p className={`text-[11px] ${T.muted}`}>{s.guardian_phone}</p>
                    )}
                  </TableCell>
                  <TableCell className={`text-[12px] ${T.muted}`}>
                    {new Date(s.enrollment_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.is_active
                          ? "border-[#0d9488] text-[#0d9488] bg-[#f0fdfa] text-[10px]"
                          : "border-rose-300 text-rose-500 bg-rose-50 text-[10px]"
                      }
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailTarget(s)}
                        className={`h-7 px-3 text-[12px] ${T.accentTxt} hover:bg-[#f0fdfa] rounded-md`}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(s)}
                        className={`h-7 px-3 text-[12px] ${T.muted} hover:bg-[#fafaf9] rounded-md`}
                      >
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── ENROLL DIALOG ── */}
      <Dialog
        open={enrollOpen}
        onOpenChange={open => { setEnrollOpen(open); if (!open) { enrollForm.reset(); setEnrollValues(BLANK) } }}
      >
        <DialogContent className="border-[#e7e5e4] rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className={`text-[15px] font-semibold ${T.heading}`}>
              Enroll new student
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={enrollForm.handleSubmit(onEnroll)} className="space-y-1">
            <StudentFields
              values={enrollValues}
              errors={Object.fromEntries(
                Object.entries(enrollForm.formState.errors).map(
                  ([k, v]) => [k, (v as { message?: string })?.message ?? ""]
                )
              )}
              onChange={onEnrollChange}
              inputCls={T.input}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEnrollOpen(false); enrollForm.reset() }}
                className="border-[#e7e5e4] text-[#78716c] hover:bg-[#fafaf9] text-[13px] h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className={`${T.accentBg} ${T.accentHov} text-white text-[13px] h-9 disabled:opacity-50`}
              >
                {saving ? "Enrolling..." : "Enroll student"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog
        open={!!editTarget}
        onOpenChange={open => { if (!open) { setEditTarget(null); editForm.reset(); setEditValues(BLANK) } }}
      >
        <DialogContent className="border-[#e7e5e4] rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className={`text-[15px] font-semibold ${T.heading}`}>
              Edit student
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-1">
            <StudentFields
              values={editValues}
              errors={Object.fromEntries(
                Object.entries(editForm.formState.errors).map(
                  ([k, v]) => [k, (v as { message?: string })?.message ?? ""]
                )
              )}
              onChange={onEditChange}
              inputCls={T.input}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEditTarget(null); editForm.reset() }}
                className="border-[#e7e5e4] text-[#78716c] hover:bg-[#fafaf9] text-[13px] h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !editForm.formState.isDirty}
                className={`${T.accentBg} ${T.accentHov} text-white text-[13px] h-9 disabled:opacity-50`}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DETAIL DIALOG ── */}
      <Dialog
        open={!!detailTarget}
        onOpenChange={open => { if (!open) setDetailTarget(null) }}
      >
        <DialogContent className="border-[#e7e5e4] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-[15px] font-semibold ${T.heading}`}>
              Student profile
            </DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#e7e5e4]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center
                             text-[14px] font-bold text-white shrink-0"
                  style={{ background: "#0d9488" }}
                >
                  {initials(detailTarget.name)}
                </div>
                <div>
                  <p className={`text-[15px] font-semibold ${T.heading}`}>
                    {detailTarget.name}
                  </p>
                  <p className={`text-[12px] ${T.muted}`}>
                    {GENDER_LABEL[detailTarget.gender]} · {age(detailTarget.date_of_birth)} years old
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {[
                  { label: "Date of birth",  value: detailTarget.date_of_birth },
                  { label: "Enrolled",       value: new Date(detailTarget.enrollment_date).toLocaleDateString() },
                  { label: "Guardian",       value: detailTarget.guardian_name  ?? "—" },
                  { label: "Phone",          value: detailTarget.guardian_phone ?? "—" },
                  { label: "Status",         value: detailTarget.is_active ? "Active" : "Inactive" },
                ].map(r => (
                  <div key={r.label}>
                    <p className={`text-[11px] font-medium ${T.muted} uppercase tracking-wider mb-0.5`}>
                      {r.label}
                    </p>
                    <p className={`text-[13px] font-medium ${T.heading}`}>{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailTarget(null)}
              className="border-[#e7e5e4] text-[#78716c] hover:bg-[#fafaf9] text-[13px] h-9"
            >
              Close
            </Button>
            {detailTarget && (
              <Button
                onClick={() => { openEdit(detailTarget); setDetailTarget(null) }}
                className={`${T.accentBg} ${T.accentHov} text-white text-[13px] h-9`}
              >
                Edit student
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}