export type Student = {
  id: string
  name: string
  date_of_birth: string
  gender: "M" | "F" | "Other"
  guardian_name: string | null
  guardian_phone: string | null
  enrollment_date: string
  class_id: string
  school_id: string
  is_active: boolean
  added_by: string
}