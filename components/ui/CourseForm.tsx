'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

type FormStatus = 'idle' | 'loading' | 'error'

interface CourseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseForm({ open, onOpenChange }: CourseFormProps) {
  const router = useRouter()
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [code, setCode]                 = useState('')
  const [name, setName]                 = useState('')
  const [courseHours, setCourseHours]   = useState('3')
  const [labHours, setLabHours]         = useState('2')
  const [personalHours, setPersonalHours] = useState(5)

  function reset() {
    setCode(''); setName('')
    setCourseHours('3'); setLabHours('2'); setPersonalHours(5)
    setStatus('idle'); setErrorMsg('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/cours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code:         code.trim().toUpperCase(),
          name:         name.trim(),
          courseHours:  parseInt(courseHours, 10) || 0,
          labHours:     parseInt(labHours, 10) || 0,
          personalHours,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }

      reset()
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  if (!open) return null

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="font-syne font-bold text-[15px] text-text-primary">Nouveau Cours</p>
        <button
          type="button"
          onClick={() => { onOpenChange(false); reset() }}
          aria-label="Fermer le formulaire"
          className="font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors duration-150 focus-ring rounded px-1"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

        <Input
          label="Code"
          placeholder="Ex. MTH1102"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          required
          autoFocus
        />

        <Input
          label="Nom du cours"
          placeholder="Ex. Algèbre Linéaire"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        {/* ── Triplet horaire ── */}
        <div className="flex flex-col gap-2">
          <span className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]">
            Triplet horaire (Cours – Lab – Travail personnel)
          </span>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Cours / sem."
              type="number"
              min="0"
              step="1"
              placeholder="3"
              value={courseHours}
              onChange={e => setCourseHours(e.target.value)}
            />
            <Input
              label="Lab / sem."
              type="number"
              min="0"
              step="1"
              placeholder="2"
              value={labHours}
              onChange={e => setLabHours(e.target.value)}
            />

            {/* Travail perso: slider + number display */}
            <div className="flex flex-col gap-1.5">
              <label className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]">
                Perso / sem.
              </label>
              <div className="flex items-center gap-2 h-[42px]">
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={personalHours}
                  onChange={e => setPersonalHours(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-accent-study)] cursor-pointer"
                  aria-label="Heures de travail perso par semaine"
                />
                <span className="font-space-grotesk text-[14px] font-bold text-text-primary w-5 text-right tabular-nums">
                  {personalHours}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Enregistrement…' : 'Ajouter le cours'}
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
