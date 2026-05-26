import Link from "next/link"
import { GraduationCap, Mail, Phone, MapPin, } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-[#050a0e] border-t border-white/5">

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#f59e0b]
                              to-[#d97706] flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[18px] font-black text-white tracking-tight">
                E-<span className="text-[#f59e0b]">Shuri</span>
              </span>
            </Link>
            <p className="text-[14px] text-white/40 leading-relaxed max-w-xs">
              The all-in-one school management platform built for African schools.
              Manage everything from enrollment to report cards in one place.
            </p>
            {/* <div className="flex items-center gap-3 mt-6">
              {[
                { icon: <Twitter className="w-4 h-4" />, href: "#" },
                { icon: <Linkedin className="w-4 h-4" />, href: "#" },
                { icon: <Github className="w-4 h-4" />,  href: "#" },
              ].map((s, i) => (
                <a key={i} href={s.href}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10
                             flex items-center justify-center text-white/40
                             hover:text-[#f59e0b] hover:border-[#f59e0b]/30
                             transition-all">
                  {s.icon}
                </a>
              ))}
            </div> */}
          </div>

          {/* Links */}
          <div>
            <p className="text-[11px] font-bold text-white/30 uppercase
                          tracking-widest mb-4">
              Platform
            </p>
            <ul className="space-y-2.5">
              {[
                { label: "Home",     href: "/" },
                { label: "About",    href: "/about" },
                { label: "Pricing",  href: "/pricing" },
                { label: "Contact",  href: "/contact" },
                { label: "Sign in",  href: "/auth/login" },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href}
                    className="text-[13px] text-white/40 hover:text-white
                               transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[11px] font-bold text-white/30 uppercase
                          tracking-widest mb-4">
              Contact
            </p>
            <ul className="space-y-3">
              {[
                { icon: <Mail className="w-3.5 h-3.5" />,    text: "hello@eshuri.rw" },
                { icon: <Phone className="w-3.5 h-3.5" />,   text: "+250 788 000 000" },
                { icon: <MapPin className="w-3.5 h-3.5" />,  text: "Kigali, Rwanda" },
              ].map((c, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[13px] text-white/40">
                  <span className="text-[#f59e0b]/60">{c.icon}</span>
                  {c.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-[12px] text-white/20">
            © {new Date().getFullYear()} E-Shuri. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms"].map(l => (
              <Link key={l} href="#"
                className="text-[12px] text-white/20 hover:text-white/50 transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}