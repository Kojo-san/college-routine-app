'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

interface DeadlineFormProps {
  courseId: string
  onClose?: () => void
}

type FormStatus = 'idle' | 'loading' | 'error'

export function DeadlineForm({ courseId, onClose }: DeadlineFormProps) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [title, setTitle]       = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [weight, setWeight]     = useState('')

  function reset() {
    setTitle(''); setDueDate(''); setWeight('')
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
      const res = await fetch(`/api/cours/${courseId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    title.trim(),
          dueDate,
          weight:   parseFloat(weight),
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
        Ajouter une Échéance
      </Button>
    )
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-syne font-bold text-[14px] text-text-primary">Nouvelle Échéance</p>
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
          placeholder="Ex. Examen intra — 30%"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date d'échéance"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
          />
          <Input
            label="Poids (%)"
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="30"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" variant="primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Ajout…' : 'Ajouter l\'Échéance'}
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
