import { Hero } from "@/components/landing/hero"
import { Stats } from "@/components/landing/stats"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Roles } from "@/components/landing/roles"
import { Testimonials } from "@/components/landing/testimonials"
import { FinalCTA } from "@/components/landing/final-cta"

export default function HomePage() {
  return (
    <div className="bg-[#050a0e] overflow-hidden">
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Roles />
      <Testimonials />
      <FinalCTA />
    </div>
  )
}