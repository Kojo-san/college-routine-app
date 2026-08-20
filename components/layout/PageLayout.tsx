import type { ReactNode } from 'react'
import { SidebarNav } from '@/components/ui/sidebar-nav'

interface PageLayoutProps {
  children: ReactNode
  title: string
  etudiantNom?: string
}

export function PageLayout({ children, title, etudiantNom }: PageLayoutProps) {
  return (
    <div className="relative z-[1] min-h-screen bg-transparent">
      <SidebarNav userName={etudiantNom} />

      {/* Zone principale — offset by fixed sidebar width on desktop only;
          the mobile tab bar docks at the bottom instead */}
      <div className="lg:ml-[80px] flex flex-col min-h-screen">

        {/* En-tête de page */}
        <header
          className="px-6 pt-6 pb-5 md:px-10 md:pt-8 md:pb-6 border-b border-white/10 flex-shrink-0"
          style={{ background: 'var(--gradient-header)', backdropFilter: 'blur(8px)' }}
        >
          <h1 className="page-title font-syne forced-colors-h1">
            {title}
          </h1>
        </header>

        {/* Contenu principal — pb-safe-tabbar clears the fixed mobile tab bar */}
        <main className="px-6 py-6 md:px-10 md:py-8 flex-1 pb-safe-tabbar">
          {children}
        </main>

      </div>
    </div>
  )
}
