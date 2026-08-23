'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Legacy variants (used by existing app code)
export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

// All variants (includes shadcn-compatible)
type AllVariants = ButtonVariant | 'default' | 'outline' | 'destructive' | 'link' | 'nav'

// Secondary/ghost: transparent bg, subtle border, muted text — used for
// "Annuler"-style dismiss actions across modals and forms.
const GHOST_CLS =
  'bg-transparent border border-white/20 text-white/70 hover:text-white hover:border-white/30'

const VARIANT: Record<string, string> = {
  primary:
    'app-btn-primary',
  default:
    'app-btn-primary',
  secondary:
    GHOST_CLS,
  ghost:
    GHOST_CLS,
  outline:
    'border border-border-subtle bg-transparent text-text-primary hover:bg-bg-elevated',
  destructive:
    'bg-transparent border border-[rgba(255,60,60,0.5)] text-[#ff6b6b] hover:bg-red-500/10',
  link:
    'bg-transparent text-[#C9006B] underline-offset-4 hover:underline',
  // Icon-only navigation controls only (Lucide ChevronLeft/Right — week/month nav).
  nav:
    'bg-transparent border-0 text-white/70 hover:text-white',
}

const SIZE: Record<string, string> = {
  default: 'px-5 py-2.5 min-h-[44px]',
  sm:      'px-3 py-1.5 min-h-[32px] text-xs',
  lg:      'px-8 py-3 min-h-[48px]',
  icon:    'p-2 min-h-[36px] min-w-[36px]',
  nav:     'px-2 py-1 min-h-0',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AllVariants
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'nav'
  children?: ReactNode
  asChild?: boolean
}

export function Button({
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  type = 'button',
  asChild: _asChild,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg',
        'font-space-grotesk text-sm font-semibold cursor-pointer border-0',
        'transition-all duration-150 ease-in-out whitespace-nowrap',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
        'focus-ring',
        VARIANT[variant] ?? VARIANT.primary,
        SIZE[size] ?? SIZE.default,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
