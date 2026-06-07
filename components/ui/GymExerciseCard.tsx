'use client'

import { useState } from 'react'

type Level = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE'

const LEVEL_BADGE: Record<Level, { label: string; bg: string; color: string }> = {
  DEBUTANT:      { label: 'Débutant',      bg: 'rgba(168,255,120,0.15)', color: '#A8FF78' },
  INTERMEDIAIRE: { label: 'Intermédiaire', bg: 'rgba(74,158,255,0.15)',  color: '#4A9EFF' },
  AVANCE:        { label: 'Avancé',        bg: 'rgba(255,107,157,0.15)', color: '#FF6B9D' },
}

interface Props {
  name: string
  /** muscle group label (Prisma: muscleGroup, ExerciseDB: target) */
  muscleGroup: string
  equipment: string
  /** hex accent color e.g. "#FFD166" */
  accentText: string
  /** rgba accent background e.g. "rgba(255,209,102,0.15)" */
  accentBg: string
  /** Direct GIF URL from ExerciseDB. null shows muscle placeholder icon. */
  gifUrl: string | null
  // ── Prisma-seeded fields (optional when using ExerciseDB) ──────────────────
  sets?: number
  reps?: string
  level?: Level
  description?: string
  // ── ExerciseDB fields ──────────────────────────────────────────────────────
  instructions?: string[]
}

function GifThumbnail({ gifUrl }: { gifUrl: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className="rounded-lg overflow-hidden flex-shrink-0"
      style={{
        width: 80,
        height: 80,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={gifUrl}
        alt=""
        aria-hidden="true"
        width={80}
        height={80}
        loading="lazy"
        className="object-cover w-full h-full"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
    </div>
  )
}

function MuscleIcon() {
  return (
    <div
      className="rounded-lg flex-shrink-0 flex items-center justify-center"
      style={{
        width: 80,
        height: 80,
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border-subtle)',
      }}
      aria-hidden="true"
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3" stroke="#8888AA" strokeWidth="1.5" />
        <path
          d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
          stroke="#8888AA"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function GymExerciseCard({
  name,
  muscleGroup,
  equipment,
  accentText,
  accentBg,
  gifUrl,
  sets,
  reps,
  level,
  description,
  instructions,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  // Content to show in expand panel: instructions (ExerciseDB) or description (Prisma)
  const expandContent =
    instructions && instructions.length > 0
      ? instructions
      : description
        ? [description]
        : null

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        {gifUrl ? <GifThumbnail gifUrl={gifUrl} /> : <MuscleIcon />}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-syne font-bold text-[15px]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {name}
          </p>
          <p
            className="font-space-grotesk text-[12px] mt-0.5 truncate"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {muscleGroup} · {equipment}
          </p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Sets × Reps — only from Prisma seed */}
            {sets != null && reps != null && (
              <span
                className="font-space-grotesk text-[12px] font-semibold px-2 py-0.5 rounded"
                style={{ background: accentBg, color: accentText }}
              >
                {sets} × {reps}
              </span>
            )}

            {/* Level badge — only from Prisma seed */}
            {level && (
              <span
                className="font-space-grotesk text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
                style={{ background: LEVEL_BADGE[level].bg, color: LEVEL_BADGE[level].color }}
              >
                {LEVEL_BADGE[level].label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expand / collapse for description or instructions */}
      {expandContent && (
        <button
          className="w-full text-left mt-3 pt-2"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          <span
            className="font-space-grotesk text-[12px] flex items-center gap-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {expanded ? '▲' : '▼'} {expanded ? 'Masquer' : 'Voir les instructions'}
          </span>

          {expanded && (
            <ol className="mt-2 flex flex-col gap-1">
              {expandContent.map((step, i) => (
                <li
                  key={i}
                  className="font-space-grotesk text-[13px] leading-relaxed"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {expandContent.length > 1 && (
                    <span className="font-semibold mr-1" style={{ color: accentText }}>
                      {i + 1}.
                    </span>
                  )}
                  {step}
                </li>
              ))}
            </ol>
          )}
        </button>
      )}
    </div>
  )
}
