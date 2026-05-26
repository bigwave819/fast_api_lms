import Link from "next/link"
import {
  GraduationCap, Target, Heart, Globe, Users,
  Lightbulb, ArrowRight, BookOpen, TrendingUp,
  Award, Shield, CheckCircle2,
} from "lucide-react"

export const metadata = {
  title: "About E-Shuri",
  description: "Learn about our mission to transform school management across Africa.",
}

export default function AboutPage() {
  return (
    <div className="bg-white overflow-hidden">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative bg-[#050a0e] pt-32 pb-24 px-6 overflow-hidden">

        {/* Bg effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full
                          bg-[#f59e0b]/8 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full
                          bg-[#7c3aed]/8 blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-white/5 border border-white/10 text-[12px]
                          font-medium text-white/50 mb-8">
            <Heart className="w-3.5 h-3.5 text-[#f59e0b]" />
            Made with passion for African education
          </div>
          <h1 className="text-[52px] md:text-[68px] font-black text-white
                         tracking-tight leading-none mb-6">
            We believe every school
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r
                             from-[#f59e0b] to-[#fbbf24]">
              deserves great tools.
            </span>
          </h1>
          <p className="text-[17px] text-white/50 max-w-2xl mx-auto leading-relaxed">
            E-Shuri was born from a simple observation — African schools were drowning
            in paperwork while the rest of the world moved to digital. We decided to change that.
          </p>
        </div>
      </section>

      {/* ── MISSION ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16
                        items-center">
          <div>
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase
                          tracking-widest mb-4">
              Our mission
            </p>
            <h2 className="text-[40px] font-black text-[#050a0e] tracking-tight
                           leading-[1.1] mb-6">
              Digitising education,
              one school at a time.
            </h2>
            <p className="text-[15px] text-[#050a0e]/50 leading-relaxed mb-6">
              We started E-Shuri because we saw talented educators spending
              hours on administrative tasks that software should handle automatically.
              Reports that took weeks to compile. Marks recorded in notebooks that
              got lost. Parent communications that never happened because there
              was no system.
            </p>
            <p className="text-[15px] text-[#050a0e]/50 leading-relaxed">
              Today, E-Shuri powers over 200 schools across Rwanda and the wider
              East Africa region — giving directors visibility, teachers efficiency,
              and students the attention they deserve.
            </p>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="bg-[#050a0e] rounded-3xl p-8 relative overflow-hidden">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#f59e0b]/15
                              blur-3xl rounded-full" />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: <Target className="w-6 h-6" />,     label: "Clear goals",      color: "#f59e0b" },
                  { icon: <Shield className="w-6 h-6" />,     label: "Data security",    color: "#7c3aed" },
                  { icon: <TrendingUp className="w-6 h-6" />, label: "Track progress",   color: "#0891b2" },
                  { icon: <Heart className="w-6 h-6" />,      label: "Student-first",    color: "#10b981" },
                  { icon: <Globe className="w-6 h-6" />,      label: "Africa-wide",      color: "#f59e0b" },
                  { icon: <Lightbulb className="w-6 h-6" />,  label: "Innovation",       color: "#7c3aed" },
                ].map(v => (
                  <div key={v.label}
                    className="flex items-center gap-3 bg-white/5 border
                               border-white/5 rounded-2xl px-4 py-3">
                    <div className="w-9 h-9 rounded-xl flex items-center
                                    justify-center shrink-0"
                      style={{ background: v.color + "20", color: v.color }}>
                      {v.icon}
                    </div>
                    <span className="text-[12px] font-semibold text-white/70">
                      {v.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ──────────────────────────────────── */}
      <section className="bg-[#050a0e] py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase
                          tracking-widest mb-3">
              What drives us
            </p>
            <h2 className="text-[42px] font-black text-white tracking-tight">
              Our core values
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Heart className="w-7 h-7" />,
                color: "#f59e0b",
                title: "Student-first design",
                desc: "Every feature we build starts with one question: does this help a student learn better? Technology should serve education, not the other way around.",
              },
              {
                icon: <Globe className="w-7 h-7" />,
                color: "#7c3aed",
                title: "Built for Africa",
                desc: "We understand the unique challenges of African schools — from connectivity constraints to multi-language environments. E-Shuri is designed for this reality.",
              },
              {
                icon: <Shield className="w-7 h-7" />,
                color: "#0891b2",
                title: "Trust & transparency",
                desc: "Schools trust us with sensitive student data. We take that seriously — with enterprise-grade security, data sovereignty and honest pricing.",
              },
            ].map(v => (
              <div key={v.title}
                className="bg-[#080f18] border border-white/5 rounded-2xl p-7">
                <div className="w-12 h-12 rounded-2xl flex items-center
                                justify-center mb-4"
                  style={{ background: v.color + "15",
                           border: `1px solid ${v.color}25`,
                           color: v.color }}>
                  {v.icon}
                </div>
                <h3 className="text-[17px] font-bold text-white mb-3">{v.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase
                          tracking-widest mb-3">
              The people behind E-Shuri
            </p>
            <h2 className="text-[42px] font-black text-[#050a0e] tracking-tight">
              Built by educators & engineers
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Alice Uwimana",     role: "CEO & Co-founder",    initials: "AU", color: "#f59e0b" },
              { name: "Jean Habimana",     role: "CTO & Co-founder",    initials: "JH", color: "#7c3aed" },
              { name: "Marie Ingabire",    role: "Head of Product",     initials: "MI", color: "#0891b2" },
              { name: "David Nkurunziza", role: "Lead Engineer",        initials: "DN", color: "#10b981" },
            ].map(m => (
              <div key={m.name} className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center
                             justify-center text-[22px] font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${m.color}, ${m.color}99)`,
                    boxShadow: `0 8px 24px ${m.color}30`,
                  }}
                >
                  {m.initials}
                </div>
                <p className="text-[14px] font-bold text-[#050a0e]">{m.name}</p>
                <p className="text-[12px] text-[#050a0e]/40 mt-0.5">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MILESTONES ──────────────────────────────── */}
      <section className="bg-[#050a0e] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase
                          tracking-widest mb-3">
              Our journey
            </p>
            <h2 className="text-[42px] font-black text-white tracking-tight">
              From idea to impact
            </h2>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3.75 top-0 bottom-0 w-px
                            bg-linear-to-b from-[#f59e0b]/50 via-[#7c3aed]/30
                            to-transparent" />
            <div className="space-y-10 pl-10">
              {[
                { year: "2022", event: "E-Shuri founded in Kigali with a vision to digitise Rwandan schools" },
                { year: "2022", event: "First 10 schools onboarded — proof the product worked" },
                { year: "2023", event: "100 schools milestone reached across Rwanda" },
                { year: "2023", event: "Expanded to Kenya and Uganda" },
                { year: "2024", event: "200+ schools, 50,000+ students managed on E-Shuri" },
                { year: "2025", event: "Launched platform admin console and multi-school management" },
              ].map((m, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-10 w-4 h-4 rounded-full border-2
                                  border-[#f59e0b] bg-[#050a0e]"
                    style={{ top: "3px" }} />
                  <span className="text-[11px] font-bold text-[#f59e0b]/60
                                   uppercase tracking-widest">
                    {m.year}
                  </span>
                  <p className="text-[14px] text-white/70 mt-1">{m.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[42px] font-black text-[#050a0e] tracking-tight mb-4">
            Join our mission
          </h2>
          <p className="text-[16px] text-[#050a0e]/50 mb-8">
            Whether you are a school director, teacher or education administrator —
            E-Shuri has a place for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-linear-to-r from-[#f59e0b]
                         to-[#d97706] text-white font-bold text-[15px] px-8 py-4
                         rounded-2xl shadow-xl shadow-amber-500/25
                         hover:-translate-y-0.5 transition-all"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium text-[#050a0e]/50
                         hover:text-[#050a0e] transition-colors"
            >
              Contact us →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}