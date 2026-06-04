'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

type FormStatus = 'idle' | 'loading' | 'error'

export function CourseForm() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [code, setCode]         = useState('')
  const [name, setName]         = useState('')
  const [difficulty, setDiff]   = useState('3')
  const [workload, setWorkload] = useState('3')

  function reset() {
    setCode(''); setName(''); setDiff('3'); setWorkload('3')
    setStatus('idle'); setErrorMsg('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/academique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code:                    code.trim().toUpperCase(),
          name:                    name.trim(),
          difficultyLevel:         parseInt(difficulty, 10),
          estimatedWeeklyWorkload: parseFloat(workload) || 3,
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
        Créer un Cours
      </Button>
    )
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="font-syne font-bold text-[15px] text-text-primary">Nouveau Cours</p>
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          aria-label="Fermer le formulaire"
          className="font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors duration-150 focus-ring rounded px-1"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <Input
            label="Code"
            placeholder="Ex. MTH1102"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            required
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="course-difficulty"
              className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]"
            >
              Difficulté
            </label>
            <select
              id="course-difficulty"
              value={difficulty}
              onChange={e => setDiff(e.target.value)}
              className="bg-bg-elevated border border-border-subtle rounded-lg px-3 py-2.5 font-space-grotesk text-[14px] text-text-primary focus-ring outline-none min-w-[80px]"
              style={{ colorScheme: 'dark' }}
            >
              {[1, 2, 3, 4, 5].map(d => (
                <option key={d} value={d}>{d} / 5</option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Nom du cours"
          placeholder="Ex. Algèbre Linéaire"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <Input
          label="Charge / semaine (h)"
          type="number"
          min="0"
          step="0.5"
          placeholder="3.0"
          value={workload}
          onChange={e => setWorkload(e.target.value)}
        />

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Enregistrement…' : 'Créer le Cours'}
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
