'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

interface DeadlineFormProps {
  courseId: string
}

type FormStatus = 'idle' | 'loading' | 'error'

export function DeadlineForm({ courseId }: DeadlineFormProps) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [title, setTitle]       = useState('')
  const [dueDate, setDueDate]   = useState('')
  const [weight, setWeight]     = useState('')
  const [priority, setPriority] = useState('MEDIUM')

  function reset() {
    setTitle(''); setDueDate(''); setWeight(''); setPriority('MEDIUM')
    setStatus('idle'); setErrorMsg('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/academique/${courseId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    title.trim(),
          dueDate,
          weight:   parseFloat(weight),
          priority,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }

      reset()
      setOpen(false)
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  if (!open) {
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
          onClick={() => { setOpen(false); reset() }}
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="deadline-priority"
            className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]"
          >
            Priorité
          </label>
          <select
            id="deadline-priority"
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2.5 font-space-grotesk text-[14px] text-text-primary focus-ring outline-none"
            style={{ colorScheme: 'dark' }}
          >
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
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
