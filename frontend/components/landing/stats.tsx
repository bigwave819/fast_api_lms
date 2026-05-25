import { School, Users, Shield, Star } from "lucide-react"

export function Stats() {
  const stats = [
    { value: "200+",  label: "Schools onboarded",  icon: <School className="w-5 h-5" /> },
    { value: "50K+",  label: "Students managed",   icon: <Users className="w-5 h-5" /> },
    { value: "98%",   label: "Uptime guaranteed",  icon: <Shield className="w-5 h-5" /> },
    { value: "4.9★",  label: "Average rating",     icon: <Star className="w-5 h-5" /> },
  ]

  return (
    <section className="bg-white py-14 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <div className="flex justify-center mb-2 text-[#f59e0b]">
              {s.icon}
            </div>
            <p className="text-[36px] font-black text-[#050a0e] tracking-tight">
              {s.value}
            </p>
            <p className="text-[13px] text-[#050a0e]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
