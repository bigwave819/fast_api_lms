import { z } from "zod"

export const studentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
    .refine(v => new Date(v) < new Date(), "Date of birth must be in the past"),

  gender: z.enum(["M", "F", "Other"], {
    required_error: "Please select a gender",
  }),

  guardian_name: z
    .string()
    .min(2, "Guardian name must be at least 2 characters")
    .max(100)
    .nullable()
    .optional(),

  guardian_phone: z
    .string()
    .regex(/^\+?[\d\s\-]{7,20}$/, "Enter a valid phone number")
    .nullable()
    .optional(),

  enrollment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use format YYYY-MM-DD")
    .optional(),

  class_id: z.string().uuid("Invalid class"),
})

export const studentUpdateSchema = studentSchema.partial().extend({
  class_id: z.string().uuid("Invalid class").optional(),
})

export type StudentFormValues     = z.infer<typeof studentSchema>
export type StudentUpdateValues   = z.infer<typeof studentUpdateSchema>