export type GaugeAccent = 'study' | 'fitness' | 'recovery' | 'reco'

const FILL_COLOR: Record<GaugeAccent, string> = {
  study:    'var(--color-accent-study)',
  fitness:  'var(--color-accent-fit)',
  recovery: 'var(--color-accent-rec)',
  reco:     'var(--color-accent-reco)',
}

const FILL_GLOW: Record<GaugeAccent, string> = {
  study:    'var(--glow-study-sm)',
  fitness:  'var(--glow-fitness-sm)',
  recovery: 'var(--glow-recovery-sm)',
  reco:     'var(--glow-reco-sm)',
}

interface ScoreGaugeProps {
  value: number
  accent: GaugeAccent
  label: string
}

export function ScoreGauge({ value, accent, label }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: 'var(--color-border-subtle)' }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} : ${clamped}`}
      >
        <div
          data-testid="gauge-fill"
          className="h-full rounded-full transition-[width] duration-[400ms]"
          style={{
            width: `${clamped}%`,
            backgroundColor: FILL_COLOR[accent],
            boxShadow: FILL_GLOW[accent],
          }}
        />
      </div>
      <span
        className="font-space-grotesk text-[13px] font-semibold text-text-primary w-7 text-right"
        aria-hidden="true"
      >
        {clamped}
      </span>
    </div>
  )
}
