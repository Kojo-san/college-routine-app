'use client'

import type { ReactNode } from 'react'
import { useModalA11y } from '@/lib/useModalA11y'

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  const containerRef = useModalA11y<HTMLDivElement>(open, () => onOpenChange(false))

  if (!open) return null

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
    >
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

export function DialogContent({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={[
        'relative z-10 w-full rounded-xl p-6',
        'bg-bg-elevated border border-border-subtle shadow-2xl',
        className,
      ].join(' ')}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function DialogTitle({ className = '', children }: { className?: string; children?: ReactNode }) {
  return (
    <h2 className={`font-syne font-bold text-[16px] text-text-primary ${className}`}>{children}</h2>
  )
}

export function DialogDescription({ className = '', children }: { className?: string; children?: ReactNode }) {
  return <p className={`text-sm text-text-muted mt-1 ${className}`}>{children}</p>
}

export function DialogFooter({ className = '', children }: { className?: string; children?: ReactNode }) {
  return (
    <div className={`mt-6 flex justify-end gap-2 flex-wrap ${className}`}>{children}</div>
  )
}
