'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Film, BarChart2, Zap, Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/creatives', icon: Film, label: 'Creatives' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/hooks', icon: Zap, label: 'Hooks' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-surface border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <span className="font-display font-bold text-lg text-text tracking-tight">
          Creative<span className="text-accent">Tracker</span>
        </span>
        <p className="text-text-dim text-xs mt-0.5">Meta Ads · NL FR DE ES IT</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                active
                  ? 'bg-accent text-bg'
                  : 'text-text-dim hover:text-text hover:bg-border'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: theme toggle */}
      <div className="px-3 py-4 border-t border-border">
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-display font-bold text-text-dim hover:text-text hover:bg-border transition-all"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
