import { Users, ClipboardList, BarChart3, BookOpen, Shield, Globe } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      color: "#f59e0b",
      title: "Student management",
      desc: "Enroll students, track attendance, manage guardian contacts and transfer between classes — all from one dashboard.",
      tag: "Director + Teacher",
    },
    {
      icon: <ClipboardList className="w-6 h-6" />,
      color: "#7c3aed",
      title: "Smart gradebook",
      desc: "Spreadsheet-style mark entry with bulk upload, automatic averaging and instant grade calculation for every subject.",
      tag: "Teacher",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      color: "#0891b2",
      title: "Automated reports",
      desc: "Generate term reports with rankings, grades and comments in one click. Directors review and add feedback instantly.",
      tag: "Both roles",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      color: "#10b981",
      title: "Class & subject setup",
      desc: "Create classes, assign subjects with custom codes, set capacities and assign teachers to class-subject pairs.",
      tag: "Director",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      color: "#f59e0b",
      title: "Role-based access",
      desc: "Admins, directors and teachers each see only what they need. JWT-secured with school-scoped data isolation.",
      tag: "All roles",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      color: "#7c3aed",
      title: "Multi-school platform",
      desc: "Platform admins manage all schools from one console. Onboard new schools and directors in minutes.",
      tag: "Platform admin",
    },
  ]

  return (
    <section className="bg-[#050a0e] py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-[42px] md:text-[52px] font-black text-white tracking-tight leading-[1.05]">
            One platform,
            <br />
            <span className="text-white/30">every workflow.</span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative bg-[#080f18] border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top left, ${f.color}08, transparent 60%)`,
                }}
              />

              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{
                    background: f.color + "15",
                    border: `1px solid ${f.color}25`,
                    color: f.color,
                  }}>
                  {f.icon}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 block">
                  {f.tag}
                </span>
                <h3 className="text-[16px] font-bold text-white mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
