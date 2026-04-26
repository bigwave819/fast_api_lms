import { z } from "zod"

export const studentEnrollSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),

  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
    .refine(v => new Date(v) < new Date(), "Must be in the past"),

  gender: z.enum(["M", "F", "Other"] as const, "Select a gender"),

  guardian_name: z
    .string()
    .min(2, "At least 2 characters")
    .max(100)
    .optional(),

  guardian_phone: z
    .string()
    .regex(/^\+?[\d\s\-]{7,20}$/, "Enter a valid phone number")
    .optional(),

  enrollment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
    .optional(),
})

export const studentUpdateSchema = studentEnrollSchema.partial()

export type StudentEnrollValues = z.infer<typeof studentEnrollSchema>
export type StudentUpdateValues = z.infer<typeof studentUpdateSchema>