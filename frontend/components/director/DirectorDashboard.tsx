// components/director/DirectorDashboard.tsx
"use client"

import { useEffect, useRef } from "react"
import Chart from "chart.js/auto"

type RecentReport = { id: string; title: string; class_name?: string; generated_at: string }

type Props = {
  data: {
    school_name: string
    total_teachers: number
    total_students: number
    total_classes: number
    total_subjects: number
    recent_reports: RecentReport[]
  }
}

export function DirectorDashboard({ data }: Props) {
  const enrollRef = useRef<HTMLCanvasElement>(null)
  const subjectRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!enrollRef.current || !subjectRef.current) return

    const enrollChart = new Chart(enrollRef.current, {
      type: "bar",
      data: {
        labels: ["S1", "S2", "S3", "S4", "S5", "S6", "P5", "P6"],
        datasets: [
          {
            label: "This term",
            data: [128, 145, 162, 158, 142, 130, 188, 187],
            backgroundColor: "#1558a8",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#378add" } },
          y: { grid: { color: "#e6f1fb" }, ticks: { color: "#378add" } },
        },
      },
    })

    const subjectChart = new Chart(subjectRef.current, {
      type: "doughnut",
      data: {
        labels: ["Sciences", "Humanities", "Languages", "Arts & other"],
        datasets: [{
          data: [5, 4, 3, 2],
          backgroundColor: ["#1558a8", "#378add", "#85b7eb", "#b5d4f4"],
          borderWidth: 2,
          borderColor: "#fff",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: { legend: { display: false } },
      },
    })

    return () => {
      enrollChart.destroy()
      subjectChart.destroy()
    }
  }, [])

  const stats = [
    { label: "Total teachers", value: data.total_teachers },
    { label: "Total students", value: data.total_students.toLocaleString() },
    { label: "Total classes",  value: data.total_classes },
    { label: "Subjects offered", value: data.total_subjects },
  ]

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <div className="bg-[#1558a8] px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-medium text-sm">{data.school_name}</p>
          <p className="text-blue-200 text-xs">Director panel</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-blue-100 p-4">
              <p className="text-xs text-blue-400">{s.label}</p>
              <p className="text-2xl font-medium text-blue-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-3 bg-white rounded-xl border border-blue-100 p-5">
            <p className="text-sm font-medium text-blue-900 mb-4">Student enrollment per class level</p>
            <div className="relative h-52">
              <canvas ref={enrollRef} />
            </div>
          </div>
          <div className="col-span-2 bg-white rounded-xl border border-blue-100 p-5">
            <p className="text-sm font-medium text-blue-900 mb-4">Subject distribution</p>
            <div className="relative h-52">
              <canvas ref={subjectRef} />
            </div>
          </div>
        </div>

        {/* Recent reports */}
        <div className="bg-white rounded-xl border border-blue-100 p-5">
          <p className="text-sm font-medium text-blue-900 mb-4">Recent reports</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-blue-400 border-b border-blue-100">
                <th className="text-left pb-2 font-medium">Report</th>
                <th className="text-left pb-2 font-medium">Generated</th>
                <th className="text-left pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_reports.map((r) => (
                <tr key={r.id} className="border-b border-blue-50 last:border-0">
                  <td className="py-2 text-blue-900">{r.title ?? "Report"}</td>
                  <td className="py-2 text-blue-500">
                    {new Date(r.generated_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">
                      Done
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}