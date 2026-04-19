"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"
import { Badge }   from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  studentUpdateSchema,
  type StudentUpdateValues,
} from "@/lib/validation/student"
import type { Student } from "@/types/students"

type ClassRecord = { id: string; name: string; grade_level: string }

type Props = {
  initial: { students: Student[]; classes: ClassRecord[] }
  schoolId: string
}

// ── theme tokens
const T = {
  bg:        "bg-[#f5f4f0]",
  card:      "bg-white border border-[#e2ded8] rounded-xl",
  accentBg:  "bg-[#2d6a4f]",
  accentHov: "hover:bg-[#1b4332]",
  accentTxt: "text-[#2d6a4f]",
  muted:     "text-[#8c8476]",
  heading:   "text-[#1a2e1a]",
  border:    "border-[#e2ded8]",
  rowHov:    "hover:bg-[#f9f8f5]",
  input:     "border-[#d1cdc7] text-[#1a2e1a] placeholder:text-[#b0ab9e] focus-visible:ring-[#2d6a4f] focus-visible:ring-1 focus-visible:border-[#2d6a4f] h-9 text-[13px] rounded-lg bg-white",
  label:     "block text-[12px] font-medium text-[#4a5568] mb-1",
  error:     "text-[11px] text-[#c97b4b] mt-1",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function age(dob: string) {
  return Math.floor(
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  )
}

export function StudentsClient({ initial, schoolId }: Props) {
  const [students, setStudents]         = useState<Student[]>(initial.students)
  const classes                         = initial.classes as ClassRecord[]
  const [search, setSearch]             = useState("")
  const [classFilter, setClassFilter]   = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [editOpen, setEditOpen]           = useState(false)
  const [editTarget, setEditTarget]       = useState<Student | null>(null)
  const [saving, setSaving]               = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<StudentUpdateValues>({
    resolver: zodResolver(studentUpdateSchema),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return students.filter(s => {
      const matchQ = !q
        || s.name.toLowerCase().includes(q)
        || (s.guardian_name ?? "").toLowerCase().includes(q)
      const matchC = classFilter === "all" || s.class_id === classFilter
      const matchS =
        statusFilter === "all" ||
        (statusFilter === "active" ? s.is_active : !s.is_active)
      return matchQ && matchC && matchS
    })
  }, [students, search, classFilter, statusFilter])

  const stats = {
    total:   students.length,
    active:  students.filter(s => s.is_active).length,
    inactive: students.filter(s => !s.is_active).length,
  }

  function getClassName(id: string) {
    return classes.find(c => c.id === id)?.name ?? "—"
  }

  function openEdit(s: Student) {
    setEditTarget(s)
    reset({
      name:           s.name,
      date_of_birth:  s.date_of_birth,
      gender:         s.gender,
      guardian_name:  s.guardian_name ?? "",
      guardian_phone: s.guardian_phone ?? "",
      class_id:       s.class_id,
    })
    setEditOpen(true)
  }

  function closeEdit() {
    setEditOpen(false)
    setEditTarget(null)
    reset()
  }

  async function onSubmit(values: StudentUpdateValues) {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/students/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...values }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.detail ?? "Failed to update student")
        return
      }
      setStudents(prev => prev.map(s => s.id === data.id ? data : s))
      if (detailStudent?.id === data.id) setDetailStudent(data)
      closeEdit()
      toast.success("Student updated")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`min-h-screen p-6 space-y-5`}>

      {/* Header */}
      <div>
        <h1 className={`text-[17px] font-semibold ${T.heading} tracking-tight`}>
          Student register
        </h1>
        <p className={`text-[13px] ${T.muted} mt-0.5`}>
          {stats.active} active · {stats.inactive} inactive · {stats.total} total
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Total enrolled", value: stats.total    },
          { label: "Active",         value: stats.active   },
          { label: "Inactive",       value: stats.inactive },
        ] as const).map(s => (
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
          placeholder="Search by student or guardian name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 ${T.input}`}
        />
        <Select value={classFilter} onValueChange={v => setClassFilter(v ?? "all")}>
          <SelectTrigger className="w-44 border-[#d1cdc7] bg-white text-[#4a5568] text-[13px] h-9 rounded-lg">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-36 border-[#d1cdc7] bg-white text-[#4a5568] text-[13px] h-9 rounded-lg">
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
            <TableRow className="bg-[#f5f4f0] hover:bg-[#f5f4f0] border-b border-[#e2ded8]">
              {["Student", "Class", "Age", "Guardian", "Status", "Actions"].map(h => (
                <TableHead
                  key={h}
                  className={`text-[11px] font-semibold ${T.muted} uppercase tracking-wider`}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className={`text-center py-14 ${T.muted} text-[13px]`}>
                  No students found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(s => (
              <TableRow
                key={s.id}
                className={`border-b ${T.border} ${T.rowHov} transition-colors`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
                      style={{ background: "#2d6a4f" }}
                    >
                      {initials(s.name)}
                    </div>
                    <div>
                      <p className={`text-[13px] font-medium ${T.heading}`}>{s.name}</p>
                      <p className={`text-[11px] ${T.muted}`}>
                        Enrolled {new Date(s.enrollment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-[12px] font-medium ${T.accentTxt}`}>
                    {getClassName(s.class_id)}
                  </span>
                </TableCell>
                <TableCell className={`text-[13px] ${T.heading} tabular-nums`}>
                  {age(s.date_of_birth)}
                </TableCell>
                <TableCell>
                  <p className={`text-[13px] ${T.heading}`}>{s.guardian_name ?? "—"}</p>
                  {s.guardian_phone && (
                    <p className={`text-[11px] ${T.muted}`}>{s.guardian_phone}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      s.is_active
                        ? "border-[#2d6a4f] text-[#2d6a4f] bg-[#f0faf5] text-[11px]"
                        : "border-[#c97b4b] text-[#9a5b33] bg-[#fdf3ec] text-[11px]"
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
                      onClick={() => setDetailStudent(s)}
                      className={`h-7 px-3 text-[12px] ${T.accentTxt} hover:bg-[#eef5f1] rounded-md`}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(s)}
                      className={`h-7 px-3 text-[12px] ${T.muted} hover:bg-[#f5f4f0] rounded-md`}
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

      {/* ── DETAIL DIALOG ── */}
      <Dialog
        open={!!detailStudent}
        onOpenChange={open => { if (!open) setDetailStudent(null) }}
      >
        <DialogContent className="border-[#e2ded8] rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-[15px] font-semibold ${T.heading}`}>
              Student profile
            </DialogTitle>
          </DialogHeader>

          {detailStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-[#e2ded8]">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                  style={{ background: "#2d6a4f" }}
                >
                  {initials(detailStudent.name)}
                </div>
                <div>
                  <p className={`text-[15px] font-semibold ${T.heading}`}>
                    {detailStudent.name}
                  </p>
                  <p className={`text-[12px] ${T.muted}`}>
                    {getClassName(detailStudent.class_id)} · {detailStudent.gender}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {[
                  { label: "Date of birth",  value: detailStudent.date_of_birth },
                  { label: "Age",            value: `${age(detailStudent.date_of_birth)} yrs` },
                  { label: "Enrolled",       value: new Date(detailStudent.enrollment_date).toLocaleDateString() },
                  { label: "Status",         value: detailStudent.is_active ? "Active" : "Inactive" },
                  { label: "Guardian",       value: detailStudent.guardian_name ?? "—" },
                  { label: "Phone",          value: detailStudent.guardian_phone ?? "—" },
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
              onClick={() => setDetailStudent(null)}
              className="border-[#d1cdc7] text-[#4a5568] hover:bg-[#f5f4f0] text-[13px] h-9"
            >
              Close
            </Button>
            {detailStudent && (
              <Button
                onClick={() => { openEdit(detailStudent); setDetailStudent(null) }}
                className={`${T.accentBg} ${T.accentHov} text-white text-[13px] h-9`}
              >
                Edit student
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={editOpen} onOpenChange={open => { if (!open) closeEdit() }}>
        <DialogContent className="border-[#e2ded8] rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className={`text-[15px] font-semibold ${T.heading}`}>
              Edit student
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <div>
              <label className={T.label}>Full name</label>
              <Input
                {...register("name")}
                className={T.input}
                placeholder="Student full name"
              />
              {errors.name && (
                <p className={T.error}>{errors.name.message}</p>
              )}
            </div>

            {/* DOB + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.label}>Date of birth</label>
                <Input
                  {...register("date_of_birth")}
                  className={T.input}
                  placeholder="YYYY-MM-DD"
                />
                {errors.date_of_birth && (
                  <p className={T.error}>{errors.date_of_birth.message}</p>
                )}
              </div>

              <div>
                <label className={T.label}>Gender</label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={v => field.onChange(v ?? "")}
                    >
                      <SelectTrigger className="border-[#d1cdc7] bg-white text-[#1a2e1a] h-9 text-[13px] rounded-lg w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && (
                  <p className={T.error}>{errors.gender.message}</p>
                )}
              </div>
            </div>

            {/* Class */}
            <div>
              <label className={T.label}>Class</label>
              <Controller
                control={control}
                name="class_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={v => field.onChange(v ?? "")}
                  >
                    <SelectTrigger className="border-[#d1cdc7] bg-white text-[#1a2e1a] h-9 text-[13px] rounded-lg w-full">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.class_id && (
                <p className={T.error}>{errors.class_id.message}</p>
              )}
            </div>

            {/* Guardian name + phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.label}>Guardian name</label>
                <Input
                  {...register("guardian_name")}
                  className={T.input}
                  placeholder="Parent or guardian"
                />
                {errors.guardian_name && (
                  <p className={T.error}>{errors.guardian_name.message}</p>
                )}
              </div>

              <div>
                <label className={T.label}>Guardian phone</label>
                <Input
                  {...register("guardian_phone")}
                  className={T.input}
                  placeholder="+250 7XX XXX XXX"
                />
                {errors.guardian_phone && (
                  <p className={T.error}>{errors.guardian_phone.message}</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                className="border-[#d1cdc7] text-[#4a5568] hover:bg-[#f5f4f0] text-[13px] h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !isDirty}
                className={`${T.accentBg} ${T.accentHov} text-white text-[13px] h-9 disabled:opacity-50`}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}