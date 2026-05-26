import Link from "next/link"
import {
  CheckCircle2, X, Zap, School, Building2,
  ArrowRight, HelpCircle, Star, Shield,
  Users, BarChart3, BookOpen, Globe,
} from "lucide-react"

export const metadata = {
  title: "Pricing — E-Shuri",
  description: "Simple, transparent pricing for every school size. Start free, scale as you grow.",
}

const PLANS = [
  {
    name:       "Starter",
    price:      "Free",
    period:     "forever",
    desc:       "Perfect for small schools getting started with digital management.",
    color:      "#4a6e94",
    icon:       <School className="w-5 h-5" />,
    highlight:  false,
    cta:        "Get started free",
    features: [
      { text: "Up to 100 students",          included: true  },
      { text: "Up to 5 teachers",            included: true  },
      { text: "3 classes",                   included: true  },
      { text: "Basic mark entry",            included: true  },
      { text: "Term report generation",      included: true  },
      { text: "Director dashboard",          included: true  },
      { text: "Email support",               included: true  },
      { text: "Advanced analytics",          included: false },
      { text: "Custom exam types",           included: false },
      { text: "Multi-school management",     included: false },
      { text: "Priority support",            included: false },
      { text: "API access",                  included: false },
    ],
  },
  {
    name:       "School",
    price:      "29,000",
    period:     "RWF / month",
    desc:       "For growing schools that need the full power of E-Shuri.",
    color:      "#f59e0b",
    icon:       <Zap className="w-5 h-5" />,
    highlight:  true,
    cta:        "Start 30-day trial",
    features: [
      { text: "Unlimited students",          included: true  },
      { text: "Unlimited teachers",          included: true  },
      { text: "Unlimited classes",           included: true  },
      { text: "Full gradebook with bulk",    included: true  },
      { text: "Automated report cards",      included: true  },
      { text: "Director + Teacher panels",   included: true  },
      { text: "Priority email & chat",       included: true  },
      { text: "Advanced analytics",          included: true  },
      { text: "Custom exam types",           included: true  },
      { text: "Multi-school management",     included: false },
      { text: "Priority support",            included: true  },
      { text: "API access",                  included: false },
    ],
  },
  {
    name:       "Enterprise",
    price:      "Custom",
    period:     "contact us",
    desc:       "For districts and organisations managing multiple schools.",
    color:      "#7c3aed",
    icon:       <Building2 className="w-5 h-5" />,
    highlight:  false,
    cta:        "Contact sales",
    features: [
      { text: "Everything in School",        included: true  },
      { text: "Unlimited schools",           included: true  },
      { text: "Platform admin console",      included: true  },
      { text: "Cross-school analytics",      included: true  },
      { text: "Custom integrations",         included: true  },
      { text: "Dedicated account manager",   included: true  },
      { text: "On-site training",            included: true  },
      { text: "SLA guarantee (99.9%)",       included: true  },
      { text: "Custom exam types",           included: true  },
      { text: "Multi-school management",     included: true  },
      { text: "24/7 priority support",       included: true  },
      { text: "Full API access",             included: true  },
    ],
  },
]

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes — the Starter plan is free forever with no credit card required. It's designed to get small schools off paper and onto E-Shuri with zero risk.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Absolutely. You can upgrade, downgrade or cancel at any time. When you upgrade, you get instant access to all new features. No contracts, no lock-in.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "Your data is yours. If you cancel, you can export everything — students, marks, reports — in standard formats. We retain your data for 90 days after cancellation.",
  },
  {
    q: "Do you offer discounts for NGOs or government schools?",
    a: "Yes. We offer special pricing for public schools, NGO-run schools and education ministries. Contact our sales team to learn more.",
  },
  {
    q: "Is the 30-day trial really free?",
    a: "Yes — no credit card needed. You get full access to the School plan for 30 days. At the end of the trial, you choose to continue or drop to the free Starter plan.",
  },
  {
    q: "How is pricing calculated for Enterprise?",
    a: "Enterprise pricing is based on the number of schools, students and required integrations. We build a custom package that fits your exact needs.",
  },
]

export default function PricingPage() {
  return (
    <div className="bg-[#050a0e] overflow-hidden">

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                          w-150 h-75 bg-[#f59e0b]/6 blur-[120px] rounded-full" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                          bg-white/5 border border-white/10 text-[12px]
                          font-medium text-white/50 mb-8">
            <Star className="w-3.5 h-3.5 text-[#f59e0b]" />
            Simple, transparent pricing — no surprises
          </div>
          <h1 className="text-[52px] md:text-[68px] font-black text-white
                         tracking-tight leading-none mb-5">
            Start free.
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r
                             from-[#f59e0b] to-[#fbbf24]">
              Scale as you grow.
            </span>
          </h1>
          <p className="text-[17px] text-white/40 leading-relaxed">
            Every plan includes a full-featured school management system.
            Upgrade only when you need more.
          </p>
        </div>
      </section>

      {/* ── PRICING CARDS ───────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-2xl overflow-hidden transition-all
                  ${plan.highlight
                    ? "border-2 border-[#f59e0b] shadow-2xl shadow-amber-500/20 scale-[1.03]"
                    : "border border-white/10 hover:border-white/20"
                  }`}
                style={{
                  background: plan.highlight
                    ? "linear-gradient(135deg, #0d1a10, #0f1e14)"
                    : "#080f18",
                }}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 bg-linear-to-r
                                  from-[#f59e0b] to-[#d97706] text-center py-1.5">
                    <span className="text-[11px] font-black text-white uppercase
                                     tracking-widest">
                      ★ Most popular
                    </span>
                  </div>
                )}

                <div className={`p-7 ${plan.highlight ? "pt-10" : ""}`}>
                  {/* Plan header */}
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: plan.color + "20",
                        border: `1px solid ${plan.color}30`,
                        color: plan.color,
                      }}>
                      {plan.icon}
                    </div>
                    <span className="text-[14px] font-bold text-white">{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      {plan.price === "Free" || plan.price === "Custom" ? (
                        <span className="text-[42px] font-black text-white">
                          {plan.price}
                        </span>
                      ) : (
                        <>
                          <span className="text-[32px] font-black text-white
                                           tabular-nums">
                            {plan.price}
                          </span>
                          <span className="text-[12px] text-white/30 font-medium">
                            {plan.period}
                          </span>
                        </>
                      )}
                    </div>
                    {plan.price !== "Free" && plan.price !== "Custom" && (
                      <p className="text-[11px] text-white/20 mt-0.5">
                        Billed monthly · cancel anytime
                      </p>
                    )}
                  </div>

                  <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                    {plan.desc}
                  </p>

                  {/* CTA */}
                  <Link
                    href={plan.name === "Enterprise" ? "/contact" : "/auth/login"}
                    className={`flex items-center justify-center gap-2 w-full
                               py-3 rounded-xl text-[13px] font-bold mb-6
                               transition-all hover:-translate-y-0.5
                      ${plan.highlight
                        ? "bg-linear-to-r from-[#f59e0b] to-[#d97706] text-white shadow-lg shadow-amber-500/25"
                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                      }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map(f => (
                      <li key={f.text}
                        className="flex items-center gap-2.5 text-[12px]">
                        {f.included ? (
                          <CheckCircle2
                            className="w-4 h-4 shrink-0"
                            style={{ color: plan.color }}
                          />
                        ) : (
                          <X className="w-4 h-4 shrink-0 text-white/15" />
                        )}
                        <span className={f.included ? "text-white/70" : "text-white/20"}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase
                          tracking-widest mb-3">
              Compare plans
            </p>
            <h2 className="text-[40px] font-black text-[#050a0e] tracking-tight">
              Everything side by side
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#050a0e]/10">
            <table className="w-full">
              <thead>
                <tr className="bg-[#050a0e]">
                  <th className="text-left px-6 py-4 text-[12px] font-semibold
                                 text-white/40 w-1/2">
                    Feature
                  </th>
                  {["Starter", "School", "Enterprise"].map(p => (
                    <th key={p}
                      className="text-center px-4 py-4 text-[12px] font-bold text-white">
                      {p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Students",              vals: ["100",      "Unlimited", "Unlimited"] },
                  { feature: "Teachers",              vals: ["5",        "Unlimited", "Unlimited"] },
                  { feature: "Classes",               vals: ["3",        "Unlimited", "Unlimited"] },
                  { feature: "Mark entry",            vals: ["✓",        "✓",         "✓"] },
                  { feature: "Report generation",     vals: ["✓",        "✓",         "✓"] },
                  { feature: "Advanced analytics",    vals: ["—",        "✓",         "✓"] },
                  { feature: "Multi-school console",  vals: ["—",        "—",         "✓"] },
                  { feature: "API access",            vals: ["—",        "—",         "✓"] },
                  { feature: "Custom integrations",   vals: ["—",        "—",         "✓"] },
                  { feature: "Support",               vals: ["Email",    "Priority",  "24/7 + SLA"] },
                  { feature: "Price",                 vals: ["Free",     "29K RWF/mo","Custom"] },
                ].map((row, i) => (
                  <tr key={row.feature}
                    className={`border-t border-[#050a0e]/5
                      ${i % 2 === 0 ? "bg-white" : "bg-[#fafaf9]"}`}>
                    <td className="px-6 py-3.5 text-[13px] font-medium text-[#050a0e]/70">
                      {row.feature}
                    </td>
                    {row.vals.map((v, j) => (
                      <td key={j}
                        className={`text-center px-4 py-3.5 text-[13px]
                          ${j === 1 ? "font-bold text-[#f59e0b]" : "text-[#050a0e]/50"}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ────────────────────────────── */}
      <section className="bg-[#050a0e] py-16 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <Shield className="w-6 h-6" />,     text: "SSL encrypted",      color: "#10b981" },
            { icon: <Globe className="w-6 h-6" />,       text: "99.9% uptime",       color: "#0891b2" },
            { icon: <Users className="w-6 h-6" />,       text: "GDPR compliant",     color: "#7c3aed" },
            { icon: <BarChart3 className="w-6 h-6" />,   text: "Daily backups",      color: "#f59e0b" },
          ].map(b => (
            <div key={b.text} className="flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: b.color + "15", color: b.color }}>
                {b.icon}
              </div>
              <p className="text-[12px] text-white/40 font-medium">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase
                          tracking-widest mb-3">
              Got questions?
            </p>
            <h2 className="text-[42px] font-black text-[#050a0e] tracking-tight">
              Frequently asked
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i}
                className="border border-[#050a0e]/8 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-[#f59e0b] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-bold text-[#050a0e] mb-2">
                      {faq.q}
                    </p>
                    <p className="text-[13px] text-[#050a0e]/50 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────── */}
      <section className="bg-[#050a0e] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[42px] font-black text-white tracking-tight mb-4">
            Still not sure?
          </h2>
          <p className="text-[16px] text-white/40 mb-8 max-w-xl mx-auto">
            Start with our free plan and upgrade when you are ready.
            No credit card, no commitment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="flex items-center gap-2 bg-linear-to-r from-[#f59e0b]
                         to-[#d97706] text-white font-bold text-[15px] px-8 py-4
                         rounded-2xl shadow-xl shadow-amber-500/25
                         hover:-translate-y-0.5 transition-all"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium text-white/40
                         hover:text-white transition-colors"
            >
              Talk to our team →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}