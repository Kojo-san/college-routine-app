'use client'

import { useState, type FormEvent } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { useModalA11y } from '@/lib/useModalA11y'

interface TaskEditModalProps {
  courseId: string
  taskId: string
  title: string
  description: string | null
  estimatedDurationMinutes: number
  onClose: () => void
  onSaved: () => void
}

export function TaskEditModal({
  courseId, taskId, title: initialTitle, description: initialDescription, estimatedDurationMinutes: initialDuration,
  onClose, onSaved,
}: TaskEditModalProps) {
  const [title, setTitle]           = useState(initialTitle)
  const [description, setDesc]      = useState(initialDescription ?? '')
  const [duration, setDuration]     = useState(String(initialDuration))
  const [status, setStatus]         = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMsg, setErrorMsg]     = useState('')

  const busy = status === 'saving'
  const containerRef = useModalA11y<HTMLDivElement>(true, () => { if (!busy) onClose() })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/cours/${courseId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:                    title.trim(),
          description:              description.trim() || null,
          estimatedDurationMinutes: parseInt(duration, 10) || 30,
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
      aria-labelledby="task-edit-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => { if (!busy) onClose() }}
    >
      <div
        className="w-full max-w-md bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="task-edit-title" className="font-syne text-[18px] font-bold text-text-primary">
          Modifier la tâche
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <Input
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Description (optionnel)"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
          />

          <Input
            label="Durée estimée (min) (optionnel)"
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

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
