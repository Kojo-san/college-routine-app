'use client'

import { useState, useEffect } from 'react'
import { calcNowLinePercent } from '@/lib/timeline'

interface TimelineNowLineProps {
  startHour: number
  endHour: number
  nowMinutes?: number
}

function getCurrentMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export function TimelineNowLine({ startHour, endHour, nowMinutes: nowMinutesProp }: TimelineNowLineProps) {
  const [nowMinutes, setNowMinutes] = useState(() => nowMinutesProp ?? getCurrentMinutes())

  useEffect(() => {
    if (nowMinutesProp !== undefined) return
    const interval = setInterval(() => setNowMinutes(getCurrentMinutes()), 60_000)
    return () => clearInterval(interval)
  }, [nowMinutesProp])

  const startMinutes = startHour * 60
  const endMinutes = endHour * 60

  if (nowMinutes <= startMinutes || nowMinutes >= endMinutes) return null

  const percent = calcNowLinePercent(nowMinutes, startMinutes, endMinutes)

  return (
    <div
      data-testid="timeline-now"
      className="absolute left-0 right-0 pointer-events-none"
      style={{ top: `${percent}%` }}
      aria-label="Heure courante"
      aria-hidden="true"
    >
      <div
        className="relative h-0.5"
        style={{ background: 'var(--color-accent-reco)', boxShadow: 'var(--glow-reco-sm)' }}
      >
        <div
          className="absolute top-1/2 left-12 -translate-y-1/2 w-2.5 h-2.5 rounded-full"
          style={{ background: 'var(--color-accent-reco)', boxShadow: 'var(--glow-reco)' }}
        />
      </div>
    </div>
  )
}
