import type { BadgeVariant } from './Badge'
import { Badge } from './Badge'

export type BlocType = 'study' | 'fitness' | 'recovery' | 'task' | 'meal' | 'cours'

const BADGE_VARIANT: Partial<Record<BlocType, BadgeVariant>> = {
  study:    'study',
  fitness:  'fitness',
  recovery: 'recovery',
  cours:    'cours',
}

const GLOW: Record<BlocType, React.CSSProperties> = {
  study:    {
    background: 'rgba(78, 42, 132, 0.4)',
    borderLeft: '3px solid #4E2A84',
    boxShadow: 'var(--glow-study)',
  },
  fitness:  { boxShadow: 'var(--glow-fitness)',  borderLeft: '3px solid var(--color-accent-fit)'   },
  recovery: { boxShadow: 'var(--glow-recovery)', borderLeft: '3px solid var(--color-accent-rec)'   },
  cours:    { boxShadow: 'var(--glow-cours)',     borderLeft: '3px solid var(--color-accent-cours)' },
  task:     { borderLeft: '3px solid rgba(255, 255, 255, 0.15)' },
  meal:     {
    background: 'rgba(201, 0, 107, 0.2)',
    borderLeft: '3px solid #C9006B',
  },
}

const PROGRESS_COLOR: Record<BlocType, string> = {
  study:    'var(--color-accent-study)',
  fitness:  'var(--color-accent-fit)',
  recovery: 'var(--color-accent-rec)',
  cours:    'var(--color-accent-cours)',
  task:     'var(--color-text-muted)',
  meal:     'var(--color-text-muted)',
}

const PROGRESS_GLOW: Record<BlocType, string> = {
  study:    'var(--glow-study-sm)',
  fitness:  'var(--glow-fitness-sm)',
  recovery: 'var(--glow-recovery-sm)',
  cours:    'var(--glow-cours-sm)',
  task:     'none',
  meal:     'none',
}

interface BlocCardProps {
  type: BlocType
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  progress?: number
}

export function BlocCard({ type, startTime, endTime, title, subtitle, progress }: BlocCardProps) {
  const badgeVariant = BADGE_VARIANT[type]

  return (
    <div
      className="bg-bg-surface border border-border-subtle rounded-xl p-3.5 flex flex-col gap-1.5"
      style={GLOW[type]}
    >
      <div className="flex items-center justify-between">
        <span className="font-space-grotesk text-[12px] font-medium text-text-muted tracking-[0.04em]">
          {startTime} → {endTime}
        </span>
        {badgeVariant && <Badge variant={badgeVariant} />}
      </div>

      <p className="font-syne text-[15px] font-bold text-text-primary">{title}</p>

      {subtitle && (
        <p className="font-space-grotesk text-[12px] text-text-muted">{subtitle}</p>
      )}

      {progress !== undefined && (
        <div className="flex items-center gap-2 mt-1">
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--color-border-subtle)' }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression : ${progress}%`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-[400ms]"
              style={{
                width: `${progress}%`,
                backgroundColor: PROGRESS_COLOR[type],
                boxShadow: PROGRESS_GLOW[type],
              }}
            />
          </div>
          <span
            className="font-space-grotesk text-[12px] font-semibold text-text-primary w-7 text-right"
            aria-hidden="true"
          >
            {progress}%
          </span>
        </div>
      )}
    </div>
  )
}
