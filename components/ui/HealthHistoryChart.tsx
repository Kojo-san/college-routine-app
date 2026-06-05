import type { HealthDaySnapshot } from '@/lib/health'
import { getRecoveryColor, getSleepColor } from '@/lib/health'

interface HealthHistoryChartProps {
  history: HealthDaySnapshot[]
}

const VIEW_W    = 280
const COLS      = 7
const COL_W     = VIEW_W / COLS   // 40
const BAR_W     = 24
const BAR_X_OFF = (COL_W - BAR_W) / 2   // 8
const MAX_BAR_H = 52
const SLEEP_MAX = 10

// Track layout constants
const T1_TITLE_Y = 12
const T1_TOP     = 18
const T1_BOTTOM  = T1_TOP + MAX_BAR_H  // 70
const T2_TITLE_Y = 90
const T2_TOP     = 96
const T2_BOTTOM  = T2_TOP + MAX_BAR_H  // 148
const LABEL_Y    = 164
const VIEW_H     = 170

// 7.5h target line in sleep track
const SLEEP_TARGET_H = (7.5 / SLEEP_MAX) * MAX_BAR_H
const SLEEP_TARGET_Y = T2_BOTTOM - SLEEP_TARGET_H

function RecoveryBar({ snap, col }: { snap: HealthDaySnapshot; col: number }) {
  const x = col * COL_W + BAR_X_OFF
  const color = getRecoveryColor(snap.recovery)
  const isEmpty = snap.recovery === null

  if (isEmpty) {
    return (
      <rect
        x={x} y={T1_TOP} width={BAR_W} height={MAX_BAR_H}
        rx="3"
        fill="none"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    )
  }

  const h = Math.max(4, (snap.recovery! / 100) * MAX_BAR_H)
  const y = T1_BOTTOM - h

  const glowing = snap.recovery! >= 70

  return (
    <rect
      x={x} y={y} width={BAR_W} height={h}
      rx="3"
      fill={color}
      opacity="0.85"
      className={glowing ? 'recovery-bar-glow' : undefined}
    />
  )
}

function SleepBar({ snap, col }: { snap: HealthDaySnapshot; col: number }) {
  const x = col * COL_W + BAR_X_OFF
  const color = getSleepColor(snap.sleepHours)
  const isEmpty = snap.sleepHours === null

  if (isEmpty) {
    return (
      <rect
        x={x} y={T2_TOP} width={BAR_W} height={MAX_BAR_H}
        rx="3"
        fill="none"
        stroke="var(--color-border-subtle)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
    )
  }

  const h = Math.max(4, Math.min(1, snap.sleepHours! / SLEEP_MAX) * MAX_BAR_H)
  const y = T2_BOTTOM - h

  return (
    <rect
      x={x} y={y} width={BAR_W} height={h}
      rx="3"
      fill={color}
      opacity="0.85"
    />
  )
}

export function HealthHistoryChart({ history }: HealthHistoryChartProps) {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        aria-label="Historique santé — 7 jours"
        role="img"
      >
        {/* ── Track labels ── */}
        <text
          x="0" y={T1_TITLE_Y}
          fontSize="9"
          fontWeight="500"
          letterSpacing="0.06em"
          fill="var(--color-text-muted)"
          style={{ fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)', textTransform: 'uppercase' }}
        >
          RÉCUPÉRATION
        </text>

        {/* ── Recovery track background ── */}
        <rect
          x="0" y={T1_TOP} width={VIEW_W} height={MAX_BAR_H}
          rx="4" fill="var(--color-bg-elevated)" opacity="0.6"
        />

        {/* ── Recovery bars ── */}
        {history.map((snap, i) => (
          <RecoveryBar key={i} snap={snap} col={i} />
        ))}

        {/* ── Recovery value labels ── */}
        {history.map((snap, i) => snap.recovery !== null && (
          <text
            key={i}
            x={i * COL_W + COL_W / 2} y={T1_TOP - 3}
            textAnchor="middle"
            fontSize="8"
            fill="var(--color-text-muted)"
            style={{ fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)' }}
          >
            {snap.recovery}
          </text>
        ))}

        {/* ── Sommeil label ── */}
        <text
          x="0" y={T2_TITLE_Y}
          fontSize="9"
          fontWeight="500"
          fill="var(--color-text-muted)"
          style={{ fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)', textTransform: 'uppercase' }}
          letterSpacing="0.06em"
        >
          SOMMEIL
        </text>

        {/* ── Sleep track background ── */}
        <rect
          x="0" y={T2_TOP} width={VIEW_W} height={MAX_BAR_H}
          rx="4" fill="var(--color-bg-elevated)" opacity="0.6"
        />

        {/* ── 7.5h target line ── */}
        <line
          x1="0" y1={SLEEP_TARGET_Y} x2={VIEW_W} y2={SLEEP_TARGET_Y}
          stroke="var(--color-accent-study)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.5"
        />
        <text
          x={VIEW_W - 2} y={SLEEP_TARGET_Y - 2}
          textAnchor="end" fontSize="7"
          fill="var(--color-accent-study)" opacity="0.7"
          style={{ fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)' }}
        >
          7h30
        </text>

        {/* ── Sleep bars ── */}
        {history.map((snap, i) => (
          <SleepBar key={i} snap={snap} col={i} />
        ))}

        {/* ── Sleep value labels ── */}
        {history.map((snap, i) => snap.sleepHours !== null && (
          <text
            key={i}
            x={i * COL_W + COL_W / 2} y={T2_TOP - 3}
            textAnchor="middle" fontSize="8"
            fill="var(--color-text-muted)"
            style={{ fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)' }}
          >
            {snap.sleepHours.toFixed(1)}h
          </text>
        ))}

        {/* ── Day labels ── */}
        {history.map((snap, i) => (
          <text
            key={i}
            x={i * COL_W + COL_W / 2}
            y={LABEL_Y}
            textAnchor="middle"
            fontSize="9"
            fontWeight={snap.isToday ? '700' : '400'}
            fill={snap.isToday ? 'var(--color-accent-study)' : 'var(--color-text-muted)'}
            style={{ fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)' }}
          >
            {snap.dayShort}
          </text>
        ))}
      </svg>
    </div>
  )
}
