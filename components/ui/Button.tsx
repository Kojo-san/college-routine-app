'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Legacy variants (used by existing app code)
export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

// All variants (includes shadcn-compatible)
type AllVariants = ButtonVariant | 'default' | 'outline' | 'destructive' | 'link'

const VARIANT: Record<string, string> = {
  primary:
    'app-btn-primary',
  default:
    'app-btn-primary',
  secondary:
    'bg-transparent text-[#C9006B] border border-[#C9006B]/50 ' +
    'hover:bg-[#C9006B]/10 hover:border-[#C9006B]',
  ghost:
    'bg-transparent text-text-muted hover:text-text-primary hover:bg-bg-elevated',
  outline:
    'border border-border-subtle bg-transparent text-text-primary hover:bg-bg-elevated',
  destructive:
    'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
  link:
    'bg-transparent text-[#C9006B] underline-offset-4 hover:underline',
}

const SIZE: Record<string, string> = {
  default: 'px-5 py-2.5 min-h-[44px]',
  sm:      'px-3 py-1.5 min-h-[32px] text-xs',
  lg:      'px-8 py-3 min-h-[48px]',
  icon:    'p-2 min-h-[36px] min-w-[36px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AllVariants
  size?: 'default' | 'sm' | 'lg' | 'icon'
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
