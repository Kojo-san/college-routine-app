'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { GridSlot } from '@/lib/semester'
import { extractTriplet, buildGridSlots } from '@/lib/semester'
import type { ScheduleSlot } from '@/lib/schedule'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseData {
  id: string
  code: string
  name: string
  currentHours: number
  schedules: GridSlot[]
}

interface GymPrefsData {
  frequencyPerWeek: number
  sessionDurationMinutes: number
  preferredDays: number[]
  preferredTime: 'matin' | 'après-midi' | 'soir'
}

interface SemesterSetupFormProps {
  courses: CourseData[]
  wakeTime: string
  sleepTime: string
  gymPrefs: GymPrefsData
  gridSlots: GridSlot[]
}

interface ExtractionSummary {
  schedulesCount: number
  evaluationsCount: number
  triplet: { lecture: number; lab: number; personal: number } | null
}

// ─── Visual grid (7h→22h, Lun→Ven) ───────────────────────────────────────────

const GRID_START = 7
const GRID_END   = 22
const DAYS_FR    = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']

function ScheduleGrid({ slots }: { slots: GridSlot[] }) {
  const hours = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => GRID_START + i)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)' }}
    >
      {/* Header */}
      <div className="grid gap-0" style={{ gridTemplateColumns: '44px repeat(5, 1fr)' }}>
        <div />
        {DAYS_FR.map(d => (
          <div
            key={d}
            className="font-space-grotesk text-[11px] font-semibold uppercase tracking-widest text-center py-2"
            style={{ color: 'var(--color-text-muted)', borderLeft: '1px solid var(--color-border-subtle)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid body */}
      <div className="relative" style={{ gridTemplateColumns: '44px repeat(5, 1fr)' }}>
        {/* Hour labels + dividers */}
        {hours.map(h => (
          <div
            key={h}
            className="flex"
            style={{ height: '32px', borderTop: '1px solid var(--color-border-subtle)' }}
          >
            <div
              className="font-space-grotesk text-[10px] flex items-start justify-end pr-2 pt-0.5 flex-shrink-0"
              style={{ width: '44px', color: 'var(--color-text-muted)' }}
            >
              {h}h
            </div>
            {DAYS_FR.map((_, col) => (
              <div
                key={col}
                style={{
                  flex: 1,
                  borderLeft: '1px solid var(--color-border-subtle)',
                  height: '32px',
                }}
              />
            ))}
          </div>
        ))}

        {/* Course blocks overlay */}
        <div
          className="absolute inset-0"
          style={{ left: '44px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', pointerEvents: 'none' }}
        >
          {slots.map((slot, i) => (
            <div
              key={i}
              style={{
                gridColumn: slot.colIndex + 1,
                position: 'absolute',
                left: `${(slot.colIndex / 5) * 100}%`,
                width: `${(1 / 5) * 100}%`,
                top: `${slot.topPct}%`,
                height: `${slot.heightPct}%`,
                padding: '2px 4px',
              }}
            >
              <div
                className="h-full rounded flex items-center justify-center"
                style={{
                  background: slot.type === 'COURS'
                    ? 'rgba(155,143,255,0.25)'
                    : 'rgba(74,158,255,0.2)',
                  border: `1px solid ${slot.type === 'COURS' ? '#9B8FFF' : '#4A9EFF'}`,
                }}
              >
                <span
                  className="font-space-grotesk font-semibold text-[9px] uppercase tracking-wider text-center leading-tight"
                  style={{ color: slot.type === 'COURS' ? '#9B8FFF' : '#4A9EFF' }}
                >
                  {slot.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Per-course card ──────────────────────────────────────────────────────────

function CourseSetupCard({ course, onUpdate }: {
  course: CourseData
  onUpdate: (id: string, hours: number, scheduleText: string, newSlots?: GridSlot[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [hours, setHours] = useState(course.currentHours)
  const [scheduleText, setScheduleText] = useState('')
  const [triplet, setTriplet] = useState<{ lecture: number; lab: number; personal: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [extractionSummary, setExtractionSummary] = useState<ExtractionSummary | null>(null)
  const [extractionError, setExtractionError] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) return
    setLoading(true)
    setExtractionSummary(null)
    setExtractionError(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/academique/${course.id}/import-syllabus`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        setExtractionError(true)
        return
      }

      const text: string = json.scheduleText ?? ''
      const t = extractTriplet(text)
      if (t) {
        setTriplet(t)
        setHours(t.personal)
        setScheduleText(text)
      }

      const schedulesCount: number = json.data?.schedulesExtracted ?? json.schedules?.length ?? 0
      const evaluationsCount: number = json.data?.evaluationsExtracted ?? 0
      setExtractionSummary({ schedulesCount, evaluationsCount, triplet: t })

      // Build grid slots and notify parent to refresh
      const newSlots: ScheduleSlot[] = Array.isArray(json.schedules) ? json.schedules : []
      const newGridSlots = newSlots.length > 0
        ? buildGridSlots(newSlots, GRID_START, GRID_END)
        : undefined
      onUpdate(course.id, t?.personal ?? hours, text, newGridSlots)
    } catch {
      setExtractionError(true)
    } finally {
      setLoading(false)
    }
  }

  async function save() {
    setSaved(false)
    await fetch('/api/semestre/cours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id, scheduleText, personalHoursPerWeek: hours }),
    })
    setSaved(true)
    onUpdate(course.id, hours, scheduleText)
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-4"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-space-grotesk text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            {course.code}
          </p>
          <p className="font-syne font-bold text-[15px] mt-0.5 truncate" style={{ color: 'var(--color-text-primary)' }}>
            {course.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="cursor-pointer font-space-grotesk text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 whitespace-nowrap flex-shrink-0"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-accent-study)',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Extraction…' : 'Importer le plan de cours (PDF)'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          aria-hidden="true"
        />
      </div>

      {/* PDF import description */}
      <p className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)', marginTop: '-8px' }}>
        Claude extraira les horaires, examens et le triplet horaire automatiquement.
      </p>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-1">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ background: 'var(--color-accent-study)' }}
          />
          <span className="font-space-grotesk text-[12px]" style={{ color: 'var(--color-accent-study)' }}>
            Analyse du PDF en cours…
          </span>
        </div>
      )}

      {/* Extraction error */}
      {extractionError && (
        <div
          className="rounded-lg px-3 py-2 font-space-grotesk text-[12px]"
          style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.25)', color: '#FF6B9D' }}
        >
          Impossible de lire le fichier — vérifiez que c'est un PDF valide.
        </div>
      )}

      {/* Extraction summary */}
      {extractionSummary && !loading && (
        <div
          className="rounded-lg px-3 py-2 flex flex-col gap-1"
          style={{ background: 'rgba(168,255,120,0.07)', border: '1px solid rgba(168,255,120,0.2)' }}
        >
          <p className="font-space-grotesk text-[12px] font-semibold" style={{ color: '#A8FF78' }}>
            Extraction réussie
          </p>
          <div className="flex gap-4 flex-wrap">
            <span className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {extractionSummary.schedulesCount} créneau{extractionSummary.schedulesCount !== 1 ? 'x' : ''} détecté{extractionSummary.schedulesCount !== 1 ? 's' : ''}
            </span>
            <span className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {extractionSummary.evaluationsCount} évaluation{extractionSummary.evaluationsCount !== 1 ? 's' : ''}
            </span>
            {extractionSummary.triplet && (
              <span className="font-space-grotesk text-[11px] font-semibold" style={{ color: '#4A9EFF' }}>
                Triplet {extractionSummary.triplet.lecture}-{extractionSummary.triplet.lab}-{extractionSummary.triplet.personal}
              </span>
            )}
          </div>
          <p className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Ajuste manuellement si besoin.
          </p>
        </div>
      )}

      {/* Triplet display */}
      {triplet && (
        <div className="flex gap-3">
          {(['Cours', 'Lab', 'Perso'] as const).map((label, idx) => {
            const val = [triplet.lecture, triplet.lab, triplet.personal][idx]
            return (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="font-syne font-bold text-[16px]" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
                <span className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Hours slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="font-space-grotesk text-[12px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Heures perso / semaine
          </label>
          <span className="font-syne font-bold text-[15px]" style={{ color: 'var(--color-accent-study)' }}>
            {hours}h
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          step={0.5}
          value={hours}
          onChange={e => setHours(parseFloat(e.target.value))}
          className="w-full cursor-pointer accent-[#4A9EFF]"
          aria-label={`Heures personnelles par semaine pour ${course.name}`}
        />
        <div className="flex justify-between">
          <span className="font-space-grotesk text-[10px]" style={{ color: 'var(--color-text-muted)' }}>0h</span>
          <span className="font-space-grotesk text-[10px]" style={{ color: 'var(--color-text-muted)' }}>20h</span>
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="cursor-pointer self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : 'var(--color-accent-study)',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
        }}
      >
        {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
      </button>
    </div>
  )
}

// ─── Session schedule import ──────────────────────────────────────────────────

interface SessionImportResult {
  matched: number
  total: number
  unmatched: string[]
}

function SessionScheduleImport({ onSlotsReady }: { onSlotsReady: (slots: GridSlot[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SessionImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) return
    setLoading(true)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/semestre/import-horaire', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Erreur inconnue')
        return
      }

      setResult({ matched: json.matched, total: json.total, unmatched: json.unmatched ?? [] })

      if (Array.isArray(json.slots) && json.slots.length > 0) {
        onSlotsReady(buildGridSlots(json.slots, GRID_START, GRID_END))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-syne font-bold text-[16px]" style={{ color: 'var(--color-text-primary)' }}>
            Horaire de session
          </p>
          <p className="font-space-grotesk text-[12px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Importe ton horaire officiel Polytechnique pour remplir automatiquement la grille.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="cursor-pointer font-space-grotesk text-[12px] font-semibold px-4 py-2 rounded-lg transition-all duration-150 whitespace-nowrap"
          style={{
            background: 'rgba(155,143,255,0.12)',
            border: '1px solid rgba(155,143,255,0.35)',
            color: '#9B8FFF',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Extraction…' : 'Importer mon horaire Polytechnique (PDF)'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          aria-hidden="true"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: '#9B8FFF' }} />
          <span className="font-space-grotesk text-[12px]" style={{ color: '#9B8FFF' }}>
            Claude analyse ton horaire…
          </span>
        </div>
      )}

      {error && (
        <div
          className="rounded-lg px-3 py-2.5 font-space-grotesk text-[12px]"
          style={{ background: 'rgba(255,107,157,0.08)', border: '1px solid rgba(255,107,157,0.2)', color: '#FF6B9D' }}
        >
          <span className="font-semibold">Erreur</span> — {error}
        </div>
      )}

      {result && !loading && (
        <div
          className="rounded-lg px-3 py-2.5 flex flex-col gap-1"
          style={{ background: 'rgba(168,255,120,0.06)', border: '1px solid rgba(168,255,120,0.18)' }}
        >
          <p className="font-space-grotesk text-[12px] font-semibold" style={{ color: '#A8FF78' }}>
            {result.matched} cours placés sur {result.total}
          </p>
          {result.unmatched.length > 0 && (
            <p className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              Non reconnus : {result.unmatched.join(', ')} — ajoute ces cours dans la section Académique d'abord.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Gym preferences form ──────────────────────────────────────────────────────

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function GymPrefsForm({ initial }: { initial: GymPrefsData }) {
  const [prefs, setPrefs] = useState<GymPrefsData>(initial)
  const [saved, setSaved] = useState(false)

  function toggleDay(dow: number) {
    setPrefs(p => ({
      ...p,
      preferredDays: p.preferredDays.includes(dow)
        ? p.preferredDays.filter(d => d !== dow)
        : [...p.preferredDays, dow],
    }))
  }

  async function save() {
    setSaved(false)
    await fetch('/api/gym-prefs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    })
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Frequency */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="gym-freq"
            className="font-space-grotesk text-[12px] uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Séances / semaine
          </label>
          <span className="font-syne font-bold text-[15px]" style={{ color: '#FFD166' }}>
            {prefs.frequencyPerWeek}×
          </span>
        </div>
        <input
          id="gym-freq"
          type="range"
          min={1}
          max={7}
          step={1}
          value={prefs.frequencyPerWeek}
          onChange={e => setPrefs(p => ({ ...p, frequencyPerWeek: parseInt(e.target.value) }))}
          className="w-full cursor-pointer accent-[#FFD166]"
          aria-label="Nombre de séances de gym par semaine"
        />
        <div className="flex justify-between">
          <span className="font-space-grotesk text-[10px]" style={{ color: 'var(--color-text-muted)' }}>1×</span>
          <span className="font-space-grotesk text-[10px]" style={{ color: 'var(--color-text-muted)' }}>7×</span>
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="gym-duration"
            className="font-space-grotesk text-[12px] uppercase tracking-wider"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Durée séance
          </label>
          <span className="font-syne font-bold text-[15px]" style={{ color: '#FFD166' }}>
            {prefs.sessionDurationMinutes} min
          </span>
        </div>
        <input
          id="gym-duration"
          type="range"
          min={30}
          max={120}
          step={15}
          value={prefs.sessionDurationMinutes}
          onChange={e => setPrefs(p => ({ ...p, sessionDurationMinutes: parseInt(e.target.value) }))}
          className="w-full cursor-pointer accent-[#FFD166]"
          aria-label="Durée de la séance de gym en minutes"
        />
        <div className="flex justify-between">
          <span className="font-space-grotesk text-[10px]" style={{ color: 'var(--color-text-muted)' }}>30 min</span>
          <span className="font-space-grotesk text-[10px]" style={{ color: 'var(--color-text-muted)' }}>120 min</span>
        </div>
      </div>

      {/* Preferred days */}
      <div className="flex flex-col gap-2">
        <p className="font-space-grotesk text-[12px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Jours préférés
        </p>
        <div className="flex gap-2 flex-wrap">
          {DAY_LABELS.map((label, dow) => {
            const active = prefs.preferredDays.includes(dow)
            return (
              <button
                key={dow}
                type="button"
                onClick={() => toggleDay(dow)}
                className="cursor-pointer font-space-grotesk text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  background: active ? 'rgba(255,209,102,0.15)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${active ? 'rgba(255,209,102,0.4)' : 'var(--color-border-subtle)'}`,
                  color: active ? '#FFD166' : 'var(--color-text-muted)',
                }}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Preferred time */}
      <div className="flex flex-col gap-2">
        <p className="font-space-grotesk text-[12px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Moment préféré
        </p>
        <div className="flex gap-2">
          {(['matin', 'après-midi', 'soir'] as const).map(t => {
            const active = prefs.preferredTime === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setPrefs(p => ({ ...p, preferredTime: t }))}
                className="cursor-pointer flex-1 font-space-grotesk text-[13px] font-semibold py-2 rounded-lg transition-all duration-150 capitalize"
                style={{
                  background: active ? 'rgba(255,209,102,0.15)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${active ? 'rgba(255,209,102,0.4)' : 'var(--color-border-subtle)'}`,
                  color: active ? '#FFD166' : 'var(--color-text-muted)',
                }}
                aria-pressed={active}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={save}
        className="cursor-pointer self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : '#FFD166',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
        }}
      >
        {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
      </button>
    </div>
  )
}

// ─── Sleep schedule form ──────────────────────────────────────────────────────

function SleepScheduleForm({ wakeTime: initWake, sleepTime: initSleep }: { wakeTime: string; sleepTime: string }) {
  const [wake,  setWake]  = useState(initWake)
  const [sleep, setSleep] = useState(initSleep)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaved(false)
    await fetch('/api/semestre', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wakeTime: wake, sleepTime: sleep }),
    })
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Réveil', value: wake, onChange: setWake },
          { label: 'Coucher', value: sleep, onChange: setSleep },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="font-space-grotesk text-[12px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {label}
            </label>
            <input
              type="time"
              value={value}
              onChange={e => { onChange(e.target.value); setSaved(false) }}
              className="cursor-pointer rounded-lg px-3 py-2 font-space-grotesk text-[14px]"
              style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-subtle)',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        className="cursor-pointer self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : 'var(--color-accent-study)',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
        }}
      >
        {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
      </button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function SemesterSetupForm({
  courses,
  wakeTime,
  sleepTime,
  gymPrefs,
  gridSlots,
}: SemesterSetupFormProps) {
  const router = useRouter()
  const [slots, setSlots] = useState<GridSlot[]>(gridSlots)

  // Sync when server refreshes (router.refresh() updates props)
  useEffect(() => { setSlots(gridSlots) }, [gridSlots])

  function handleCourseUpdate(
    _id: string,
    _hours: number,
    _scheduleText: string,
    newSlots?: GridSlot[],
  ) {
    if (newSlots?.length) {
      setSlots(prev => {
        // Merge: keep slots from other courses, replace slots for this course
        // Since GridSlot doesn't track courseId, just append unique by (colIndex, startTime)
        const appended = newSlots.filter(
          n => !prev.some(p => p.colIndex === n.colIndex && p.startTime === n.startTime),
        )
        return [...prev, ...appended]
      })
    }
    router.refresh()
  }

  function handleSessionSlotsReady(newSlots: GridSlot[]) {
    setSlots(prev => {
      const appended = newSlots.filter(
        n => !prev.some(p => p.colIndex === n.colIndex && p.startTime === n.startTime),
      )
      return [...prev, ...appended]
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-10 max-w-3xl">

      {/* ── Import horaire de session ── */}
      <section aria-labelledby="session-import-section">
        <SessionScheduleImport onSlotsReady={handleSessionSlotsReady} />
      </section>

      {/* ── Grille horaire visuelle ── */}
      <section aria-labelledby="grid-section">
        <h2 id="grid-section" className="font-syne font-bold text-[18px] mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Grille horaire fixe
        </h2>
        {slots.length > 0 ? (
          <ScheduleGrid slots={slots} />
        ) : (
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
          >
            <p className="font-space-grotesk text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              Importe ton horaire de session ou le PDF d'un cours pour voir les créneaux ici.
            </p>
          </div>
        )}
      </section>

      {/* ── Heures réveil / coucher ── */}
      <section aria-labelledby="sleep-section">
        <h2 id="sleep-section" className="font-syne font-bold text-[18px] mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Horaire quotidien
        </h2>
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
        >
          <SleepScheduleForm wakeTime={wakeTime} sleepTime={sleepTime} />
        </div>
      </section>

      {/* ── Cours ── */}
      <section aria-labelledby="courses-section">
        <h2 id="courses-section" className="font-syne font-bold text-[18px] mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Mes cours
        </h2>
        {courses.length === 0 ? (
          <p className="font-space-grotesk text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            Aucun cours enregistré. Ajoute tes cours dans la section Académique.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.map(course => (
              <CourseSetupCard key={course.id} course={course} onUpdate={handleCourseUpdate} />
            ))}
          </div>
        )}
      </section>

      {/* ── Préférences gym ── */}
      <section aria-labelledby="gym-section">
        <h2 id="gym-section" className="font-syne font-bold text-[18px] mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Préférences gym
        </h2>
        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)' }}
        >
          <GymPrefsForm initial={gymPrefs} />
        </div>
      </section>

    </div>
  )
}
