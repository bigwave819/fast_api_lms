import { Zap, School, GraduationCap, CheckCircle2 } from "lucide-react"

export function Roles() {
  const roles = [
    {
      role:  "Platform Admin",
      icon:  <Zap className="w-7 h-7" />,
      color: "#7c3aed",
      desc:  "Manage all schools from one command centre. Onboard directors, monitor subscriptions and configure platform-wide settings.",
      features: [
        "Multi-school management",
        "Director account creation",
        "Platform configuration",
        "Billing & subscriptions",
      ],
    },
    {
      role:  "School Director",
      icon:  <School className="w-7 h-7" />,
      color: "#f59e0b",
      desc:  "Full visibility into your school. Manage teachers, classes, subjects, and review all student reports with director feedback.",
      features: [
        "Teacher management",
        "Class & subject setup",
        "School-wide reports",
        "Assignment control",
      ],
    },
    {
      role:  "Teacher",
      icon:  <GraduationCap className="w-7 h-7" />,
      color: "#0891b2",
      desc:  "Everything you need in the classroom. Enroll students, enter marks with a smart gradebook, and generate term reports.",
      features: [
        "Student enrollment",
        "Smart gradebook",
        "Report generation",
        "Teacher comments",
      ],
    },
  ]

  return (
    <section className="bg-[#050a0e] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-widest mb-3">
            Built for every role
          </p>
          <h2 className="text-[42px] font-black text-white tracking-tight">
            The right tools for everyone
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roles.map(r => (
            <div key={r.role}
              className="relative bg-[#080f18] border border-white/5 rounded-2xl p-7 overflow-hidden group hover:border-white/10 transition-all">

              {/* bg accent */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2"
                style={{ background: r.color }} />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: r.color + "15",
                    border: `1px solid ${r.color}25`,
                    color: r.color,
                  }}>
                  {r.icon}
                </div>
                <h3 className="text-[18px] font-black text-white mb-2">{r.role}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed mb-5">{r.desc}</p>
                <ul className="space-y-2">
                  {r.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-[13px] text-white/60">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0"
                        style={{ color: r.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
