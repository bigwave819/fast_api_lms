export type School = {
  id:         string
  name:       string
  is_active:  boolean
  created_at: string
}

export type Director = {
  id:        string
  name:      string
  email:     string
  school_id: string | null
  is_active: boolean
}

export type PlatformStats = {
  total_schools:    number
  active_schools:   number
  inactive_schools: number
  total_directors:  number
  total_teachers:   number
  total_students:   number
}