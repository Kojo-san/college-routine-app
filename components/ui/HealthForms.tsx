'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from './Input'
import { Button } from './Button'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

// ─── Feedback inline ──────────────────────────────────────────────────────────

function StatusBanner({ status, errorMsg }: { status: FormStatus; errorMsg: string }) {
  if (status === 'success') {
    return (
      <p role="status" className="font-space-grotesk text-[13px] text-accent-rec">
        ✓ Données enregistrées
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
        {errorMsg}
      </p>
    )
  }
  return null
}

// ─── SleepForm ────────────────────────────────────────────────────────────────

interface SleepFormProps {
  date?: string  // ISO "YYYY-MM-DD", défaut = aujourd'hui
  onSaved?: () => void
}

export function SleepForm({ date, onSaved }: SleepFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [durationH, setDurationH]     = useState('')
  const [efficiency, setEfficiency]   = useState('')
  const [deepMins, setDeepMins]       = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const sleepDurationHours = parseFloat(durationH)
    const sleepEfficiency    = parseFloat(efficiency) / 100
    const deepSleepMinutes   = parseInt(deepMins, 10)

    if (
      isNaN(sleepDurationHours) || isNaN(sleepEfficiency) || isNaN(deepSleepMinutes) ||
      sleepEfficiency < 0 || sleepEfficiency > 1
    ) {
      setStatus('error')
      setErrorMsg('Tous les champs sont requis et doivent être valides.')
      return
    }

    try {
      const res = await fetch('/api/health/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, sleepDurationHours, sleepEfficiency, deepSleepMinutes }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }
      setStatus('success')
      onSaved?.()
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Durée (heures)"
          type="number"
          min="0"
          max="24"
          step="0.5"
          placeholder="7.5"
          value={durationH}
          onChange={(e) => setDurationH(e.target.value)}
          required
        />
        <Input
          label="Efficacité (%)"
          type="number"
          min="0"
          max="100"
          step="1"
          placeholder="85"
          value={efficiency}
          onChange={(e) => setEfficiency(e.target.value)}
          required
        />
        <Input
          label="Sommeil profond (min)"
          type="number"
          min="0"
          max="300"
          step="5"
          placeholder="90"
          value={deepMins}
          onChange={(e) => setDeepMins(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enregistrement…' : 'Enregistrer le sommeil'}
        </Button>
        <StatusBanner status={status} errorMsg={errorMsg} />
      </div>
    </form>
  )
}

// ─── ActivityForm ─────────────────────────────────────────────────────────────

interface ActivityFormProps {
  date?: string
  onSaved?: () => void
}

export function ActivityForm({ date, onSaved }: ActivityFormProps) {
  const router = useRouter()
  const [status, setStatus]   = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [steps, setSteps]           = useState('')
  const [calories, setCalories]     = useState('')
  const [workout, setWorkout]       = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const parsedSteps    = parseInt(steps, 10)
    const parsedCalories = parseInt(calories, 10)
    const parsedWorkout  = parseInt(workout, 10)

    if (isNaN(parsedSteps) || isNaN(parsedCalories) || isNaN(parsedWorkout)) {
      setStatus('error')
      setErrorMsg('Tous les champs sont requis et doivent être des nombres entiers.')
      return
    }

    try {
      const res = await fetch('/api/health/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          steps: parsedSteps,
          activeCalories: parsedCalories,
          workoutMinutes: parsedWorkout,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }
      setStatus('success')
      onSaved?.()
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Pas"
          type="number"
          min="0"
          max="100000"
          step="100"
          placeholder="8 000"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          required
        />
        <Input
          label="Calories actives"
          type="number"
          min="0"
          max="5000"
          step="10"
          placeholder="400"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          required
        />
        <Input
          label="Entraînement (min)"
          type="number"
          min="0"
          max="600"
          step="5"
          placeholder="45"
          value={workout}
          onChange={(e) => setWorkout(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enregistrement…' : "Enregistrer l'activité"}
        </Button>
        <StatusBanner status={status} errorMsg={errorMsg} />
      </div>
    </form>
  )
}

// ─── HeartRateForm ────────────────────────────────────────────────────────────

interface HeartRateFormProps {
  date?: string
  onSaved?: () => void
}

export function HeartRateForm({ date, onSaved }: HeartRateFormProps) {
  const router = useRouter()
  const [status, setStatus]     = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const [resting, setResting]   = useState('')
  const [average, setAverage]   = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const restingHeartRate = parseInt(resting, 10)
    const averageHeartRate = parseInt(average, 10)

    if (isNaN(restingHeartRate) || isNaN(averageHeartRate)) {
      setStatus('error')
      setErrorMsg('Les deux fréquences cardiaques sont requises.')
      return
    }

    try {
      const res = await fetch('/api/health/heartrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, restingHeartRate, averageHeartRate }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? 'Erreur serveur')
      }
      setStatus('success')
      onSaved?.()
      router.refresh()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="FC repos (bpm)"
          type="number"
          min="30"
          max="200"
          step="1"
          placeholder="60"
          value={resting}
          onChange={(e) => setResting(e.target.value)}
          required
        />
        <Input
          label="FC moyenne (bpm)"
          type="number"
          min="30"
          max="220"
          step="1"
          placeholder="75"
          value={average}
          onChange={(e) => setAverage(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" disabled={status === 'loading'}>
          {status === 'loading' ? 'Enregistrement…' : 'Enregistrer la FC'}
        </Button>
        <StatusBanner status={status} errorMsg={errorMsg} />
      </div>
    </form>
  )
}
