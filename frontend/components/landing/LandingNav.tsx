"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, GraduationCap, ChevronRight } from "lucide-react"

const NAV_LINKS = [
  { label: "Home",    href: "/" },
  { label: "About",   href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
]

export function LandingNav() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${scrolled
          ? "bg-[#050a0e]/90 backdrop-blur-xl border-b border-white/5 py-3"
          : "bg-transparent py-5"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#f59e0b] to-[#d97706]
                          flex items-center justify-center shadow-lg
                          shadow-amber-500/30 group-hover:shadow-amber-500/50
                          transition-shadow">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-[18px] font-black text-white tracking-tight">
            E-<span className="text-[#f59e0b]">Shuri</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-[13px] font-medium text-white/60
                         hover:text-white transition-colors rounded-lg
                         hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-[13px] font-medium text-white/60 hover:text-white
                       transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-[13px] font-bold
                       bg-linear-to-r from-[#f59e0b] to-[#d97706]
                       text-white px-5 py-2.5 rounded-xl shadow-lg
                       shadow-amber-500/25 hover:shadow-amber-500/40
                       hover:-translate-y-0.5 transition-all"
          >
            Get started
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#050a0e]/95 backdrop-blur-xl border-t
                        border-white/5 px-6 py-4 space-y-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-[14px] font-medium text-white/70
                         hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/5">
            <Link
              href="/auth/login"
              className="block w-full text-center text-[13px] font-bold
                         bg-linear-to-r from-[#f59e0b] to-[#d97706]
                         text-white px-5 py-3 rounded-xl mt-2"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}