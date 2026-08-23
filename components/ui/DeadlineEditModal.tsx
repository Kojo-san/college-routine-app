'use client'

import { useState, type FormEvent } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { useModalA11y } from '@/lib/useModalA11y'

interface DeadlineEditModalProps {
  courseId: string
  deadlineId: string
  title: string
  dueDate: Date
  weight: number | null
  onClose: () => void
  onSaved: () => void
}

function dateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DeadlineEditModal({ courseId, deadlineId, title: initialTitle, dueDate, weight: initialWeight, onClose, onSaved }: DeadlineEditModalProps) {
  const [title, setTitle]     = useState(initialTitle)
  const [due, setDue]         = useState(dateInputValue(dueDate))
  const [weight, setWeight]   = useState(initialWeight != null ? String(initialWeight) : '')
  const [status, setStatus]   = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const busy = status === 'saving'
  const containerRef = useModalA11y<HTMLDivElement>(true, () => { if (!busy) onClose() })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/cours/${courseId}/deadlines/${deadlineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:   title.trim(),
          dueDate: due,
          weight:  weight.trim() ? parseFloat(weight) : null,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Erreur serveur')
      }

      onSaved()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deadline-edit-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => { if (!busy) onClose() }}
    >
      <div
        className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="deadline-edit-title" className="font-syne text-[18px] font-bold text-text-primary">
          Modifier l&apos;échéance
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <Input
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date d'échéance"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              required
            />
            <Input
              label="Poids (%) (optionnel)"
              type="number"
              min="0"
              max="100"
              step="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {status === 'error' && (
            <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={busy}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
