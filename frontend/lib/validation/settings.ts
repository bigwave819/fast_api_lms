import { z } from "zod"

export const settingsSchema = z.object({
  platform_name: z
    .string()
    .min(2, "At least 2 characters")
    .max(80, "Too long"),

  default_academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Format: 2025-2026"),

  default_max_score: z
    .number({ message: "Must be a number" })
    .min(1, "Min 1")
    .max(1000, "Max 1000"),

  support_email: z
    .string()
    .email("Invalid email")
    .nullable()
    .optional(),

  max_students_per_class: z
    .number({ message: "Must be a number" })
    .min(1, "Min 1")
    .max(500, "Max 500")
    .nullable()
    .optional(),
})

export type SettingsValues = z.infer<typeof settingsSchema>