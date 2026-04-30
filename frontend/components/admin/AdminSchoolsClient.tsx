"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Badge }    from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

import { schoolSchema, type SchoolValues } from "@/lib/validation/admin"
import type { School, Director } from "@/types/admin"

const T = {
  page:    "min-h-screen bg-[#060b12] p-7 space-y-5",
  heading: "text-white",
  muted:   "text-[#2d4a6a]",
  soft:    "text-[#4a6e94]",
  card:    "bg-[#080f18] border border-[#0f1e2e] rounded-2xl",
  input:   "bg-[#080f18] border-[#1e3448] text-white placeholder:text-[#1e3448] focus-visible:ring-[#7c3aed] focus-visible:ring-1 focus-visible:border-[#7c3aed] h-9 text-[13px] rounded-lg",
  label:   "block text-[11px] font-semibold text-[#4a6e94] uppercase tracking-wider mb-1.5",
  error:   "text-[11px] text-rose-400 mt-1",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

type Props = { schools: School[]; directors: Director[] }

export function AdminSchoolsClient({ schools: initial, directors }: Props) {
  const [schools, setSchools]         = useState<School[]>(initial)
  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all")
  const [addOpen, setAddOpen]         = useState(false)
  const [editTarget, setEditTarget]   = useState<School | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<School | null>(null)
  const [saving, setSaving]           = useState(false)

  const addForm = useForm<SchoolValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: { name: "", is_active: true },
  })
  const editForm = useForm<SchoolValues>({
    resolver: zodResolver(schoolSchema),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return schools.filter(s => {
      const matchQ = !q || s.name.toLowerCase().includes(q)
      const matchS = statusFilter === "all" ||
        (statusFilter === "active" ? s.is_active : !s.is_active)
      return matchQ && matchS
    })
  }, [schools, search, statusFilter])

  function directorFor(id: string) {
    return directors.find(d => d.school_id === id)
  }

  async function handleAdd(values: SchoolValues) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail ?? "Failed"); return }
      setSchools(prev => [data, ...prev])
      setAddOpen(false)
      addForm.reset()
      toast.success(`${data.name} created`)
    } finally { setSaving(false) }
  }

  async function handleEdit(values: SchoolValues) {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/schools/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail ?? "Failed"); return }
      setSchools(prev => prev.map(s => s.id === data.id ? data : s))
      setEditTarget(null)
      toast.success("School updated")
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/schools/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.status === 204) {
        setSchools(prev => prev.filter(s => s.id !== deleteTarget.id))
        setDeleteTarget(null)
        toast.success("School deleted")
        return
      }
      const data = await res.json()
      toast.error(data.detail ?? "Cannot delete school")
      setDeleteTarget(null)
    } finally { setSaving(false) }
  }

  async function toggleActive(school: School) {
    const res = await fetch(`/api/admin/schools/${school.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !school.is_active }),
    })
    if (res.ok) {
      const data = await res.json()
      setSchools(prev => prev.map(s => s.id === data.id ? data : s))
      toast.success(`${data.name} ${data.is_active ? "activated" : "deactivated"}`)
    }
  }

  return (
    <div className={T.page}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Schools</h1>
          <p className={`text-[13px] ${T.soft} mt-0.5`}>
            {schools.length} school{schools.length !== 1 ? "s" : ""} on platform ·{" "}
            {schools.filter(s => s.is_active).length} active
          </p>
        </div>
        <Button
          onClick={() => { addForm.reset({ name: "", is_active: true }); setAddOpen(true) }}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-[13px] h-9 px-4 rounded-xl shadow-none"
        >
          + New school
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <Input
          placeholder="Search schools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`flex-1 ${T.input}`}
        />
        {(["all","active","inactive"] as const).map(f => (
          <button key={f}
            onClick={() => setStatusFilter(f)}
            className={`text-[12px] font-semibold px-3 py-1.5 rounded-xl capitalize
                        transition-all border
              ${statusFilter === f
                ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                : "text-[#2d4a6a] border-[#0f1e2e] hover:text-[#4a6e94]"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`${T.card} overflow-hidden`}>
        <Table>
          <TableHeader>
            <TableRow className="bg-[#060b12] hover:bg-[#060b12] border-b border-[#0f1e2e]">
              {["School", "Director", "Created", "Status", ""].map(h => (
                <TableHead key={h}
                  className="text-[11px] font-semibold text-[#2d4a6a] uppercase tracking-wider py-3">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}
                  className="text-center py-14 text-[#2d4a6a] text-[13px]">
                  No schools found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(school => {
              const dir = directorFor(school.id)
              return (
                <TableRow key={school.id}
                  className="border-b border-[#0a1520] hover:bg-[#0a1520] transition-colors">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center
                                   text-[11px] font-bold text-white shrink-0"
                        style={{
                          background: school.is_active
                            ? "linear-gradient(135deg,#7c3aed,#6366f1)"
                            : "#1e3448",
                        }}
                      >
                        {initials(school.name)}
                      </div>
                      <p className="text-[13px] font-semibold text-white">{school.name}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {dir ? (
                      <div>
                        <p className="text-[13px] text-white">{dir.name}</p>
                        <p className="text-[11px] text-[#2d4a6a]">{dir.email}</p>
                      </div>
                    ) : (
                      <span className="text-[12px] text-amber-500/60 italic">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-[12px] text-[#2d4a6a]">
                    {new Date(school.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline"
                      className={school.is_active
                        ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10 text-[10px]"
                        : "border-rose-400/30 text-rose-400 bg-rose-400/10 text-[10px]"
                      }>
                      {school.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"
                        onClick={() => {
                          editForm.reset({ name: school.name, is_active: school.is_active })
                          setEditTarget(school)
                        }}
                        className="h-7 px-3 text-[12px] text-[#4a6e94] hover:text-white
                                   hover:bg-[#0f1e2e] rounded-lg">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => toggleActive(school)}
                        className={`h-7 px-3 text-[12px] rounded-lg
                          ${school.is_active
                            ? "text-amber-400/70 hover:text-amber-400 hover:bg-amber-400/10"
                            : "text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/10"
                          }`}>
                        {school.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => setDeleteTarget(school)}
                        className="h-7 px-3 text-[12px] text-rose-400/50
                                   hover:text-rose-400 hover:bg-rose-400/10 rounded-lg">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* ADD DIALOG */}
      <Dialog open={addOpen}
        onOpenChange={open => { setAddOpen(open); if (!open) addForm.reset() }}>
        <DialogContent className="bg-[#080f18] border-[#1e3448] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-white">
              Create new school
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-4">
            <div>
              <label className={T.label}>School name</label>
              <Input {...addForm.register("name")} className={T.input}
                placeholder="e.g. Kigali Excellence Academy" />
              {addForm.formState.errors.name && (
                <p className={T.error}>{addForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active"
                {...addForm.register("is_active")}
                className="w-4 h-4 accent-[#7c3aed]" />
              <label htmlFor="is_active"
                className="text-[13px] text-[#4a6e94] cursor-pointer">
                Activate immediately
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline"
                onClick={() => setAddOpen(false)}
                className="border-[#1e3448] text-[#4a6e94] hover:bg-[#0f1e2e]
                           text-[13px] h-9">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                           text-[13px] h-9 disabled:opacity-40">
                {saving ? "Creating..." : "Create school"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editTarget}
        onOpenChange={open => { if (!open) setEditTarget(null) }}>
        <DialogContent className="bg-[#080f18] border-[#1e3448] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-white">
              Edit school
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
            <div>
              <label className={T.label}>School name</label>
              <Input {...editForm.register("name")} className={T.input} />
              {editForm.formState.errors.name && (
                <p className={T.error}>{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="edit_is_active"
                {...editForm.register("is_active")}
                className="w-4 h-4 accent-[#7c3aed]" />
              <label htmlFor="edit_is_active"
                className="text-[13px] text-[#4a6e94] cursor-pointer">
                Active
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline"
                onClick={() => setEditTarget(null)}
                className="border-[#1e3448] text-[#4a6e94] hover:bg-[#0f1e2e]
                           text-[13px] h-9">
                Cancel
              </Button>
              <Button type="submit"
                disabled={saving || !editForm.formState.isDirty}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                           text-[13px] h-9 disabled:opacity-40">
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <AlertDialog open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className="bg-[#080f18] border-[#1e3448] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete school?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#4a6e94] text-[13px]">
              Permanently delete{" "}
              <span className="font-semibold text-white">{deleteTarget?.name}</span>.
              This will fail if active teachers still belong to this school —
              deactivate the school instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-[#1e3448] text-[#4a6e94] hover:bg-[#0f1e2e]
                         bg-transparent text-[13px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[13px]">
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}