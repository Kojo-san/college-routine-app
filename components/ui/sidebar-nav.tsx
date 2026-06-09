'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IoHomeOutline,
  IoCalendarOutline,
  IoSchoolOutline,
  IoStatsChartOutline,
  IoSettingsOutline,
} from 'react-icons/io5'
import type { IconType } from 'react-icons'

interface NavItem {
  href: string
  label: string
  Icon: IconType
  from: string
  to: string
}

const NAV: NavItem[] = [
  { href: '/',              label: 'Accueil',       Icon: IoHomeOutline,       from: '#a955ff', to: '#ea51ff' },
  { href: '/agenda',        label: 'Agenda',        Icon: IoCalendarOutline,   from: '#56CCF2', to: '#2F80ED' },
  { href: '/cours',         label: 'Cours',         Icon: IoSchoolOutline,     from: '#FF9966', to: '#FF5E62' },
  { href: '/planification', label: 'Planification', Icon: IoStatsChartOutline, from: '#80FF72', to: '#7EE8FA' },
  { href: '/settings',      label: 'Réglages',      Icon: IoSettingsOutline,   from: '#ffa9c6', to: '#f434e2' },
]

function NavPill({
  href, label, Icon, from, to, isActive,
}: NavItem & { isActive: boolean }) {
  const gradient = `linear-gradient(90deg, ${from}, ${to})`

  return (
    <div className="group relative" style={{ height: 60 }}>
      {/* Blur glow — sits behind the pill */}
      <div
        aria-hidden="true"
        className={`absolute top-0 left-0 h-[60px] rounded-[30px] blur-[15px] pointer-events-none transition-all duration-300 ease-in-out ${
          isActive
            ? 'w-[180px] opacity-50'
            : 'w-[60px] opacity-0 group-hover:w-[180px] group-hover:opacity-50'
        }`}
        style={{ background: gradient, zIndex: 0 }}
      />

      {/* Pill link */}
      <Link
        href={href}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex items-center justify-center h-[60px] rounded-[30px] overflow-hidden bg-white transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
          isActive ? 'w-[180px]' : 'w-[60px] group-hover:w-[180px]'
        }`}
        style={{ zIndex: 1 }}
      >
        {/* Gradient overlay — appears on hover/active */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{ background: gradient }}
        />

        {/* Icon — scales and fades out on hover/active */}
        <span
          aria-hidden="true"
          className={`relative z-10 text-gray-400 transition-all duration-300 ${
            isActive
              ? 'scale-0 opacity-0'
              : 'scale-100 opacity-100 group-hover:scale-0 group-hover:opacity-0'
          }`}
        >
          <Icon size={22} />
        </span>

        {/* Label — fades in on hover/active */}
        <span
          className={`absolute inset-0 z-10 flex items-center justify-center text-white uppercase tracking-wider text-[11px] font-semibold whitespace-nowrap select-none transition-opacity duration-300 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {label}
        </span>
      </Link>
    </div>
  )
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Navigation principale"
      className="fixed inset-y-0 left-0 z-40 w-[80px] flex flex-col items-center pt-6 pb-6 overflow-visible"
      style={{ background: '#12121F' }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center w-[60px] h-[60px] flex-shrink-0">
        <span
          className="font-serif text-[20px] font-bold select-none"
          style={{ color: '#C8A84B' }}
        >
          CR
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-4 overflow-visible">
        {NAV.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return <NavPill key={item.href} {...item} isActive={isActive} />
        })}
      </nav>
    </aside>
  )
}
