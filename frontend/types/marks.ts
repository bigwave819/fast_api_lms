export type Mark = {
  id:            string
  student_id:    string
  subject_id:    string
  class_id:      string
  teacher_id:    string
  term:          string
  academic_year: string
  exam_type:     string
  score:         number
  max_score:     number
  notes:         string | null
  created_at:    string
}

export type MarkCreate = {
  student_id:    string
  subject_id:    string
  class_id:      string
  term:          string
  academic_year: string
  exam_type:     string
  score:         number
  max_score:     number
  notes?:        string
}

export type MarkUpdate = {
  score: number
  notes?: string
}