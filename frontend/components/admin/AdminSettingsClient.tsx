"use client"

import { useState, useRef, KeyboardEvent, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button }  from "@/components/ui/button"
import { Input }   from "@/components/ui/input"

import { settingsSchema, type SettingsValues } from "@/lib/validation/settings"
import { passwordChangeSchema, type PasswordChangeValues }
  from "@/lib/validation/profile"
import type { PlatformSettings } from "@/types/settings"

// ── theme types
type Theme = "dark" | "light"

// ── theme styles
const getThemeStyles = (theme: Theme) => ({
  page: theme === "dark"
    ? "min-h-screen bg-[#070c14] p-7 space-y-6 transition-colors duration-300"
    : "min-h-screen bg-gray-50 p-7 space-y-6 transition-colors duration-300",
  section: theme === "dark"
    ? "bg-[#080f18] border border-[#0f1e2e] rounded-2xl overflow-hidden"
    : "bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm",
  heading: theme === "dark" ? "text-white" : "text-gray-900",
  muted: theme === "dark" ? "text-[#2d4a6a]" : "text-gray-400",
  soft: theme === "dark" ? "text-[#4a6e94]" : "text-gray-500",
  accent: "#7c3aed",
  input: theme === "dark"
    ? `bg-[#060b12] border-[#1e3448] text-white placeholder:text-[#1e3448]
        focus-visible:ring-[#7c3aed] focus-visible:ring-1
        focus-visible:border-[#7c3aed] h-9 text-[13px] rounded-lg`
    : `bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400
        focus-visible:ring-[#7c3aed] focus-visible:ring-1
        focus-visible:border-[#7c3aed] h-9 text-[13px] rounded-lg`,
  label: theme === "dark"
    ? "block text-[11px] font-semibold text-[#4a6e94] uppercase tracking-wider mb-1.5"
    : "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5",
  error: "text-[11px] text-rose-400 mt-1.5",
  divider: theme === "dark"
    ? "border-t border-[#0f1e2e]"
    : "border-t border-gray-200",
  tagBg: theme === "dark" ? "bg-[#060b12]" : "bg-gray-50",
  tagBorder: theme === "dark" ? "border-[#1e3448]" : "border-gray-200",
  tagFocusBorder: "focus-within:border-[#7c3aed]",
  chipBg: theme === "dark" ? "bg-[#7c3aed]/15" : "bg-purple-50",
  chipBorder: theme === "dark" ? "border-[#7c3aed]/30" : "border-purple-200",
  chipText: theme === "dark" ? "text-[#a78bfa]" : "text-purple-600",
  dangerSection: theme === "dark"
    ? "bg-[#080f18] border border-rose-400/10 rounded-2xl overflow-hidden"
    : "bg-white border border-rose-200 rounded-2xl overflow-hidden shadow-sm",
})

// ── section header
function SectionHeader({
  title,
  desc,
  icon,
  theme,
}: {
  title: string
  desc:  string
  icon:  React.ReactNode
  theme: Theme
}) {
  const styles = getThemeStyles(theme)
  
  return (
    <div className={`flex items-start gap-4 px-6 py-5 border-b ${
      theme === "dark" ? "border-[#0f1e2e]" : "border-gray-200"
    }`}>
      <div className={`w-9 h-9 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20
                      flex items-center justify-center shrink-0 text-[#a78bfa]`}>
        {icon}
      </div>
      <div>
        <p className={`text-[14px] font-bold ${
          theme === "dark" ? "text-white" : "text-gray-900"
        }`}>{title}</p>
        <p className={`text-[12px] ${
          theme === "dark" ? "text-[#4a6e94]" : "text-gray-500"
        } mt-0.5`}>{desc}</p>
      </div>
    </div>
  )
}

// ── tag editor for term names / exam types
function TagEditor({
  label,
  tags,
  onChange,
  placeholder,
  theme,
}: {
  label:       string
  tags:        string[]
  onChange:    (tags: string[]) => void
  placeholder: string
  theme:       Theme
}) {
  const [input, setInput] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  const styles = getThemeStyles(theme)

  function add() {
    const v = input.trim().toUpperCase()
    if (!v || tags.includes(v)) { setInput(""); return }
    onChange([...tags, v])
    setInput("")
  }

  function remove(tag: string) {
    onChange(tags.filter(t => t !== tag))
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); add() }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div>
      <label className={styles.label}>{label}</label>
      <div
        onClick={() => ref.current?.focus()}
        className={`min-h-10.5 flex flex-wrap gap-1.5 p-2 rounded-xl
                   ${styles.tagBg} border ${styles.tagBorder} cursor-text
                   ${styles.tagFocusBorder} transition-colors`}
      >
        {tags.map(tag => (
          <span
            key={tag}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                       ${styles.chipBg} border ${styles.chipBorder}
                       text-[11px] font-bold ${styles.chipText} uppercase tracking-wider`}
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-[#7c3aed]/60 hover:text-rose-400 transition-colors
                         leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={ref}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : ""}
          className={`flex-1 min-w-25 bg-transparent text-[12px] ${
            theme === "dark" ? "text-white placeholder:text-[#1e3448]" : "text-gray-900 placeholder:text-gray-400"
          } outline-none py-0.5 px-1`}
        />
      </div>
      <p className={`text-[10px] mt-1.5 ${
        theme === "dark" ? "text-[#2d4a6a]" : "text-gray-400"
      }`}>
        Press Enter to add · Backspace to remove last
      </p>
    </div>
  )
}

type Me = { id: string; name: string; email: string }

type Props = {
  initialSettings: PlatformSettings | null
  me:              Me | null
}

export function AdminSettingsClient({ initialSettings, me }: Props) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [settings, setSettings]       = useState<PlatformSettings | null>(initialSettings)
  const [termNames, setTermNames]     = useState<string[]>(
    initialSettings?.default_term_names ?? ["Term 1", "Term 2", "Term 3"]
  )
  const [examTypes, setExamTypes]     = useState<string[]>(
    initialSettings?.default_exam_types ?? ["CAT", "MID", "FINAL", "PRACTICAL", "ASSIGNMENT"]
  )
  const [savingConfig, setSavingConfig]   = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [showCurrent, setShowCurrent]   = useState(false)
  const [showNew, setShowNew]           = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)

  const styles = getThemeStyles(theme)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("admin-theme") as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light")
    }
  }, [])

  // Save theme to localStorage
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("admin-theme", newTheme)
  }

  // ── config form
  const configForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      platform_name:          initialSettings?.platform_name          ?? "EduPlatform",
      default_academic_year:  initialSettings?.default_academic_year  ?? "",
      default_max_score:      initialSettings?.default_max_score      ?? 100,
      support_email:          initialSettings?.support_email          ?? "",
      max_students_per_class: initialSettings?.max_students_per_class ?? undefined,
    },
    mode: "onChange",
  })

  // ── password form
  const pwForm = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    mode: "onChange",
  })

  // ── save config
  async function onSaveConfig(values: SettingsValues) {
    setSavingConfig(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          default_term_names:     termNames,
          default_exam_types:     examTypes,
          support_email:          values.support_email || null,
          max_students_per_class: values.max_students_per_class || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.detail ?? "Failed to save"); return }
      setSettings(data)
      toast.success("Settings saved")
    } finally {
      setSavingConfig(false)
    }
  }

  // ── save password
  async function onSavePassword(values: PasswordChangeValues) {
    setSavingPassword(true)
    setPasswordSuccess(false)
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
        setPasswordSuccess(true)
        pwForm.reset()
        toast.success("Password updated")
        return
      }
      const data = await res.json()
      toast.error(data.detail ?? "Failed to update password")
    } finally {
      setSavingPassword(false)
    }
  }

  // ── eye icon
  function EyeIcon({ show }: { show: boolean }) {
    return show ? (
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
    )
  }

  // Theme toggle icon
  const ThemeIcon = () => (
    theme === "dark" ? (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    )
  )

  return (
    <div className={styles.page}>
      
      {/* Page header with theme toggle */}
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest mb-1`}>
            Configuration
          </p>
          <h1 className={`text-[22px] font-bold tracking-tight ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}>
            Platform settings
          </h1>
          <p className={`text-[13px] mt-1 ${
            theme === "dark" ? "text-[#4a6e94]" : "text-gray-500"
          }`}>
            Defaults applied across all schools · changes take effect immediately
          </p>
        </div>
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
            ${theme === "dark" 
              ? "bg-[#080f18] border border-[#0f1e2e] text-[#a78bfa] hover:bg-[#0f1e2e]" 
              : "bg-white border border-gray-200 text-purple-600 hover:bg-gray-50 shadow-sm"
            }`}
          aria-label="Toggle theme"
        >
          <ThemeIcon />
        </button>
      </div>

      {/* ── IDENTITY section */}
      <div className={styles.section}>
        <SectionHeader
          title="Platform identity"
          desc="Name and contact info shown across the platform"
          theme={theme}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          }
        />

        {/* Admin profile read-only strip */}
        {me && (
          <div className={`flex items-center gap-4 px-6 py-4 border-b ${
            theme === "dark" 
              ? "border-[#0f1e2e] bg-[#060b12]/50" 
              : "border-gray-200 bg-gray-50/50"
          }`}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center
                         text-[13px] font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}
            >
              {me.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className={`text-[14px] font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>{me.name}</p>
              <p className={`text-[12px] ${
                theme === "dark" ? "text-[#4a6e94]" : "text-gray-500"
              }`}>{me.email}</p>
            </div>
            <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full
                             bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/20
                             uppercase tracking-wider">
              Platform admin
            </span>
          </div>
        )}

        <form onSubmit={configForm.handleSubmit(onSaveConfig)}>
          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={styles.label}>Platform name</label>
                <Input
                  {...configForm.register("platform_name")}
                  className={styles.input}
                  placeholder="e.g. EduPlatform"
                />
                {configForm.formState.errors.platform_name && (
                  <p className={styles.error}>
                    {configForm.formState.errors.platform_name.message}
                  </p>
                )}
              </div>
              <div>
                <label className={styles.label}>Support email</label>
                <Input
                  {...configForm.register("support_email")}
                  className={styles.input}
                  placeholder="support@eduplatform.rw"
                />
                {configForm.formState.errors.support_email && (
                  <p className={styles.error}>
                    {configForm.formState.errors.support_email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── ACADEMIC DEFAULTS section */}
          <div className={styles.divider} />
          <div className="px-6 py-5 space-y-5">
            <div>
              <p className={`text-[12px] font-bold mb-0.5 ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Academic defaults
              </p>
              <p className={`text-[11px] ${
                theme === "dark" ? "text-[#4a6e94]" : "text-gray-500"
              }`}>
                Pre-filled in forms across teacher and director panels
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={styles.label}>Default academic year</label>
                <Input
                  {...configForm.register("default_academic_year")}
                  className={styles.input}
                  placeholder="2025-2026"
                />
                {configForm.formState.errors.default_academic_year && (
                  <p className={styles.error}>
                    {configForm.formState.errors.default_academic_year.message}
                  </p>
                )}
              </div>
              <div>
                <label className={styles.label}>Default max score</label>
                <Input
                  {...configForm.register("default_max_score", { valueAsNumber: true })}
                  type="number"
                  className={styles.input}
                  placeholder="100"
                />
                {configForm.formState.errors.default_max_score && (
                  <p className={styles.error}>
                    {configForm.formState.errors.default_max_score.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={styles.label}>Max students per class</label>
              <div className="flex items-center gap-3">
                <Input
                  {...configForm.register("max_students_per_class", {
                    setValueAs: v => v === "" ? null : Number(v),
                  })}
                  type="number"
                  className={`w-40 ${styles.input}`}
                  placeholder="No limit"
                />
                <p className={`text-[12px] ${
                  theme === "dark" ? "text-[#2d4a6a]" : "text-gray-400"
                }`}>
                  Leave empty for no limit
                </p>
              </div>
              {configForm.formState.errors.max_students_per_class && (
                <p className={styles.error}>
                  {configForm.formState.errors.max_students_per_class.message}
                </p>
              )}
            </div>

            {/* Term names tag editor */}
            <TagEditor
              label="Default term names"
              tags={termNames}
              onChange={setTermNames}
              placeholder="Type a term name and press Enter..."
              theme={theme}
            />

            {/* Exam types tag editor */}
            <TagEditor
              label="Default exam types"
              tags={examTypes}
              onChange={setExamTypes}
              placeholder="Type an exam type and press Enter..."
              theme={theme}
            />
          </div>

          {/* Save bar */}
          <div className={`flex items-center justify-between px-6 py-4
                          border-t ${theme === "dark" 
                            ? "border-[#0f1e2e] bg-[#060b12]/40" 
                            : "border-gray-200 bg-gray-50/40"
                          }`}>
            <p className={`text-[12px] ${
              theme === "dark" ? "text-[#2d4a6a]" : "text-gray-400"
            }`}>
              {configForm.formState.isDirty ||
               termNames.join() !== (settings?.default_term_names ?? []).join() ||
               examTypes.join() !== (settings?.default_exam_types ?? []).join()
                ? "You have unsaved changes"
                : "All changes saved"
              }
            </p>
            <Button
              type="submit"
              disabled={savingConfig}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                         text-[13px] h-9 px-5 rounded-xl shadow-none
                         disabled:opacity-40"
            >
              {savingConfig ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : "Save settings"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── PASSWORD section */}
      <div className={styles.section}>
        <SectionHeader
          title="Change password"
          desc="Update your admin account credentials"
          theme={theme}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          }
        />

        <form onSubmit={pwForm.handleSubmit(onSavePassword)}>
          <div className="px-6 py-5 space-y-4">

            {passwordSuccess && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                             bg-emerald-400/10 border border-emerald-400/20">
                <svg className="w-4 h-4 text-emerald-400 shrink-0"
                  viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd" />
                </svg>
                <p className="text-[13px] font-medium text-emerald-400">
                  Password updated successfully
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">

              {/* Current */}
              <div>
                <label className={styles.label}>Current password</label>
                <div className="relative">
                  <Input
                    {...pwForm.register("current_password")}
                    type={showCurrent ? "text" : "password"}
                    className={styles.input}
                    placeholder="Current password"
                    autoComplete="current-password"
                  />
                  <button type="button"
                    onClick={() => setShowCurrent(v => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2
                               transition-colors ${
                                 theme === "dark" 
                                   ? "text-[#2d4a6a] hover:text-[#4a6e94]" 
                                   : "text-gray-400 hover:text-gray-600"
                               }`}>
                    <EyeIcon show={showCurrent} />
                  </button>
                </div>
                {pwForm.formState.errors.current_password && (
                  <p className={styles.error}>
                    {pwForm.formState.errors.current_password.message}
                  </p>
                )}
              </div>

              {/* New */}
              <div>
                <label className={styles.label}>New password</label>
                <div className="relative">
                  <Input
                    {...pwForm.register("new_password")}
                    type={showNew ? "text" : "password"}
                    className={styles.input}
                    placeholder="New password"
                    autoComplete="new-password"
                  />
                  <button type="button"
                    onClick={() => setShowNew(v => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2
                               transition-colors ${
                                 theme === "dark" 
                                   ? "text-[#2d4a6a] hover:text-[#4a6e94]" 
                                   : "text-gray-400 hover:text-gray-600"
                               }`}>
                    <EyeIcon show={showNew} />
                  </button>
                </div>
                {pwForm.formState.errors.new_password && (
                  <p className={styles.error}>
                    {pwForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className={styles.label}>Confirm new password</label>
                <div className="relative">
                  <Input
                    {...pwForm.register("confirm_password")}
                    type={showConfirm ? "text" : "password"}
                    className={styles.input}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2
                               transition-colors ${
                                 theme === "dark" 
                                   ? "text-[#2d4a6a] hover:text-[#4a6e94]" 
                                   : "text-gray-400 hover:text-gray-600"
                               }`}>
                    <EyeIcon show={showConfirm} />
                  </button>
                </div>
                {pwForm.formState.errors.confirm_password && (
                  <p className={styles.error}>
                    {pwForm.formState.errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { rule: "8+ characters",        pass: (v: string) => v.length >= 8 },
                { rule: "One uppercase letter",  pass: (v: string) => /[A-Z]/.test(v) },
                { rule: "One number",            pass: (v: string) => /[0-9]/.test(v) },
              ].map(r => (
                <div key={r.rule}
                  className={`flex items-center gap-2 text-[11px] ${
                    theme === "dark" ? "text-[#2d4a6a]" : "text-gray-400"
                  }`}>
                  <svg className="w-3 h-3 shrink-0" viewBox="0 0 20 20"
                    fill="currentColor">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd" />
                  </svg>
                  {r.rule}
                </div>
              ))}
            </div>
          </div>

          <div className={`flex justify-end px-6 py-4 border-t ${
            theme === "dark" 
              ? "border-[#0f1e2e] bg-[#060b12]/40" 
              : "border-gray-200 bg-gray-50/40"
          }`}>
            <Button
              type="submit"
              disabled={savingPassword || !pwForm.formState.isDirty || !pwForm.formState.isValid}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white
                         text-[13px] h-9 px-5 rounded-xl shadow-none
                         disabled:opacity-40 min-w-35"
            >
              {savingPassword ? (
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Updating...
                </span>
              ) : "Update password"}
            </Button>
          </div>
        </form>
      </div>

      {/* ── DANGER section */}
      <div className={styles.dangerSection}>
        <div className={`flex items-start gap-4 px-6 py-5 border-b ${
          theme === "dark" ? "border-rose-400/10" : "border-rose-200"
        }`}>
          <div className={`w-9 h-9 rounded-xl bg-rose-400/10 border border-rose-400/20
                          flex items-center justify-center shrink-0 text-rose-400`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className={`text-[14px] font-bold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>Danger zone</p>
            <p className={`text-[12px] ${
              theme === "dark" ? "text-[#4a6e94]" : "text-gray-500"
            } mt-0.5`}>
              Irreversible actions — proceed with caution
            </p>
          </div>
        </div>
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <p className={`text-[13px] font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}>Sign out</p>
            <p className={`text-[12px] ${
              theme === "dark" ? "text-[#4a6e94]" : "text-gray-500"
            } mt-0.5`}>
              End your current admin session
            </p>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" })
              window.location.href = "/auth/login"
            }}
            className={`border-rose-400/20 text-rose-400/70 hover:text-rose-400
                       hover:border-rose-400/40 hover:bg-rose-400/5
                       bg-transparent text-[13px] h-9 transition-colors`}
          >
            Sign out
          </Button>
        </div>
      </div>

    </div>
  )
}