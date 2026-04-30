import { z } from "zod"

export const passwordChangeSchema = z
  .object({
    current_password: z
      .string()
      .min(1, "Current password is required"),

    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),

    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine(d => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })
  .refine(d => d.new_password !== d.current_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
  })

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>