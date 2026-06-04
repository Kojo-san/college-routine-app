'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-study text-bg-base ' +
    '[box-shadow:var(--glow-study)] ' +
    'hover:[box-shadow:0_0_24px_rgba(74,158,255,0.6)] hover:-translate-y-px',
  secondary:
    'bg-transparent text-accent-study border border-accent-study/50 ' +
    'hover:bg-accent-study/8 hover:border-accent-study',
  ghost:
    'bg-transparent text-text-muted hover:text-text-primary',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg',
        'font-space-grotesk text-sm font-semibold cursor-pointer border-0',
        'transition-all duration-150 ease-in-out',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none',
        'focus-ring',
        VARIANT[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
