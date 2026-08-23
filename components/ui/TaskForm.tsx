'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

interface TaskFormProps {
  courseId: string
  onClose?: () => void
}

type FormStatus = 'idle' | 'loading' | 'error'

export function TaskForm({ courseId, onClose }: TaskFormProps) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [title, setTitle]           = useState('')
  const [description, setDesc]      = useState('')
  const [duration, setDuration]     = useState('30')

  function reset() {
    setTitle(''); setDesc(''); setDuration('30')
    setStatus('idle'); setErrorMsg('')
  }

  function close() {
    reset()
    if (onClose) onClose()
    else setOpen(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/cours/${courseId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:                    title.trim(),
          description:              description.trim() || null,
          estimatedDurationMinutes: parseInt(duration, 10) || 30,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }

      reset()
      if (onClose) onClose()
      else setOpen(false)
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  if (!onClose && !open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Ajouter une Tâche
      </Button>
    )
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-syne font-bold text-[14px] text-text-primary">Nouvelle Tâche</p>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer"
          className="font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors duration-150 focus-ring rounded px-1"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <Input
          label="Titre"
          placeholder="Ex. Faire les exercices du chapitre 3"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Description (optionnel)"
          placeholder="Détails ou contexte"
          value={description}
          onChange={e => setDesc(e.target.value)}
        />

        <Input
          label="Durée estimée (min) (optionnel)"
          type="number"
          min="1"
          placeholder="30"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" variant="primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Ajout…' : 'Ajouter'}
          </Button>
          {status === 'error' && (
            <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
              {errorMsg}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
