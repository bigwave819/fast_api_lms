"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "../ui/button"

type Teacher = {
  id: string
  name: string
  email: string
  subject_specialty: string | null
  is_active: boolean
  created_at: string
}

type Props = { initial: Teacher[]; schoolId: string }

export function TeachersClient({ initial, schoolId }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>(initial)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">("")
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Teacher | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "", subject_specialty: "" })
  const [error, setError] = useState("")
  const router = useRouter()

  const filtered = useMemo(() =>
    teachers.filter(t => {
      const q = search.toLowerCase()
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
      const matchS = !statusFilter || (statusFilter === "active" ? t.is_active : !t.is_active)
      return matchQ && matchS
    }), [teachers, search, statusFilter])

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.is_active).length,
    inactive: teachers.filter(t => !t.is_active).length,
  }

  async function handleAdd() {
    setError("")
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId, ...form }),
    })
    if (!res.ok) {
      const e = await res.json()
      setError(e.detail ?? "Failed to add teacher")
      return
    }
    const created: Teacher = await res.json()
    setTeachers(prev => [...prev, created])
    setAddOpen(false)
    setForm({ name: "", email: "", password: "", subject_specialty: "" })
  }

  async function handleEdit() {
    if (!editTarget) return
    setError("")
    const res = await fetch(`/api/teachers/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId, name: form.name, email: form.email, subject_specialty: form.subject_specialty }),
    })
    if (!res.ok) { setError("Failed to update"); return }
    const updated: Teacher = await res.json()
    setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditTarget(null)
  }

  async function handleDeactivate(id: string) {
    await fetch(`/api/teachers/${id}`, { method: "DELETE" })
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, is_active: false } : t))
    setEditTarget(null)
  }

  function initials(name: string) {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen p-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total teachers", val: stats.total },
          { label: "Active", val: stats.active },
          { label: "Inactive", val: stats.inactive },
        ].map(s => (
          <div key={s.label} className="bg-white border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-400">{s.label}</p>
            <p className="text-2xl font-medium text-blue-900 mt-1">{s.val}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 px-3 py-2 border border-blue-200 rounded-lg text-sm text-blue-900 bg-white placeholder-blue-300 outline-none focus:border-blue-500"
          placeholder="Search by name, email or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-blue-200 rounded-lg text-sm text-blue-700 bg-white outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as "")}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button
          className="bg-[#1558a8]"
          onClick={() => { setForm({ name: "", email: "", password: "", subject_specialty: "" }); setAddOpen(true) }}
        >
          + Add teacher
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white border border-blue-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-blue-500 text-xs font-medium">
            <tr>
              <th className="text-left px-4 py-3">Teacher</th>
              <th className="text-left px-4 py-3">Specialty</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-t border-blue-50 hover:bg-blue-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600">
                      {initials(t.name)}
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{t.name}</p>
                      <p className="text-xs text-blue-300">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-blue-500 text-xs">{t.subject_specialty ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    className="text-xs text-blue-500 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                    onClick={() => { setEditTarget(t); setForm({ name: t.name, email: t.email, password: "", subject_specialty: t.subject_specialty ?? "" }) }}
                  >
                    Edit
                  </button>
                  {t.is_active
                    ? <button className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50" onClick={() => handleDeactivate(t.id)}>Deactivate</button>
                    : <button className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50" onClick={() => fetch(`/api/teachers/${t.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolId, is_active: true }) }).then(() => setTeachers(prev => prev.map(x => x.id === t.id ? { ...x, is_active: true } : x)))}>Activate</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-10 text-blue-300 text-sm">No teachers found.</p>}
      </div>

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 bg-blue-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-blue-100 p-6 w-full max-w-md">
            <h2 className="text-base font-medium text-blue-900 mb-4">Add new teacher</h2>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Full name</label><input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Email</label><input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Password</label><input type="password" className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Subject specialty</label><input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.subject_specialty} onChange={e => setForm(f => ({ ...f, subject_specialty: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 text-sm text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-[#1558a8] rounded-lg" onClick={handleAdd}>Add teacher</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-blue-900/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-blue-100 p-6 w-full max-w-md">
            <h2 className="text-base font-medium text-blue-900 mb-4">Edit teacher</h2>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <div className="space-y-3 mb-3">
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Full name</label><input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Email</label><input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><label className="text-xs text-blue-500 font-medium block mb-1">Subject specialty</label><input className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500" value={form.subject_specialty} onChange={e => setForm(f => ({ ...f, subject_specialty: e.target.value }))} /></div>
            </div>
            <div className="flex justify-between mt-4">
              <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100" onClick={() => handleDeactivate(editTarget.id)}>Deactivate</button>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50" onClick={() => setEditTarget(null)}>Cancel</button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-[#1558a8] rounded-lg" onClick={handleEdit}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}