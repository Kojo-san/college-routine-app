import type { ReactNode } from 'react'

export type BadgeVariant = 'study' | 'fitness' | 'recovery' | 'reco' | 'cours' | 'warning' | 'success'

const CONFIG: Record<BadgeVariant, { colorVar: string; bgVar: string; label: string }> = {
  study:    { colorVar: 'var(--color-accent-study)', bgVar: 'var(--bg-badge-study)',    label: 'ÉTUDE'    },
  fitness:  { colorVar: 'var(--color-accent-fit)',   bgVar: 'var(--bg-badge-fitness)',  label: 'FITNESS'  },
  recovery: { colorVar: 'var(--color-accent-rec)',   bgVar: 'var(--bg-badge-recovery)', label: 'RÉCUP'    },
  reco:     { colorVar: 'var(--color-accent-reco)',  bgVar: 'var(--bg-badge-reco)',     label: 'RECO'     },
  cours:    { colorVar: 'var(--color-accent-cours)', bgVar: 'var(--bg-badge-cours)',    label: 'COURS'    },
  warning:  { colorVar: 'var(--color-warning)',      bgVar: 'var(--bg-badge-warning)',  label: 'HIGH'     },
  success:  { colorVar: 'var(--color-success)',      bgVar: 'var(--bg-badge-success)',  label: 'COMPLÉTÉ' },
}

interface BadgeProps {
  variant: BadgeVariant
  children?: ReactNode
}

export function Badge({ variant, children }: BadgeProps) {
  const { colorVar, bgVar, label } = CONFIG[variant]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded font-space-grotesk text-[11px] font-semibold tracking-[0.06em] uppercase"
      style={{ color: colorVar, backgroundColor: bgVar }}
    >
      {children ?? label}
    </span>
  )
}
