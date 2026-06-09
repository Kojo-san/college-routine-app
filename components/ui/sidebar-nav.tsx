'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  IoHomeOutline,
  IoCalendarOutline,
  IoSchoolOutline,
  IoSettingsOutline,
} from 'react-icons/io5'
import type { IconType } from 'react-icons'
import { logout } from '@/app/actions/auth'

interface NavItem {
  href: string
  label: string
  Icon: IconType
  from: string
  to: string
}

const NAV: NavItem[] = [
  { href: '/',         label: 'Accueil',  Icon: IoHomeOutline,     from: '#a955ff', to: '#ea51ff' },
  { href: '/agenda',   label: 'Agenda',   Icon: IoCalendarOutline, from: '#56CCF2', to: '#2F80ED' },
  { href: '/cours',    label: 'Cours',    Icon: IoSchoolOutline,   from: '#FF9966', to: '#FF5E62' },
  { href: '/settings', label: 'Réglages', Icon: IoSettingsOutline, from: '#ffa9c6', to: '#f434e2' },
]

function NavPill({
  href, label, Icon, from, to, isActive,
}: NavItem & { isActive: boolean }) {
  const gradient = `linear-gradient(90deg, ${from}, ${to})`

  return (
    // Fixed 60×60 anchor — pill overflows rightward, never leftward
    <div className="group relative overflow-visible" style={{ width: 60, height: 60 }}>
      {/* Blur glow — only on hover, never for active alone */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 h-[60px] rounded-[30px] blur-[15px] pointer-events-none transition-all duration-300 ease-in-out w-[60px] opacity-0 group-hover:w-[180px] group-hover:opacity-50"
        style={{ background: gradient, zIndex: 0 }}
      />

      {/* Pill — collapses to 60px always; expands only on hover */}
      <Link
        href={href}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className="absolute top-0 left-0 h-[60px] rounded-[30px] overflow-hidden bg-white transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 w-[60px] group-hover:w-[180px]"
        style={{
          zIndex: 1,
          boxShadow: isActive ? `0 0 0 2px ${from}66` : undefined,
        }}
      >
        {/* Gradient overlay — only on hover */}
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          style={{ background: gradient }}
        />

        {/* Icon — always visible; active gets accent color, inactive gets gray */}
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 scale-100 opacity-100 group-hover:scale-0 group-hover:opacity-0"
          style={{ color: isActive ? from : '#9CA3AF' }}
        >
          <Icon size={22} />
        </span>

        {/* Label — only on hover */}
        <span
          className="absolute inset-0 z-10 flex items-center justify-center text-white uppercase tracking-wider text-[11px] font-semibold whitespace-nowrap select-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        >
          {label}
        </span>
      </Link>
    </div>
  )
}

function getInitials(name?: string): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}

function UserAvatarButton({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(false)
  const initials = getInitials(userName)

  return (
    <div className="mt-auto flex flex-col items-center pb-2 relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center font-space-grotesk text-[13px] font-semibold text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-all select-none cursor-pointer"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 bg-bg-surface border border-border-subtle rounded-xl shadow-2xl p-2 min-w-[148px]">
            <form action={logout}>
              <button
                type="submit"
                className="w-full px-3 py-2 text-left font-space-grotesk text-[13px] text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export function SidebarNav({ userName }: { userName?: string }) {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Navigation principale"
      className="fixed inset-y-0 left-0 z-40 w-[80px] flex flex-col pt-6 pb-6 overflow-visible"
      style={{ background: '#12121F' }}
    >
      {/* Logo */}
      <div
        style={{
          width: 52,
          height: 52,
          marginBottom: 24,
          flexShrink: 0,
          overflow: 'hidden',
          alignSelf: 'center',
        }}
      >
        <Image
          src="/assets/bear_no_background.png"
          width={52}
          height={52}
          alt=""
          aria-hidden="true"
          className="object-contain opacity-85"
        />
      </div>

      {/* Nav — pills anchored 10px from sidebar left, expand rightward */}
      <nav className="flex flex-col gap-4 overflow-visible pl-[10px]">
        {NAV.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : pathname.startsWith(item.href)
          return <NavPill key={item.href} {...item} isActive={isActive} />
        })}
      </nav>

      {/* User avatar + logout */}
      <UserAvatarButton userName={userName} />
    </aside>
  )
}
