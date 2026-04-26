import { redirect } from "next/navigation"

export default function ClassIndexPage({
  params,
}: {
  params: { classId: string }
}) {
  redirect(`/teacher/classes/${params.classId}/students`)
}