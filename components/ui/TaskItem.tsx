'use client'

import { useState } from 'react'
import { Badge } from './Badge'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

const PRIORITY_BADGE: Partial<Record<Priority, { variant: 'warning' | 'success' | 'study'; label: string }>> = {
  HIGH:     { variant: 'warning', label: 'HIGH'     },
  CRITICAL: { variant: 'warning', label: 'CRITIQUE' },
}

interface TaskItemProps {
  id: string
  title: string
  estimatedDurationMinutes: number
  priority: Priority
  defaultCompleted?: boolean
  actions?: React.ReactNode
}

export function TaskItem({ title, estimatedDurationMinutes, priority, defaultCompleted = false, actions }: TaskItemProps) {
  const [completed, setCompleted] = useState(defaultCompleted)
  const badgeConfig = PRIORITY_BADGE[priority]

  return (
    <label className="flex items-center gap-3 py-2.5 border-b border-border-subtle cursor-pointer group last:border-b-0">
      <input
        type="checkbox"
        checked={completed}
        onChange={(e) => setCompleted(e.target.checked)}
        className="sr-only"
      />
      {/* Custom checkbox */}
      <span
        className="w-[18px] h-[18px] rounded flex-shrink-0 border-2 flex items-center justify-center transition-all duration-150"
        style={{
          borderColor:     completed ? 'var(--color-accent-study)' : 'var(--color-border-subtle)',
          backgroundColor: completed ? 'var(--color-accent-study)' : 'transparent',
          boxShadow:       completed ? 'var(--glow-study-sm)' : 'none',
        }}
        aria-hidden="true"
      >
        {completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="#0A0A14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      <span
        className="flex-1 font-space-grotesk text-[14px] transition-colors"
        style={{ color: completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                 textDecoration: completed ? 'line-through' : 'none' }}
      >
        {title}
      </span>

      <div className="flex items-center gap-2 ml-auto">
        {badgeConfig && !completed && (
          <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
        )}
        <span className="font-space-grotesk text-[12px] text-text-muted flex-shrink-0">
          ~{estimatedDurationMinutes} min
        </span>
        {actions}
      </div>
    </label>
  )
}
