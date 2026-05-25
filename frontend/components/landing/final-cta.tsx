import Link from "next/link"
import { GraduationCap, ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="bg-[#050a0e] py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gradient-to-br from-[#080f18] to-[#0d1a24] border border-white/10 rounded-3xl p-12 text-center overflow-hidden">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#f59e0b]/20 blur-3xl rounded-full" />

          {/* Decoration */}
          <div className="absolute top-4 right-6 text-white/5">
            <GraduationCap className="w-32 h-32" />
          </div>

          <div className="relative">
            <p className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-widest mb-4">
              Ready to transform your school?
            </p>
            <h2 className="text-[42px] md:text-[52px] font-black text-white tracking-tight leading-[1.05] mb-4">
              Join 200+ schools
              <br />
              already on E-Shuri
            </h2>
            <p className="text-[16px] text-white/40 mb-8 max-w-lg mx-auto">
              Get started today — no setup fees, no credit card required.
              Your first term is completely free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="group flex items-center gap-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-bold text-[15px] px-8 py-4 rounded-2xl shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all"
              >
                Get started free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="text-[15px] font-medium text-white/50 hover:text-white transition-colors"
              >
                Talk to sales →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
