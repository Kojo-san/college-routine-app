'use client'

import { useState, useRef, type CSSProperties } from 'react'
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
  { href: '/',         label: 'Accueil',  Icon: IoHomeOutline,     from: '#C9006B', to: '#8B0055' },
  { href: '/agenda',   label: 'Agenda',   Icon: IoCalendarOutline, from: '#C9006B', to: '#8B0055' },
  { href: '/cours',    label: 'Cours',    Icon: IoSchoolOutline,   from: '#C9006B', to: '#8B0055' },
  { href: '/settings', label: 'Réglages', Icon: IoSettingsOutline, from: '#C9006B', to: '#8B0055' },
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

        {/* Icon — always visible; active gets magenta, inactive gets gray */}
        <span
          aria-hidden="true"
          className="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 scale-100 opacity-100 group-hover:scale-0 group-hover:opacity-0"
          style={{ color: isActive ? '#C9006B' : '#9CA3AF' }}
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
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({})
  const avatarRef = useRef<HTMLButtonElement>(null)
  const initials = getInitials(userName)

  function handleToggle() {
    if (!open && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect()
      setPopoverStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 8,
        left: rect.right + 8,
        zIndex: 9999,
        minWidth: '180px',
        background: '#1a0535',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        whiteSpace: 'nowrap',
      })
    }
    setOpen(o => !o)
  }

  return (
    <div className="mt-auto flex flex-col items-center pb-2">
      <button
        ref={avatarRef}
        type="button"
        onClick={handleToggle}
        className="w-10 h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center font-space-grotesk text-[13px] font-semibold text-text-muted hover:text-white hover:border-[#C9006B]/60 transition-all select-none cursor-pointer"
        aria-label="Menu utilisateur"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div style={popoverStyle}>
            <form action={logout}>
              <button type="submit" className="sidebar-logout-btn">
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
      style={{ background: 'rgba(10, 1, 24, 0.92)', backdropFilter: 'blur(12px)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
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
