"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"

import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge }    from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

import type { Subject, SubjectFormData } from "@/types/subjects"
import { EMPTY_SUBJECT_FORM } from "@/types/subjects"

// Each subject gets a deterministic accent color from its code
const ACCENT_COLORS = [
  "border-l-[#1558a8]",
  "border-l-[#0f6e56]",
  "border-l-[#854f0b]",
  "border-l-[#7f77dd]",
  "border-l-[#993556]",
  "border-l-[#3b6d11]",
  "border-l-[#a32d2d]",
  "border-l-[#185fa5]",
]

function accentFor(code: string): string {
  const idx = code
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0) % ACCENT_COLORS.length
  return ACCENT_COLORS[idx]
}

type Props = {
  initial: Subject[]
  schoolId: string
}

export function SubjectsClient({ initial, schoolId }: Props) {
  const [subjects, setSubjects]       = useState<Subject[]>(initial)
  const [search, setSearch]           = useState("")
  const [addOpen, setAddOpen]         = useState(false)
  const [editTarget, setEditTarget]   = useState<Subject | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)
  const [form, setForm]               = useState<SubjectFormData>(EMPTY_SUBJECT_FORM)
  const [saving, setSaving]           = useState(false)
  const [apiError, setApiError]       = useState("")

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return !q
      ? subjects
      : subjects.filter(
          s =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            (s.description ?? "").toLowerCase().includes(q)
        )
  }, [subjects, search])

  function field(key: keyof SubjectFormData, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function openAdd() {
    setForm(EMPTY_SUBJECT_FORM)
    setApiError("")
    setAddOpen(true)
  }

  function openEdit(s: Subject) {
    setForm({ name: s.name, code: s.code, description: s.description ?? "" })
    setApiError("")
    setEditTarget(s)
  }

  // ── CREATE
  async function handleAdd() {
    if (!form.name.trim() || !form.code.trim()) {
      setApiError("Name and code are required.")
      return
    }
    setSaving(true)
    setApiError("")
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.detail ?? "Failed to create subject"); return }
      setSubjects(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setAddOpen(false)
      toast.success("Subject created")
    } finally { setSaving(false) }
  }

  // ── UPDATE
  async function handleEdit() {
    if (!editTarget) return
    if (!form.name.trim() || !form.code.trim()) {
      setApiError("Name and code are required.")
      return
    }
    setSaving(true)
    setApiError("")
    try {
      const res = await fetch(`/api/subjects/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setApiError(data.detail ?? "Failed to update subject"); return }
      setSubjects(prev =>
        prev
          .map(s => (s.id === data.id ? data : s))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditTarget(null)
      toast.success("Subject updated")
    } finally { setSaving(false) }
  }

  // ── DELETE
  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(
        `/api/subjects/${deleteTarget.id}?schoolId=${schoolId}`,
        { method: "DELETE" }
      )
      if (res.status === 204) {
        setSubjects(prev => prev.filter(s => s.id !== deleteTarget.id))
        setDeleteTarget(null)
        toast.success("Subject deleted")
        return
      }
      const data = await res.json()
      toast.error(data.detail ?? "Could not delete subject")
      setDeleteTarget(null)
    } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen p-6 space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[17px] font-semibold text-[#0c447c] tracking-tight">
            Subject management
          </h1>
          <p className="text-[13px] text-[#378add] mt-0.5">
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} offered at your school
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#1558a8] hover:bg-[#0c447c] text-white text-[13px] h-9 px-4 rounded-lg shadow-none"
        >
          + New subject
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search subjects by name or code..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-white border-[#b5d4f4] text-[#0c447c] placeholder:text-[#85b7eb]
                   focus-visible:ring-[#1558a8] focus-visible:ring-1 focus-visible:border-[#1558a8]
                   h-9 text-[13px] rounded-lg"
      />

      {/* Subject grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#85b7eb] text-[13px]">
          {search ? "No subjects match your search." : "No subjects yet. Create your first one."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <div
              key={s.id}
              className={`
                bg-white rounded-xl border border-[#b5d4f4] border-l-4
                ${accentFor(s.code)}
                p-4 flex flex-col gap-3
                hover:border-[#85b7eb] transition-colors
              `}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0c447c] leading-snug truncate">
                    {s.name}
                  </p>
                  {s.description && (
                    <p className="text-[12px] text-[#378add] mt-0.5 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  )}
                </div>
                {/* Code stamp */}
                <span
                  className="
                    shrink-0 font-mono text-[11px] font-semibold
                    bg-[#e6f1fb] text-[#185fa5]
                    px-2 py-0.5 rounded
                    tracking-widest uppercase
                    border border-[#b5d4f4]
                  "
                >
                  {s.code}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-1 border-t border-[#e6f1fb]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(s)}
                  className="
                    h-7 px-3 text-[12px] text-[#378add]
                    hover:text-[#0c447c] hover:bg-[#e6f1fb]
                    rounded-md
                  "
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(s)}
                  className="
                    h-7 px-3 text-[12px] text-[#f09595]
                    hover:text-[#a32d2d] hover:bg-[#fcebeb]
                    rounded-md
                  "
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD DIALOG ── */}
      <Dialog
        open={addOpen}
        onOpenChange={open => { setAddOpen(open); if (!open) setApiError("") }}
      >
        <DialogContent className="border-[#b5d4f4] sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-[#0c447c]">
              Create new subject
            </DialogTitle>
          </DialogHeader>

          {apiError && (
            <p className="text-[12px] text-[#a32d2d] bg-[#fcebeb] px-3 py-2 rounded-lg -mt-1">
              {apiError}
            </p>
          )}

          <SubjectForm form={form} onChange={field} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="border-[#b5d4f4] text-[#378add] hover:bg-[#e6f1fb] text-[13px] h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={saving}
              className="bg-[#1558a8] hover:bg-[#0c447c] text-white text-[13px] h-9"
            >
              {saving ? "Creating..." : "Create subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ── */}
      <Dialog
        open={!!editTarget}
        onOpenChange={open => { if (!open) { setEditTarget(null); setApiError("") } }}
      >
        <DialogContent className="border-[#b5d4f4] sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-[#0c447c]">
              Edit subject
            </DialogTitle>
          </DialogHeader>

          {apiError && (
            <p className="text-[12px] text-[#a32d2d] bg-[#fcebeb] px-3 py-2 rounded-lg -mt-1">
              {apiError}
            </p>
          )}

          <SubjectForm form={form} onChange={field} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              className="border-[#b5d4f4] text-[#378add] hover:bg-[#e6f1fb] text-[13px] h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={saving}
              className="bg-[#1558a8] hover:bg-[#0c447c] text-white text-[13px] h-9"
            >
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent className="border-[#b5d4f4] rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[15px] font-semibold text-[#0c447c]">
              Delete subject?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-[#378add]">
              Permanently delete{" "}
              <span className="font-semibold text-[#0c447c]">{deleteTarget?.name}</span>{" "}
              <span className="font-mono text-[11px] bg-[#e6f1fb] text-[#185fa5] px-1.5 py-0.5 rounded border border-[#b5d4f4]">
                {deleteTarget?.code}
              </span>
              . This will fail if any class assignments or marks still reference it — remove those first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#b5d4f4] text-[#378add] hover:bg-[#e6f1fb] text-[13px] h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-[#a32d2d] hover:bg-[#791f1f] text-white text-[13px] h-9"
            >
              {saving ? "Deleting..." : "Delete subject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Shared form fields used in both Add and Edit dialogs
function SubjectForm({
  form,
  onChange,
}: {
  form: SubjectFormData
  onChange: (key: keyof SubjectFormData, val: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[12px] font-medium text-[#185fa5] block mb-1">
            Subject name <span className="text-[#f09595]">*</span>
          </Label>
          <Input
            value={form.name}
            onChange={e => onChange("name", e.target.value)}
            placeholder="e.g. Mathematics"
            className="
              border-[#b5d4f4] text-[#0c447c] placeholder:text-[#85b7eb]
              focus-visible:ring-[#1558a8] focus-visible:ring-1
              focus-visible:border-[#1558a8] h-9 text-[13px] rounded-lg
            "
          />
        </div>
        <div>
          <Label className="text-[12px] font-medium text-[#185fa5] block mb-1">
            Subject code <span className="text-[#f09595]">*</span>
          </Label>
          <Input
            value={form.code}
            onChange={e => onChange("code", e.target.value.toUpperCase())}
            placeholder="e.g. MATH"
            maxLength={10}
            className="
              border-[#b5d4f4] text-[#0c447c] placeholder:text-[#85b7eb]
              focus-visible:ring-[#1558a8] focus-visible:ring-1
              focus-visible:border-[#1558a8] h-9 text-[13px] rounded-lg
              font-mono tracking-widest uppercase
            "
          />
        </div>
      </div>
      <div>
        <Label className="text-[12px] font-medium text-[#185fa5] block mb-1">
          Description <span className="text-[#85b7eb] font-normal">(optional)</span>
        </Label>
        <Textarea
          value={form.description}
          onChange={e => onChange("description", e.target.value)}
          placeholder="Brief description of what this subject covers..."
          rows={3}
          className="
            border-[#b5d4f4] text-[#0c447c] placeholder:text-[#85b7eb]
            focus-visible:ring-[#1558a8] focus-visible:ring-1
            focus-visible:border-[#1558a8] text-[13px] rounded-lg
            resize-none leading-relaxed
          "
        />
      </div>
    </div>
  )
}