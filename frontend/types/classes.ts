export type ClassRecord = {
  id: string
  name: string
  grade_level: string
  academic_year: string
  school_id: string
}

export type Assignment = {
  id: string
  teacher_id: string
  teacher_name: string
  class_id: string
  class_name: string
  subject_id: string
  subject_name: string
  assigned_by: string
  created_at: string
}

export type ClassFormData = {
  name: string
  grade_level: string
  academic_year: string
}

export type AssignmentFormData = {
  teacher_id: string
  class_id: string
  subject_id: string
}