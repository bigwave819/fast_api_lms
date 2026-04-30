import { z } from "zod"

export const schoolSchema = z.object({
  name:      z.string().min(2, "At least 2 characters").max(100),
  is_active: z.boolean().default(true),
})

export const directorSchema = z.object({
  name:      z.string().min(2, "At least 2 characters").max(100),
  email:     z.string().email("Invalid email"),
  password:  z.string().min(8, "At least 8 characters"),
  school_id: z.string().uuid("Invalid school").nullable().optional(),
})

export const directorUpdateSchema = z.object({
  name:      z.string().min(2).max(100).optional(),
  email:     z.string().email().optional(),
  school_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type SchoolValues          = z.infer<typeof schoolSchema>
export type DirectorValues        = z.infer<typeof directorSchema>
export type DirectorUpdateValues  = z.infer<typeof directorUpdateSchema>