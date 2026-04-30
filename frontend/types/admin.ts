export type School = {
  id:           string
  name:         string
  is_active:    boolean
  created_at:   string
  director_id:  string | null
}

export type Director = {
  id:        string
  name:      string
  email:     string
  school_id: string | null
  is_active: boolean
}