'use client'

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"

import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card"
import { Input } from "../ui/input"

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
})

type ForgotFormData = z.infer<typeof forgotSchema>

function ForgotPasswordComponent() {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    console.log("Reset email:", data)

    // simulate API
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <Card className="max-w-md w-full mx-auto p-6 space-y-5 shadow-xl border border-blue-100">

      <CardTitle className="text-2xl font-bold text-center text-blue-600">
        Forgot Password
      </CardTitle>

      <CardDescription className="text-center text-gray-600">
        Enter your email and we’ll send you a reset link
      </CardDescription>

      <CardContent className="space-y-4">

        {/* Email */}
        <div>
          <Input
            placeholder="Enter your email"
            {...register("email")}
            className="focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </Button>

        {/* Back to Login */}
        <p className="text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Back to Login
          </Link>
        </p>

      </CardContent>
    </Card>
  )
}

export default ForgotPasswordComponent