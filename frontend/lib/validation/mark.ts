import { z } from "zod"

export const markContextSchema = z.object({
  term: z.string().min(1, "Term is required"),
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Format: 2024-2025"),
  exam_type: z.enum(["CAT", "MID", "FINAL", "PRACTICAL", "ASSIGNMENT"], {
    message: "Select an exam type",
  }),
  max_score: z
    .number({ message: "Must be a number" })
    .min(1, "Min 1")
    .max(1000, "Max 1000"),
})

export type MarkContextValues = z.infer<typeof markContextSchema>