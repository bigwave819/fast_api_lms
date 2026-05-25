import { School, Users, Award } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      icon: <School className="w-8 h-8" />,
      title: "Onboard your school",
      desc: "Platform admin creates your school profile and assigns a director account in seconds.",
    },
    {
      step: "02",
      icon: <Users className="w-8 h-8" />,
      title: "Add your team",
      desc: "Directors add teachers, create classes, and assign subjects. Teachers get instant access.",
    },
    {
      step: "03",
      icon: <Award className="w-8 h-8" />,
      title: "Track everything",
      desc: "Enroll students, record marks, and generate beautiful term reports automatically.",
    },
  ]

  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-widest mb-3">
            Simple by design
          </p>
          <h2 className="text-[42px] font-black text-[#050a0e] tracking-tight">
            Up and running in minutes
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-[#f59e0b]/30 to-transparent z-10 -translate-y-1/2" />
              )}
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#050a0e] mb-5 text-[#f59e0b]">
                  {s.icon}
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#f59e0b] text-[#050a0e] text-[11px] font-black flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold text-[#050a0e] mb-2">
                  {s.title}
                </h3>
                <p className="text-[13px] text-[#050a0e]/50 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
