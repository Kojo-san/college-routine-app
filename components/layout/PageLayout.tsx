import type { ReactNode } from 'react'
import { SidebarNav } from '@/components/ui/sidebar-nav'

interface PageLayoutProps {
  children: ReactNode
  title: string
  etudiantNom?: string
}

export function PageLayout({ children, title, etudiantNom }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-bg-base">
      <SidebarNav userName={etudiantNom} />

      {/* Zone principale — offset by fixed sidebar width */}
      <div className="ml-[80px] flex flex-col min-h-screen">

        {/* En-tête de page */}
        <header
          className="px-6 pt-6 pb-5 md:px-10 md:pt-8 md:pb-6 border-b border-border-subtle flex-shrink-0"
          style={{ background: 'var(--gradient-header)' }}
        >
          <h1
            className="font-syne font-extrabold text-[28px] md:text-[36px] leading-none forced-colors-h1"
            style={{
              backgroundImage: 'var(--gradient-text-h1)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {title}
          </h1>
        </header>

        {/* Contenu principal */}
        <main className="px-6 py-6 md:px-10 md:py-8 flex-1">
          {children}
        </main>

      </div>
    </div>
  )
}
