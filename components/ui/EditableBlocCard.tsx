'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BlocCard } from './BlocCard'
import type { BlocType } from './BlocCard'

interface EditableBlocCardProps {
  blockId: string
  planId: string
  type: BlocType
  startTime: string
  endTime: string
  title: string
  subtitle?: string
  progress?: number
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EditableBlocCard({
  blockId, planId, type,
  startTime, endTime, title, subtitle, progress,
}: EditableBlocCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [label, setLabel]     = useState(title)
  const [start, setStart]     = useState(startTime)
  const [end, setEnd]         = useState(endTime)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/planning/${planId}/blocks/${blockId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, startTime: start, endTime: end }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Erreur ${res.status}`)
      }
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setLabel(title); setStart(startTime); setEnd(endTime)
    setError(''); setEditing(false)
  }

  if (!editing) {
    return (
      <div className="relative group">
        <BlocCard
          type={type}
          startTime={start}
          endTime={end}
          title={label}
          subtitle={subtitle}
          progress={progress}
        />
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Modifier ce Bloc"
          className={[
            // 44px hit target flush with the card corner, but the visible
            // chip inside stays small (28px) so it doesn't swallow the type
            // badge that renders in the same corner.
            'absolute top-0 right-0',
            'hover-reveal',
            'w-11 h-11 flex items-center justify-center focus-ring rounded',
          ].join(' ')}
        >
          <span className="w-7 h-7 rounded flex items-center justify-center bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary">
            <PencilIcon />
          </span>
        </button>
      </div>
    )
  }

  return (
    <div
      className="bg-bg-surface border border-border-subtle rounded-xl p-3.5 flex flex-col gap-3"
      style={{ borderLeft: '3px solid var(--color-accent-study)' }}
    >
      {/* Heure de début / fin */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="time"
          value={start}
          onChange={e => setStart(e.target.value)}
          aria-label="Heure de début"
          className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 font-space-grotesk text-[13px] text-text-primary focus-ring outline-none"
          style={{ colorScheme: 'dark' }}
        />
        <span className="font-space-grotesk text-[12px] text-text-muted">→</span>
        <input
          type="time"
          value={end}
          onChange={e => setEnd(e.target.value)}
          aria-label="Heure de fin"
          className="bg-bg-elevated border border-border-subtle rounded px-2 py-1.5 font-space-grotesk text-[13px] text-text-primary focus-ring outline-none"
          style={{ colorScheme: 'dark' }}
        />
      </div>

      {/* Label */}
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        aria-label="Titre du Bloc"
        placeholder="Titre du Bloc"
        className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2.5 font-space-grotesk text-[14px] text-text-primary focus-ring outline-none"
      />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={[
            'font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg',
            'transition-all duration-150 focus-ring',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          ].join(' ')}
          style={{
            backgroundColor: 'var(--color-accent-study)',
            color: 'var(--color-bg-base)',
          }}
        >
          {saving ? '…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors duration-150 focus-ring rounded px-2 py-2"
        >
          Annuler
        </button>
        {error && (
          <p role="alert" className="font-space-grotesk text-[12px] ml-auto" style={{ color: 'var(--color-accent-reco)' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
