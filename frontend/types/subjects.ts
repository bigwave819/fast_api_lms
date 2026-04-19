export type Subject = {
  id: string
  name: string
  code: string
  description: string | null
  school_id: string
}

export type SubjectFormData = {
  name: string
  code: string
  description: string
}

export const EMPTY_SUBJECT_FORM: SubjectFormData = {
  name: "",
  code: "",
  description: "",
}