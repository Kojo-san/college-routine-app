export type DeadlineState = 'urgent' | 'normal' | 'done'

interface DeadlineChipProps {
  state: DeadlineState
  label: string
}

const STYLES: Record<DeadlineState, React.CSSProperties> = {
  urgent: {
    background: 'rgba(255, 179, 71, 0.15)',
    color: 'var(--color-warning)',
    border: '1px solid rgba(255, 179, 71, 0.3)',
  },
  normal: {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text-muted)',
    border: '1px solid var(--color-border-subtle)',
  },
  done: {
    background: 'rgba(168, 255, 120, 0.1)',
    color: 'var(--color-accent-rec)',
    border: '1px solid rgba(168, 255, 120, 0.2)',
  },
}

const PREFIX: Record<DeadlineState, string> = {
  urgent: '⚠ ',
  normal: '',
  done:   '✓ ',
}

export function DeadlineChip({ state, label }: DeadlineChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-space-grotesk text-[12px] font-medium"
      style={STYLES[state]}
    >
      {PREFIX[state]}{label}
    </span>
  )
}
