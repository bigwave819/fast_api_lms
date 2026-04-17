'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"

import { Button } from "../ui/button"
import { Card, CardContent, CardTitle } from "../ui/card"
import { Input } from "../ui/input"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

const ROLE_REDIRECTS: Record<string, string> = {
  director:       "/director/dashboard",
  teacher:        "/teacher/dashboard",
  platform_admin: "/admin/dashboard",
}

function LoginComponent() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setServerError(err.detail ?? "Something went wrong. Please try again.")
      return
    }

    const { role } = await res.json()
    const destination = ROLE_REDIRECTS[role] ?? "/"
    router.push(destination)
  }

  return (
    <Card className="max-w-md w-full mx-auto p-6 space-y-5 shadow-xl border border-blue-100">
      <CardTitle className="text-2xl font-bold text-center text-blue-600">
        Welcome Back
      </CardTitle>

      <CardContent className="space-y-4">

        {/* Server error banner */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {serverError}
          </div>
        )}

        {/* Email */}
        <div>
          <Input
            placeholder="Email"
            {...register("email")}
            className="focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            {...register("password")}
            className="focus:ring-2 focus:ring-blue-500"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Row: Show + Forgot */}
        <div className="flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-blue-500 hover:underline"
          >
            {showPassword ? "Hide" : "Show"} Password
          </button>

          <Link
            href="/auth/forgot-password"
            className="text-blue-600 font-medium hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </CardContent>
    </Card>
  )
}

export default LoginComponent