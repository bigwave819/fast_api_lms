import Link from "next/link"
import { ChevronRight, Play, CheckCircle2, TrendingUp } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#f59e0b]/8 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#7c3aed]/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full bg-[#0891b2]/8 blur-[80px]" />
        {/* Grid lines */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] font-medium text-white/60 mb-8 animate-[fadeIn_0.6s_ease_forwards]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
          Built for African schools · Trusted by 200+ institutions
        </div>

        {/* Headline */}
        <h1 className="text-[48px] md:text-[72px] lg:text-[88px] font-black text-white tracking-tight leading-[0.95] mb-6 animate-[fadeUp_0.8s_ease_forwards]">
          School management,
          <br />
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b]">
              reimagined.
            </span>
            {/* underline decoration */}
            <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 400 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6 C100 2 300 2 398 6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="400" strokeDashoffset="400" style={{ animation: "drawLine 1.2s 0.8s ease forwards" }} />
            </svg>
          </span>
        </h1>

        <p className="text-[17px] md:text-[20px] text-white/50 max-w-2xl mx-auto leading-relaxed mb-10 animate-[fadeUp_0.8s_0.2s_ease_forwards_both]">
          E-Shuri gives directors, teachers and students one powerful platform to manage classes, marks, reports and more — from any device.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-[fadeUp_0.8s_0.4s_ease_forwards_both]">
          <Link
            href="/auth/login"
            className="group flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-bold text-[15px] px-8 py-4 rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-1 transition-all duration-300"
          >
            Start for free
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/about"
            className="group flex items-center gap-2.5 text-white/60 hover:text-white text-[15px] font-medium px-6 py-4 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
              <Play className="w-3.5 h-3.5 ml-0.5" />
            </div>
            Watch demo
          </Link>
        </div>

        {/* 3D Dashboard mockup illustration */}
        <div className="relative mx-auto max-w-4xl animate-[fadeUp_0.8s_0.6s_ease_forwards_both]">
          {/* Glow behind mockup */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b]/20 via-transparent to-transparent blur-3xl scale-110" />

          {/* Mockup frame */}
          <div className="relative rounded-2xl border border-white/10 bg-[#080f18] shadow-2xl overflow-hidden [transform:perspective(1200px)_rotateX(6deg)] hover:[transform:perspective(1200px)_rotateX(2deg)] transition-transform duration-700">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0d1520] border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 mx-4 bg-white/5 rounded-lg h-6 flex items-center px-3">
                <span className="text-[11px] text-white/30">
                  app.eshuri.rw/director/dashboard
                </span>
              </div>
            </div>

            {/* Dashboard preview */}
            <div className="p-4 grid grid-cols-4 gap-3">
              {/* Stat cards */}
              {[
                { label: "Teachers", value: "48", color: "#f59e0b" },
                { label: "Students", value: "1,240", color: "#7c3aed" },
                { label: "Classes",  value: "32", color: "#0891b2" },
                { label: "Reports",  value: "486", color: "#10b981" },
              ].map(s => (
                <div key={s.label} className="bg-[#0d1520] rounded-xl p-3 border border-white/5">
                  <div className="w-6 h-6 rounded-lg mb-2"
                    style={{ background: s.color + "20", border: `1px solid ${s.color}30` }} />
                  <p className="text-[18px] font-bold text-white">{s.value}</p>
                  <p className="text-[10px] text-white/30">{s.label}</p>
                </div>
              ))}
              {/* Chart area */}
              <div className="col-span-3 bg-[#0d1520] rounded-xl p-3 border border-white/5 h-32">
                <p className="text-[11px] text-white/30 mb-2">Enrollment trend</p>
                <div className="flex items-end gap-1.5 h-16">
                  {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                    <div key={i}
                      className="flex-1 rounded-sm opacity-80"
                      style={{
                        height: `${h}%`,
                        background: `linear-gradient(to top, #f59e0b, #fbbf24)`,
                        opacity: i > 8 ? 1 : 0.4,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-[#0d1520] rounded-xl p-3 border border-white/5 h-32">
                <p className="text-[11px] text-white/30 mb-2">Grade dist.</p>
                <div className="space-y-1.5 mt-2">
                  {[
                    { g: "A", w: "70%", c: "#10b981" },
                    { g: "B", w: "50%", c: "#0891b2" },
                    { g: "C", w: "35%", c: "#f59e0b" },
                    { g: "F", w: "15%", c: "#f87171" },
                  ].map(r => (
                    <div key={r.g} className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/30 w-3">{r.g}</span>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: r.w, background: r.c, opacity: 0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -left-6 top-1/3 bg-[#080f18] border border-emerald-400/20 rounded-2xl px-3 py-2.5 shadow-xl animate-[float_4s_ease-in-out_infinite]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white">Report generated</p>
                <p className="text-[10px] text-white/40">S4A · Term 2</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-6 bottom-1/3 bg-[#080f18] border border-[#f59e0b]/20 rounded-2xl px-3 py-2.5 shadow-xl animate-[float_4s_1s_ease-in-out_infinite]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
              <div className="text-left">
                <p className="text-[11px] font-bold text-white">+87 students</p>
                <p className="text-[10px] text-white/40">This term</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
