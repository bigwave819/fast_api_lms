export type Report = {
  id: string
  student_id: string
  class_id: string
  school_id: string
  term: string
  academic_year: string
  total_score: number
  average_score: number
  grade: "A" | "B" | "C" | "D" | "F"
  class_rank: number
  teacher_comment: string | null
  director_comment: string | null
  generated_at: string
}

export type ClassRecord = {
  id: string
  name: string
  grade_level: string
  academic_year: string
}

export type StudentRecord = {
  id: string
  name: string
}