'use client'

import { useEffect, type ReactNode } from 'react'

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
