'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

type GoalType = 'ACADEMIC' | 'FITNESS'
type FormStatus = 'idle' | 'loading' | 'success' | 'error'

export function ObjectifForm() {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Common fields
  const [type, setType]               = useState<GoalType>('ACADEMIC')
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('MEDIUM')
  const [targetDate, setTargetDate]   = useState('')

  // Academic-specific
  const [targetGpa, setTargetGpa]     = useState('')
  const [targetGrade, setTargetGrade] = useState('')

  // Fitness-specific
  const [targetWeight, setTargetWeight]     = useState('')
  const [targetBodyFat, setTargetBodyFat]   = useState('')
  const [targetStrength, setTargetStrength] = useState('')

  function reset() {
    setTitle(''); setDescription(''); setPriority('MEDIUM'); setTargetDate('')
    setTargetGpa(''); setTargetGrade(''); setTargetWeight(''); setTargetBodyFat(''); setTargetStrength('')
    setStatus('idle'); setErrorMsg('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const body: Record<string, unknown> = {
      type,
      title,
      description: description || null,
      priority,
      targetDate: targetDate || null,
    }

    if (type === 'ACADEMIC') {
      if (targetGpa)   body.targetGpa   = parseFloat(targetGpa)
      if (targetGrade) body.targetGrade = targetGrade
    } else {
      if (targetWeight)   body.targetWeight   = parseFloat(targetWeight)
      if (targetBodyFat)  body.targetBodyFat  = parseFloat(targetBodyFat)
      if (targetStrength) body.targetStrength = targetStrength
    }

    try {
      const res = await fetch('/api/objectifs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }

      setStatus('success')
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
        Créer un Objectif
      </Button>
    )
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="font-syne font-bold text-[15px] text-text-primary">Nouvel Objectif</p>
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          aria-label="Fermer le formulaire"
          className="font-space-grotesk text-[13px] text-text-muted hover:text-text-primary transition-colors focus-ring rounded px-1"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

        {/* Type */}
        <fieldset>
          <legend className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em] mb-2">
            Type
          </legend>
          <div className="flex gap-3">
            {(['ACADEMIC', 'FITNESS'] as GoalType[]).map(t => (
              <label
                key={t}
                className="flex items-center gap-2 cursor-pointer focus-within:outline-none"
              >
                <input
                  type="radio"
                  name="goal-type"
                  value={t}
                  checked={type === t}
                  onChange={() => setType(t)}
                  className="accent-[var(--color-accent-study)] w-3.5 h-3.5 cursor-pointer"
                />
                <span className="font-space-grotesk text-[13px] text-text-primary">
                  {t === 'ACADEMIC' ? 'Académique' : 'Fitness'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Title */}
        <Input
          label="Titre"
          placeholder={type === 'ACADEMIC' ? 'Ex. Atteindre 3.5 de GPA' : 'Ex. Perdre 5 kg'}
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        {/* Description */}
        <Input
          label="Description (optionnel)"
          placeholder="Contexte ou détails supplémentaires"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* Priority + Target date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="goal-priority"
              className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]"
            >
              Priorité
            </label>
            <select
              id="goal-priority"
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
          <Input
            label="Échéance (optionnel)"
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
          />
        </div>

        {/* Type-specific fields */}
        {type === 'ACADEMIC' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="GPA cible (optionnel)"
              type="number"
              min="0"
              max="4"
              step="0.01"
              placeholder="3.50"
              value={targetGpa}
              onChange={e => setTargetGpa(e.target.value)}
            />
            <Input
              label="Note cible (optionnel)"
              placeholder="A+"
              value={targetGrade}
              onChange={e => setTargetGrade(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Poids cible kg (optionnel)"
              type="number"
              min="0"
              step="0.5"
              placeholder="75.0"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
            />
            <Input
              label="Masse grasse % (optionnel)"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="18.0"
              value={targetBodyFat}
              onChange={e => setTargetBodyFat(e.target.value)}
            />
            <Input
              label="Force cible (optionnel)"
              placeholder="Squat 100 kg"
              value={targetStrength}
              onChange={e => setTargetStrength(e.target.value)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" variant="primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Enregistrement…' : 'Créer l\'Objectif'}
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
