"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"

import {
  passwordChangeSchema,
  type PasswordChangeValues,
} from "@/lib/validation/profile"

type Me = {
  id:    string
  name:  string
  email: string
}

function initials(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// ── field wrapper
function Field({
  label,
  error,
  children,
}: {
  label:    string
  error?:   string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-[#6b7280]
                        uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export function TeacherProfileClient({ me }: { me: Me }) {
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const [saving, setSaving]             = useState(false)
  const [success, setSuccess]           = useState(false)

  const inputCls = `
    border-[#e5e7eb] text-[#111827] placeholder:text-[#d1d5db]
    focus-visible:ring-[#0d9488] focus-visible:ring-1
    focus-visible:border-[#0d9488] h-10 text-[13px] rounded-lg bg-white
  `

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: "onChange",
  })

  async function onSubmit(values: PasswordChangeValues) {
    setSaving(true)
    setSuccess(false)
    try {
      const res = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: values.current_password,
          new_password:     values.new_password,
        }),
      })

      if (res.status === 204) {
        setSuccess(true)
        reset()
        toast.success("Password updated successfully")
        return
      }

      const data = await res.json()
      toast.error(data.detail ?? "Failed to update password")
    } finally {
      setSaving(false)
    }
  }

  // ── password strength indicator
  function usePasswordStrength(watch: ReturnType<typeof useForm>["watch"]) {
    return null // placeholder for the component below
  }

  function PasswordStrength({ value }: { value: string }) {
    if (!value) return null
    const checks = [
      value.length >= 8,
      /[A-Z]/.test(value),
      /[0-9]/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ]
    const score  = checks.filter(Boolean).length
    const labels = ["Weak", "Fair", "Good", "Strong"]
    const colors = [
      "bg-rose-400",
      "bg-amber-400",
      "bg-yellow-400",
      "bg-emerald-400",
    ]

    return (
      <div className="mt-2 space-y-1.5">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300
                ${i < score ? colors[score - 1] : "bg-[#e5e7eb]"}`}
            />
          ))}
        </div>
        <p className="text-[11px] text-[#6b7280]">
          Strength: <span className="font-medium">{labels[score - 1] ?? "Too short"}</span>
        </p>
      </div>
    )
  }

  const newPasswordValue = useForm<PasswordChangeValues>().watch?.("new_password") ?? ""

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Page heading */}
        <div>
          <h1 className="text-[18px] font-semibold text-[#0f2027] tracking-tight">
            My profile
          </h1>
          <p className="text-[13px] text-[#78716c] mt-0.5">
            View your account details and manage your password
          </p>
        </div>

        {/* ── Identity card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2e3a 100%)" }}
        >
          {/* top decorative strip */}
          <div className="h-1 w-full bg-linear-to-r from-[#0d9488] via-[#38bdf8] to-[#7c3aed]" />

          <div className="px-7 py-7 flex items-center gap-6">
            {/* Monogram */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center
                           text-[28px] font-bold text-white select-none"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #0891b2)",
                  boxShadow: "0 8px 24px rgba(13,148,136,0.4)",
                }}
              >
                {initials(me.name)}
              </div>
              {/* online dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full
                              bg-emerald-400 border-2 border-[#0f1923]" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-bold text-white tracking-tight truncate">
                {me.name}
              </h2>
              <p className="text-[13px] text-[#94a3b8] mt-0.5 truncate">{me.email}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full
                                 bg-[#0d9488]/20 text-[#5eead4] border border-[#0d9488]/30">
                  Teacher
                </span>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full
                                 bg-white/10 text-[#94a3b8] border border-white/10">
                  Active
                </span>
              </div>
            </div>

            {/* ID decorative element */}
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
              <p className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">
                Staff ID
              </p>
              <p className="text-[12px] font-mono text-[#64748b] tracking-wider">
                {me.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Info grid */}
          <div className="border-t border-white/5 px-7 py-4 grid grid-cols-2 gap-4">
            {[
              { label: "Full name", value: me.name  },
              { label: "Email",     value: me.email },
            ].map(r => (
              <div key={r.label}>
                <p className="text-[10px] font-semibold text-[#475569]
                              uppercase tracking-widest mb-0.5">
                  {r.label}
                </p>
                <p className="text-[13px] text-[#cbd5e1] font-medium truncate">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Password change card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111827]">
                Change password
              </h2>
              <p className="text-[12px] text-[#6b7280] mt-0.5">
                Use a strong password with uppercase letters and numbers
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#f0fdfa] flex items-center
                           justify-center shrink-0">
              <svg className="w-4 h-4 text-[#0d9488]" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>

          {/* Success banner */}
          {success && (
            <div className="mb-4 flex items-center gap-2.5 px-4 py-3 rounded-xl
                           bg-emerald-50 border border-emerald-200">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20"
                fill="currentColor">
                <path fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd" />
              </svg>
              <p className="text-[13px] font-medium text-emerald-700">
                Password updated successfully
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Current password */}
            <Field label="Current password" error={errors.current_password?.message}>
              <div className="relative">
                <Input
                  {...register("current_password")}
                  type={showCurrent ? "text" : "password"}
                  className={inputCls}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-[#9ca3af] hover:text-[#374151] transition-colors"
                >
                  {showCurrent ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            {/* Divider */}
            <div className="border-t border-[#f3f4f6]" />

            {/* New password */}
            <Field label="New password" error={errors.new_password?.message}>
              <div className="relative">
                <Input
                  {...register("new_password")}
                  type={showNew ? "text" : "password"}
                  className={inputCls}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-[#9ca3af] hover:text-[#374151] transition-colors"
                >
                  {showNew ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* strength meter rendered inside the Field via a separate component */}
            </Field>

            {/* Confirm password */}
            <Field label="Confirm new password" error={errors.confirm_password?.message}>
              <div className="relative">
                <Input
                  {...register("confirm_password")}
                  type={showConfirm ? "text" : "password"}
                  className={inputCls}
                  placeholder="Repeat your new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-[#9ca3af] hover:text-[#374151] transition-colors"
                >
                  {showConfirm ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            {/* Password requirements hint */}
            <div className="rounded-xl bg-[#f9fafb] border border-[#f3f4f6] px-4 py-3">
              <p className="text-[11px] font-semibold text-[#6b7280] uppercase
                            tracking-wider mb-2">
                Requirements
              </p>
              <ul className="space-y-1">
                {[
                  { label: "At least 8 characters",          test: (v: string) => v.length >= 8 },
                  { label: "One uppercase letter (A–Z)",      test: (v: string) => /[A-Z]/.test(v) },
                  { label: "One number (0–9)",                test: (v: string) => /[0-9]/.test(v) },
                  { label: "Different from current password", test: () => true },
                ].map(r => {
                  return (
                    <li key={r.label} className="flex items-center gap-2 text-[12px]">
                      <svg className="w-3.5 h-3.5 text-[#d1d5db] shrink-0"
                        viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd" />
                      </svg>
                      <span className="text-[#6b7280]">{r.label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { reset(); setSuccess(false) }}
                disabled={!isDirty}
                className="text-[#6b7280] hover:text-[#374151] text-[13px] h-9
                           disabled:opacity-30"
              >
                Clear form
              </Button>
              <Button
                type="submit"
                disabled={saving || !isDirty || !isValid}
                className="bg-[#0d9488] hover:bg-[#0f766e] text-white text-[13px]
                           h-9 px-6 rounded-lg shadow-none disabled:opacity-40
                           min-w-35"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Updating...
                  </span>
                ) : "Update password"}
              </Button>
            </div>
          </form>
        </div>

        {/* ── Sign out card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5
                       flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-[#111827]">Sign out</p>
            <p className="text-[12px] text-[#6b7280] mt-0.5">
              You will be redirected to the login page
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" })
              window.location.href = "/auth/login"
            }}
            className="border-[#e5e7eb] text-[#374151] hover:bg-[#fafaf9]
                       hover:border-rose-200 hover:text-rose-600
                       text-[13px] h-9 transition-colors"
          >
            Sign out
          </Button>
        </div>

      </div>
    </div>
  )
}