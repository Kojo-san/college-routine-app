'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Level = 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE'

const LEVEL_BADGE: Record<Level, { label: string; bg: string; color: string }> = {
  DEBUTANT:      { label: 'Débutant',      bg: 'rgba(168,255,120,0.15)', color: '#A8FF78' },
  INTERMEDIAIRE: { label: 'Intermédiaire', bg: 'rgba(74,158,255,0.15)',  color: '#4A9EFF' },
  AVANCE:        { label: 'Avancé',        bg: 'rgba(255,107,157,0.15)', color: '#FF6B9D' },
}

interface Props {
  name: string
  muscleGroup: string
  equipment: string
  sets: number
  reps: string
  level: Level
  description: string
  exerciseDbId: string | null
  /** hex color e.g. "#FFD166" */
  accentText: string
  /** rgba bg e.g. "rgba(255,209,102,0.15)" */
  accentBg: string
}

function GifLoader({ exerciseDbId }: { exerciseDbId: string }) {
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          fetch(`/api/gym/gif/${encodeURIComponent(exerciseDbId)}`)
            .then(r => r.json())
            .then((d: { gifUrl: string | null }) => setGifUrl(d.gifUrl))
            .catch(() => setGifUrl(null))
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [exerciseDbId])

  return (
    <div
      ref={ref}
      className="rounded-lg overflow-hidden flex-shrink-0"
      style={{ width: 80, height: 80, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
    >
      {gifUrl ? (
        <img
          src={gifUrl}
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          className="object-cover w-full h-full"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="8" r="3" stroke="#8888AA" strokeWidth="1.5" />
            <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#8888AA" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  )
}

export function GymExerciseCard({
  name,
  muscleGroup,
  equipment,
  sets,
  reps,
  level,
  description,
  exerciseDbId,
  accentText,
  accentBg,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const badge = LEVEL_BADGE[level]

  return (
    <div
      className="rounded-xl p-4 transition-all duration-150"
      style={{
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex gap-3">
        {/* GIF thumbnail */}
        {exerciseDbId ? (
          <GifLoader exerciseDbId={exerciseDbId} />
        ) : (
          <div
            className="rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{ width: 80, height: 80, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)' }}
            aria-hidden="true"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3" stroke="#8888AA" strokeWidth="1.5" />
              <path d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#8888AA" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-syne font-bold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>
            {name}
          </p>
          <p className="font-space-grotesk text-[12px] mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
            {muscleGroup} · {equipment}
          </p>

          {/* Sets × Reps badge */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="font-space-grotesk text-[12px] font-semibold px-2 py-0.5 rounded"
              style={{ background: accentBg, color: accentText }}
            >
              {sets} × {reps}
            </span>
            <span
              className="font-space-grotesk text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Description (expand on click) */}
      <button
        className="w-full text-left mt-3 pt-2"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <span className="font-space-grotesk text-[12px] flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
          {expanded ? '▲' : '▼'} {expanded ? 'Masquer' : 'Voir la description'}
        </span>
        {expanded && (
          <p className="font-space-grotesk text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
            {description}
          </p>
        )}
      </button>
    </div>
  )
}
