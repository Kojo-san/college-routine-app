import type { HTMLAttributes, ReactNode } from 'react'

// App-specific variants
export type AppBadgeVariant = 'study' | 'fitness' | 'recovery' | 'reco' | 'cours' | 'warning' | 'success'

// shadcn-compatible variants
type ShadcnVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export type BadgeVariant = AppBadgeVariant | ShadcnVariant

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  children?: ReactNode
}

const APP_CONFIG: Record<AppBadgeVariant, { colorVar: string; bgVar: string; label: string }> = {
  study:    { colorVar: 'var(--color-accent-study)', bgVar: 'var(--bg-badge-study)',    label: 'ÉTUDE'    },
  fitness:  { colorVar: 'var(--color-accent-fit)',   bgVar: 'var(--bg-badge-fitness)',  label: 'FITNESS'  },
  recovery: { colorVar: 'var(--color-accent-rec)',   bgVar: 'var(--bg-badge-recovery)', label: 'RÉCUP'    },
  reco:     { colorVar: 'var(--color-accent-reco)',  bgVar: 'var(--bg-badge-reco)',     label: 'RECO'     },
  cours:    { colorVar: 'var(--color-accent-cours)', bgVar: 'var(--bg-badge-cours)',    label: 'COURS'    },
  warning:  { colorVar: 'var(--color-warning)',      bgVar: 'var(--bg-badge-warning)',  label: 'HIGH'     },
  success:  { colorVar: 'var(--color-success)',      bgVar: 'var(--bg-badge-success)',  label: 'COMPLÉTÉ' },
}

const SHADCN_CLASSES: Record<ShadcnVariant, string> = {
  default:     'bg-accent-study text-bg-base',
  secondary:   'bg-bg-elevated text-text-muted border border-border-subtle',
  outline:     'bg-transparent text-text-primary border border-border-subtle',
  destructive: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

const APP_VARIANTS = new Set<string>(['study','fitness','recovery','reco','cours','warning','success'])

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  if (APP_VARIANTS.has(variant as string)) {
    const { colorVar, bgVar, label } = APP_CONFIG[variant as AppBadgeVariant]
    return (
      <span
        className={[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded font-space-grotesk',
          'text-[11px] font-semibold tracking-[0.06em] uppercase',
          className,
        ].join(' ')}
        style={{ color: colorVar, backgroundColor: bgVar }}
        {...props}
      >
        {children ?? label}
      </span>
    )
  }

  // shadcn-compatible variant
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
        SHADCN_CLASSES[variant as ShadcnVariant] ?? SHADCN_CLASSES.default,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}
