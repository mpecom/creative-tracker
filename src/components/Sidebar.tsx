'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Film, BarChart2, Zap, Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Overview' },
  { href: '/creatives',  icon: Film,             label: 'Creatives' },
  { href: '/analytics',  icon: BarChart2,         label: 'Analytics' },
  { href: '/hooks',      icon: Zap,               label: 'Hooks' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <img src="/nav-logo-blue.svg" alt="BOXR" className="h-8 w-auto" />
        <p className="text-text-dim text-[9px] font-display font-bold uppercase tracking-[0.3em] mt-2">
          Creative Tracker
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-bold uppercase tracking-wide transition-all ${
                active
                  ? 'bg-accent text-white'
                  : 'text-text-dim hover:text-text hover:bg-border'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-display font-bold text-text-dim hover:text-text hover:bg-border transition-all"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        <div className="px-3 pt-2">
          <p className="text-muted text-[10px] font-display font-bold uppercase tracking-widest">
            NL · FR · DE · ES · IT
          </p>
        </div>
      </div>
    </aside>
  )
}
