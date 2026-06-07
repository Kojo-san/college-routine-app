'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { logout } from '@/app/actions/auth'

const NAV = [
  { href: '/',           label: 'Dashboard'  },
  { href: '/planning',   label: 'Planning'   },
  { href: '/academique', label: 'Académique' },
  { href: '/gym',        label: 'Gym'        },
  { href: '/semestre',   label: 'Planification'   },
  { href: '/settings',   label: 'Réglages'   },
]

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

interface SidebarProps {
  etudiantNom?: string
}

export function Sidebar({ etudiantNom = 'Étudiant' }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const logoBlock = (size: number) => (
    <div className="flex items-center gap-2.5">
      <Image
        src="/assets/bear-logo.png"
        alt="College Routine"
        width={size}
        height={size}
        priority
        className="object-contain flex-shrink-0"
      />
      <span className="font-syne font-bold text-[15px] text-text-primary leading-tight">
        College<br />Routine
      </span>
    </div>
  )

  const navContent = (
    <nav className="flex flex-col gap-1 flex-1" aria-label="Navigation principale">
      {NAV.map(({ href, label }) => {
        const isActive = href === '/' ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={[
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg min-h-[44px]',
              'font-space-grotesk text-sm font-medium',
              'transition-all duration-150 focus-ring',
              isActive
                ? 'border-l-2 border-accent-study text-accent-study'
                : 'text-text-muted hover:bg-bg-surface hover:text-text-primary',
            ].join(' ')}
            style={isActive ? { background: 'var(--bg-nav-active)' } : undefined}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )

  const etudiantBlock = (
    <div className="flex flex-col gap-2 pt-4 border-t border-border-subtle">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <span className="font-space-grotesk text-[12px] font-semibold text-text-muted">
            {etudiantNom.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="font-space-grotesk text-sm font-medium text-text-primary truncate">
          {etudiantNom}
        </span>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="w-full text-left font-space-grotesk text-[12px] text-text-muted hover:text-accent-reco transition-colors px-1 py-0.5 focus-ring rounded"
        >
          Déconnexion
        </button>
      </form>
    </div>
  )

  return (
    <>
      {/* ── Barre mobile (lg:hidden) ─────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-bg-base border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/bear-logo.png"
            alt="College Routine"
            width={28}
            height={28}
            priority
            className="object-contain"
          />
          <span className="font-syne font-bold text-[14px] text-text-primary">
            College Routine
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
          aria-controls="sidebar-panel"
          className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors focus-ring"
        >
          {mobileOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* ── Backdrop mobile ───────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Panneau sidebar ───────────────────────────────────── */}
      <aside
        id="sidebar-panel"
        className={[
          /* Position */
          'fixed inset-y-0 left-0 z-50',
          'lg:sticky lg:top-0 lg:z-auto lg:h-screen',
          /* Dimensions & style */
          'w-[220px] bg-bg-base border-r border-border-subtle',
          'px-4 py-6 flex flex-col overflow-y-auto',
          /* Transition — annulée si prefers-reduced-motion (voir globals.css) */
          'transition-transform duration-[200ms] ease-out',
          /* Visibilité */
          'lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Logo desktop */}
        <div className="hidden lg:block mb-8">
          {logoBlock(32)}
        </div>

        {/* Logo mobile (dans le drawer) */}
        <div className="lg:hidden mb-8">
          {logoBlock(32)}
        </div>

        {navContent}
        {etudiantBlock}
      </aside>
    </>
  )
}
