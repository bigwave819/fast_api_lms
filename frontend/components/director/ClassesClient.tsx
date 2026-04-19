"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { ClassRecord, Assignment, ClassFormData, AssignmentFormData } from "@/types/classes"

type Props = {
  initial: { classes: ClassRecord[]; assignments: Assignment[] }
  schoolId: string
}

const EMPTY_CLASS_FORM: ClassFormData = {
  name: "",
  grade_level: "",
  academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
}

const GRADE_LEVELS = ["P1","P2","P3","P4","P5","P6","S1","S2","S3","S4","S5","S6"]

export function ClassesClient({ initial, schoolId }: Props) {
  const [classes, setClasses]         = useState<ClassRecord[]>(initial.classes)
  const [assignments, setAssignments] = useState<Assignment[]>(initial.assignments)

  const [search, setSearch]       = useState("")
  const [yearFilter, setYearFilter] = useState<string>("all")

  const [addOpen, setAddOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState<ClassRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClassRecord | null>(null)

  const [assignOpen, setAssignOpen]         = useState(false)
  const [removeAssignTarget, setRemoveAssignTarget] = useState<Assignment | null>(null)
  const [selectedClassForAssign, setSelectedClassForAssign] = useState<ClassRecord | null>(null)

  const [classForm, setClassForm]     = useState<ClassFormData>(EMPTY_CLASS_FORM)
  const [assignForm, setAssignForm]   = useState<AssignmentFormData>({ teacher_id: "", class_id: "", subject_id: "" })
  const [saving, setSaving]           = useState(false)
  const [apiError, setApiError]       = useState("")

  // derive unique years from classes
  const years = useMemo(() => {
    const s = new Set(classes.map(c => c.academic_year))
    return Array.from(s).sort().reverse()
  }, [classes])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return classes.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.grade_level.toLowerCase().includes(q)
      const matchY = yearFilter === "all" || c.academic_year === yearFilter
      return matchQ && matchY
    })
  }, [classes, search, yearFilter])

  // ── stats
  const stats = {
    total:        classes.length,
    totalAssign:  assignments.length,
    years:        years.length,
  }

  // ── helpers
  function classField(key: keyof ClassFormData, val: string) {
    setClassForm(f => ({ ...f, [key]: val }))
  }

  function assignmentsForClass(classId: string) {
    return assignments.filter(a => a.class_id === classId)
  }

  // ── class CRUD
  async function handleAddClass() {
    if (!classForm.name.trim() || !classForm.grade_level || !classForm.academic_year.trim()) {
      setApiError("All fields are required.")
      return
    }
    setSaving(true); setApiError("")
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...classForm }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.detail ?? "Failed to create class"); return }
      setClasses(prev => [...prev, data])
      setAddOpen(false)
      setClassForm(EMPTY_CLASS_FORM)
      toast.success("Class created")
    } finally { setSaving(false) }
  }

  async function handleEditClass() {
    if (!editTarget) return
    setSaving(true); setApiError("")
    try {
      const res = await fetch(`/api/classes/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...classForm }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.detail ?? "Failed to update"); return }
      setClasses(prev => prev.map(c => c.id === data.id ? data : c))
      setEditTarget(null)
      toast.success("Class updated")
    } finally { setSaving(false) }
  }

  async function handleDeleteClass() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/classes/${deleteTarget.id}?schoolId=${schoolId}`, {
        method: "DELETE",
      })
      if (res.status === 204) {
        setClasses(prev => prev.filter(c => c.id !== deleteTarget.id))
        setAssignments(prev => prev.filter(a => a.class_id !== deleteTarget.id))
        setDeleteTarget(null)
        toast.success("Class deleted")
        return
      }
      const data = await res.json()
      toast.error(data.detail ?? "Could not delete class")
    } finally { setSaving(false) }
  }

  // ── assignments
  function openAssign(cls: ClassRecord) {
    setSelectedClassForAssign(cls)
    setAssignForm({ teacher_id: "", class_id: cls.id, subject_id: "" })
    setApiError("")
    setAssignOpen(true)
  }

  async function handleAssign() {
    if (!assignForm.teacher_id || !assignForm.class_id || !assignForm.subject_id) {
      setApiError("All fields are required.")
      return
    }
    setSaving(true); setApiError("")
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, ...assignForm }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.detail ?? "Failed to assign"); return }
      setAssignments(prev => [...prev, data])
      setAssignOpen(false)
      toast.success("Teacher assigned")
    } finally { setSaving(false) }
  }

  async function handleRemoveAssignment() {
    if (!removeAssignTarget) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/assignments/${removeAssignTarget.id}?schoolId=${schoolId}`,
        { method: "DELETE" }
      )
      if (res.status === 204) {
        setAssignments(prev => prev.filter(a => a.id !== removeAssignTarget.id))
        setRemoveAssignTarget(null)
        toast.success("Assignment removed")
        return
      }
      toast.error("Could not remove assignment")
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6 space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-blue-900">Class management</h1>
          <p className="text-sm text-blue-400 mt-0.5">Create classes and assign teachers to subjects</p>
        </div>
        <Button
          className="bg-[#1558a8] hover:bg-[#0c447c] text-white"
          onClick={() => { setClassForm(EMPTY_CLASS_FORM); setApiError(""); setAddOpen(true) }}
        >
          + New class
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total classes",      value: stats.total },
          { label: "Total assignments",  value: stats.totalAssign },
          { label: "Academic years",     value: stats.years },
        ].map(s => (
          <Card key={s.label} className="border-blue-100 bg-white">
            <CardContent className="pt-4">
              <p className="text-xs text-blue-400">{s.label}</p>
              <p className="text-2xl font-medium text-blue-900 mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs: Classes / Assignments */}
      <Tabs defaultValue="classes">
        <TabsList className="bg-blue-100 text-blue-600">
          <TabsTrigger value="classes"    className="data-[state=active]:bg-white data-[state=active]:text-blue-900">Classes</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-white data-[state=active]:text-blue-900">All assignments</TabsTrigger>
        </TabsList>

        {/* ── CLASSES TAB ── */}
        <TabsContent value="classes" className="mt-4 space-y-3">
          <div className="flex gap-3">
            <Input
              placeholder="Search by name or grade level..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-blue-200 bg-white text-blue-900 placeholder-blue-300 focus-visible:ring-blue-400"
            />
            <Select value={yearFilter} onValueChange={(val) => setYearFilter(val ?? 'all')}>
              <SelectTrigger className="w-48 border-blue-200 bg-white text-blue-700">
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

          <Card className="border-blue-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50 hover:bg-blue-50">
                  <TableHead className="text-blue-500 font-medium text-xs">Class name</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Grade level</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Academic year</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Assignments</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-blue-300 text-sm">
                      No classes found.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(cls => (
                  <TableRow key={cls.id} className="border-blue-50 hover:bg-blue-50/50">
                    <TableCell className="font-medium text-blue-900">{cls.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                        {cls.grade_level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-blue-500 text-sm">{cls.academic_year}</TableCell>
                    <TableCell className="text-blue-700 text-sm">
                      {assignmentsForClass(cls.id).length}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-800 hover:bg-blue-50 h-7 px-2 text-xs"
                          onClick={() => openAssign(cls)}
                        >
                          Assign teacher
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:text-blue-800 hover:bg-blue-50 h-7 px-2 text-xs"
                          onClick={() => {
                            setClassForm({ name: cls.name, grade_level: cls.grade_level, academic_year: cls.academic_year })
                            setApiError("")
                            setEditTarget(cls)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                          onClick={() => setDeleteTarget(cls)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── ASSIGNMENTS TAB ── */}
        <TabsContent value="assignments" className="mt-4">
          <Card className="border-blue-100 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50 hover:bg-blue-50">
                  <TableHead className="text-blue-500 font-medium text-xs">Class</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Teacher</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Subject</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Assigned on</TableHead>
                  <TableHead className="text-blue-500 font-medium text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-blue-300 text-sm">
                      No assignments yet.
                    </TableCell>
                  </TableRow>
                )}
                {assignments.map(a => (
                  <TableRow key={a.id} className="border-blue-50 hover:bg-blue-50/50">
                    <TableCell className="font-medium text-blue-900">{a.class_name}</TableCell>
                    <TableCell className="text-blue-700 text-sm">{a.teacher_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                        {a.subject_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-blue-400 text-xs">
                      {new Date(a.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                        onClick={() => setRemoveAssignTarget(a)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── ADD CLASS DIALOG ── */}
      <Dialog open={addOpen} onOpenChange={open => { setAddOpen(open); if (!open) setApiError("") }}>
        <DialogContent className="border-blue-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Create new class</DialogTitle>
          </DialogHeader>
          {apiError && <p className="text-xs text-red-500 -mt-2">{apiError}</p>}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-blue-500 font-medium">Class name</Label>
              <Input
                className="mt-1 border-blue-200 focus-visible:ring-blue-400 text-blue-900"
                placeholder="e.g. S4A"
                value={classForm.name}
                onChange={e => classField("name", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-blue-500 font-medium">Grade level</Label>
              <Select value={classForm.grade_level} onValueChange={v => classField("grade_level", v ?? "")}>
                <SelectTrigger className="mt-1 border-blue-200 text-blue-900">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-blue-500 font-medium">Academic year</Label>
              <Input
                className="mt-1 border-blue-200 focus-visible:ring-blue-400 text-blue-900"
                placeholder="e.g. 2025-2026"
                value={classForm.academic_year}
                onChange={e => classField("academic_year", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="border-blue-200 text-blue-500" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#1558a8] hover:bg-[#0c447c] text-white" onClick={handleAddClass} disabled={saving}>
              {saving ? "Creating..." : "Create class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT CLASS DIALOG ── */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); setApiError("") }}>
        <DialogContent className="border-blue-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Edit class</DialogTitle>
          </DialogHeader>
          {apiError && <p className="text-xs text-red-500 -mt-2">{apiError}</p>}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-blue-500 font-medium">Class name</Label>
              <Input
                className="mt-1 border-blue-200 focus-visible:ring-blue-400 text-blue-900"
                value={classForm.name}
                onChange={e => classField("name", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-blue-500 font-medium">Grade level</Label>
              <Select value={classForm.grade_level} onValueChange={v => classField("grade_level", v ?? "")}>
                <SelectTrigger className="mt-1 border-blue-200 text-blue-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-blue-500 font-medium">Academic year</Label>
              <Input
                className="mt-1 border-blue-200 focus-visible:ring-blue-400 text-blue-900"
                value={classForm.academic_year}
                onChange={e => classField("academic_year", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="border-blue-200 text-blue-500" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button className="bg-[#1558a8] hover:bg-[#0c447c] text-white" onClick={handleEditClass} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN TEACHER DIALOG ── */}
      <Dialog open={assignOpen} onOpenChange={open => { setAssignOpen(open); if (!open) setApiError("") }}>
        <DialogContent className="border-blue-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-900">
              Assign teacher — {selectedClassForAssign?.name}
            </DialogTitle>
          </DialogHeader>
          {apiError && <p className="text-xs text-red-500 -mt-2">{apiError}</p>}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-blue-500 font-medium">Teacher ID</Label>
              <Input
                className="mt-1 border-blue-200 focus-visible:ring-blue-400 text-blue-900"
                placeholder="Paste teacher UUID"
                value={assignForm.teacher_id}
                onChange={e => setAssignForm(f => ({ ...f, teacher_id: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-blue-500 font-medium">Subject ID</Label>
              <Input
                className="mt-1 border-blue-200 focus-visible:ring-blue-400 text-blue-900"
                placeholder="Paste subject UUID"
                value={assignForm.subject_id}
                onChange={e => setAssignForm(f => ({ ...f, subject_id: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" className="border-blue-200 text-blue-500" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#1558a8] hover:bg-[#0c447c] text-white" onClick={handleAssign} disabled={saving}>
              {saving ? "Assigning..." : "Assign teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="border-blue-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-900">Delete class?</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-400">
              This will permanently delete <span className="font-medium text-blue-700">{deleteTarget?.name}</span>. This action cannot be undone. Classes with active students cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-blue-200 text-blue-500">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteClass}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete class"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── REMOVE ASSIGNMENT CONFIRMATION ── */}
      <AlertDialog open={!!removeAssignTarget} onOpenChange={open => { if (!open) setRemoveAssignTarget(null) }}>
        <AlertDialogContent className="border-blue-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-900">Remove assignment?</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-400">
              Remove <span className="font-medium text-blue-700">{removeAssignTarget?.teacher_name}</span> from teaching{" "}
              <span className="font-medium text-blue-700">{removeAssignTarget?.subject_name}</span> in{" "}
              <span className="font-medium text-blue-700">{removeAssignTarget?.class_name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-blue-200 text-blue-500">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRemoveAssignment}
              disabled={saving}
            >
              {saving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}