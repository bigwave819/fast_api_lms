export type TeacherDashboard = {
  teacher_name:    string
  assigned_classes: number
  total_students:  number
  marks_recorded:  number
}

export type ClassAssignmentDetail = {
  id:           string
  teacher_id:   string
  teacher_name: string
  class_id:     string
  class_name:   string
  subject_id:   string
  subject_name: string
  assigned_by:  string
  created_at:   string
}