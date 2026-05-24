export type PlatformSettings = {
  id:                     string
  platform_name:          string
  default_academic_year:  string
  default_term_names:     string[]
  default_exam_types:     string[]
  default_max_score:      number
  support_email:          string | null
  max_students_per_class: number | null
}