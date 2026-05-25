import { Star } from "lucide-react"

export function Testimonials() {
  const testimonials = [
    {
      quote: "E-Shuri transformed how we manage our school. What used to take days of paperwork now happens in minutes. The report generation alone saves us 20 hours a term.",
      name: "Marie Uwimana",
      role: "Director, Kigali Excellence Academy",
      rating: 5,
    },
    {
      quote: "The gradebook is incredible. My teachers can enter marks for 200 students in under 10 minutes. The automatic ranking and grade calculation is a game-changer.",
      name: "Jean-Paul Habimana",
      role: "Director, Remera Secondary School",
      rating: 5,
    },
    {
      quote: "As a platform admin managing 15 schools, E-Shuri gives me visibility I never had before. I can see every school's performance from one screen.",
      name: "Grace Mukamana",
      role: "Regional Education Director",
      rating: 5,
    },
  ]

  return (
    <section className="bg-white py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-widest mb-3">
            Loved by schools
          </p>
          <h2 className="text-[42px] font-black text-[#050a0e] tracking-tight">
            What directors say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i}
              className="bg-[#050a0e] rounded-2xl p-6 border border-white/5">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>
              <p className="text-[14px] text-white/70 leading-relaxed mb-5 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center text-[11px] font-bold text-white">
                  {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-bold text-white">{t.name}</p>
                  <p className="text-[11px] text-white/30">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
