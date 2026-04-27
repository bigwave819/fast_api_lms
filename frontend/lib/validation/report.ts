import { z } from "zod"

export const generateReportSchema = z.object({
  term: z.string().min(1, "Term is required"),
  academic_year: z
    .string()
    .regex(/^\d{4}-\d{4}$/, "Format: 2024-2025"),
})

export const teacherCommentSchema = z.object({
  teacher_comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Max 500 characters"),
})

export type GenerateReportValues  = z.infer<typeof generateReportSchema>
export type TeacherCommentValues  = z.infer<typeof teacherCommentSchema>