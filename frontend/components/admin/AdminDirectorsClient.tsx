"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Badge }    from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
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

import {
  directorSchema,
  directorUpdateSchema,
  type DirectorValues,
  type DirectorUpdateValues,
} from "@/lib/validation/admin"
import type { Director, School } from "@/types/admin"

const T = {
  page:  "min-h-screen bg-[#060b12] p-7 space-y-5",
  soft:  "text-[#4a6e94]",
  muted: "text-[#2d4a6a]",
  card:  "bg-[#080f18] border border-[#0f1e2e] rounded-2xl",
  input: "bg-[#080f18] border-[#1e3448] text-white placeholder:text-[#1e3448] focus-visible:ring-[#7c3aed] focus-visible:ring-1 focus-visible:border-[#7c3aed] h-9 text-[13px] rounded-lg",
  label: "block text-[11px] font-semibold text-[#4a6e94] uppercase tracking-wider mb-1.5",
  error: "text-[11px] text-rose-400 mt-1",
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

type Props = { directors: Director[]; schools: School[] }

export function AdminDirectorsClient({ directors: initial, schools }: Props) {
  const [directors, setDirectors]   = useState<Director[]>(initial)
  const [search, setSearch]         = useState("")
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"inactive">("all")
  const [addOpen, setAddOpen]       = useState(false)
  const [editTarget, setEditTarget] = useState<Director | null>(null)
  const [deactTarget, setDeactTarget] = useState<Director | null>(null)
  const [saving, setSaving]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const addForm = useForm<DirectorValues>({
    resolver: zodResolver(directorSchema),
    defaultValues: { name: "", email: "", password: "", school_id: null },
  })

  const editForm = useForm<DirectorUpdateValues>({
    resolver: zodResolver(directorUpdateSchema),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return directors.filter(d => {
      const matchQ = !q || d.name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q)
      const matchS = statusFilter === "all" ||
        (statusFilter === "active" ? d.is_active : !d.is_active)
      return matchQ && matchS
    })
  }, [directors, search, statusFilter])

  function schoolName(id: string | null) {
    if (!id) return null
    return schools.find(s => s.id === id)?.name ?? null
  }

  async function handleAdd(values: DirectorValues) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/directors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          school_id: values.school_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail ?? "Failed"); return }
      setDirectors(prev => [data, ...prev])
      setAddOpen(false)
      addForm.reset()
      toast.success(`${data.name} created`)
    } finally { setSaving(false) }
  }

  async function handleEdit(values: DirectorUpdateValues) {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/directors/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          school_id: values.school_id ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail ?? "Failed"); return }
      setDirectors(prev => prev.map(d => d.id === data.id ? data : d))
      setEditTarget(null)
      toast.success("Director updated")
    } finally { setSaving(false) }
  }

  async function handleDeactivate() {
    if (!deactTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/directors/${deactTarget.id}`, {
        method: "DELETE",
      })
      if (res.status === 204) {
        setDirectors(prev =>
          prev.map(d => d.id === deactTarget.id ? { ...d, is_active: false } : d)
        )
        setDeactTarget(null)
        toast.success("Director deactivated")
        return
      }
      toast.error("Failed to deactivate")
    } finally { setSaving(false) }
  }

  return (
    <div className={T.page}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white tracking-tight">Directors</h1>
          <p className={`text-[13px] ${T.soft} mt-0.5`}>
            {directors.length} director{directors.length !== 1 ? "s" : ""} ·{" "}
            {directors.filter(d => !d.school_id).length} unassigned
          </p>
        </div>
        <Button
          onClick={() => { addForm.reset(); setAddOpen(true) }}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                     text-[13px] h-9 px-4 rounded-xl shadow-none"
        >
          + New director
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name or email..."
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
              {["Director", "Email", "School", "Status", ""].map(h => (
                <TableHead key={h}
                  className="text-[11px] font-semibold text-[#2d4a6a]
                             uppercase tracking-wider py-3">
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
                  No directors found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(d => (
              <TableRow key={d.id}
                className="border-b border-[#0a1520] hover:bg-[#0a1520] transition-colors">
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center
                                 text-[11px] font-bold text-white shrink-0"
                      style={{
                        background: d.is_active
                          ? "linear-gradient(135deg,#0891b2,#7c3aed)"
                          : "#1e3448",
                      }}
                    >
                      {initials(d.name)}
                    </div>
                    <p className="text-[13px] font-semibold text-white">{d.name}</p>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-[12px] text-[#4a6e94]">
                  {d.email}
                </TableCell>
                <TableCell className="py-3">
                  {schoolName(d.school_id) ? (
                    <span className="text-[12px] font-medium text-[#a78bfa]">
                      {schoolName(d.school_id)}
                    </span>
                  ) : (
                    <span className="text-[12px] text-amber-500/60 italic">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline"
                    className={d.is_active
                      ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/10 text-[10px]"
                      : "border-rose-400/30 text-rose-400 bg-rose-400/10 text-[10px]"
                    }>
                    {d.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm"
                      onClick={() => {
                        editForm.reset({
                          name:      d.name,
                          email:     d.email,
                          school_id: d.school_id ?? undefined,
                          is_active: d.is_active,
                        })
                        setEditTarget(d)
                      }}
                      className="h-7 px-3 text-[12px] text-[#4a6e94]
                                 hover:text-white hover:bg-[#0f1e2e] rounded-lg">
                      Edit
                    </Button>
                    {d.is_active && (
                      <Button variant="ghost" size="sm"
                        onClick={() => setDeactTarget(d)}
                        className="h-7 px-3 text-[12px] text-rose-400/50
                                   hover:text-rose-400 hover:bg-rose-400/10 rounded-lg">
                        Deactivate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ADD DIALOG */}
      <Dialog open={addOpen}
        onOpenChange={open => { setAddOpen(open); if (!open) addForm.reset() }}>
        <DialogContent className="bg-[#080f18] border-[#1e3448] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold text-white">
              Create director
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={addForm.handleSubmit(handleAdd)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.label}>Full name</label>
                <Input {...addForm.register("name")} className={T.input}
                  placeholder="e.g. Jean-Marie Habimana" />
                {addForm.formState.errors.name && (
                  <p className={T.error}>{addForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className={T.label}>Email</label>
                <Input {...addForm.register("email")} className={T.input}
                  placeholder="director@school.rw" />
                {addForm.formState.errors.email && (
                  <p className={T.error}>{addForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className={T.label}>Password</label>
              <div className="relative">
                <Input
                  {...addForm.register("password")}
                  type={showPassword ? "text" : "password"}
                  className={T.input}
                  placeholder="Min 8 characters"
                />
                <button type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-[#2d4a6a] hover:text-[#4a6e94]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              {addForm.formState.errors.password && (
                <p className={T.error}>{addForm.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <label className={T.label}>Assign to school (optional)</label>
              <Controller
                control={addForm.control}
                name="school_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={v => field.onChange(v === "none" ? null : v)}
                  >
                    <SelectTrigger className="bg-[#080f18] border-[#1e3448] text-white
                                             h-9 text-[13px] rounded-lg w-full">
                      <SelectValue placeholder="No school assigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#080f18] border-[#1e3448]">
                      <SelectItem value="none"
                        className="text-[#4a6e94] text-[13px]">
                        No school assigned
                      </SelectItem>
                      {schools.map(s => (
                        <SelectItem key={s.id} value={s.id}
                          className="text-white text-[13px]">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline"
                onClick={() => setAddOpen(false)}
                className="border-[#1e3448] text-[#4a6e94] hover:bg-[#0f1e2e]
                           text-[13px] h-9 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={saving}
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                           text-[13px] h-9 disabled:opacity-40">
                {saving ? "Creating..." : "Create director"}
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
              Edit director
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={T.label}>Full name</label>
                <Input {...editForm.register("name")} className={T.input} />
                {editForm.formState.errors.name && (
                  <p className={T.error}>{editForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className={T.label}>Email</label>
                <Input {...editForm.register("email")} className={T.input} />
                {editForm.formState.errors.email && (
                  <p className={T.error}>{editForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>
            <div>
              <label className={T.label}>Assign to school</label>
              <Controller
                control={editForm.control}
                name="school_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={v => field.onChange(v === "none" ? null : v)}
                  >
                    <SelectTrigger className="bg-[#080f18] border-[#1e3448] text-white
                                             h-9 text-[13px] rounded-lg w-full">
                      <SelectValue placeholder="No school assigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#080f18] border-[#1e3448]">
                      <SelectItem value="none"
                        className="text-[#4a6e94] text-[13px]">
                        No school assigned
                      </SelectItem>
                      {schools.map(s => (
                        <SelectItem key={s.id} value={s.id}
                          className="text-white text-[13px]">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="edit_active"
                {...editForm.register("is_active")}
                className="w-4 h-4 accent-[#7c3aed]" />
              <label htmlFor="edit_active"
                className="text-[13px] text-[#4a6e94] cursor-pointer">
                Account active
              </label>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline"
                onClick={() => setEditTarget(null)}
                className="border-[#1e3448] text-[#4a6e94] hover:bg-[#0f1e2e]
                           text-[13px] h-9 bg-transparent">
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

      {/* DEACTIVATE CONFIRM */}
      <AlertDialog open={!!deactTarget}
        onOpenChange={open => { if (!open) setDeactTarget(null) }}>
        <AlertDialogContent className="bg-[#080f18] border-[#1e3448] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Deactivate director?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#4a6e94] text-[13px]">
              <span className="font-semibold text-white">{deactTarget?.name}</span>{" "}
              will lose access immediately. Their school and data are preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-[#1e3448] text-[#4a6e94] hover:bg-[#0f1e2e]
                         bg-transparent text-[13px]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={saving}
              className="bg-rose-600 hover:bg-rose-700 text-white text-[13px]">
              {saving ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}