'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { GridSlot } from '@/lib/semester'
import { extractTriplet } from '@/lib/semester'

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
  onUpdate: (id: string, hours: number, scheduleText: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [hours, setHours] = useState(course.currentHours)
  const [scheduleText, setScheduleText] = useState('')
  const [triplet, setTriplet] = useState<{ lecture: number; lab: number; personal: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.endsWith('.pdf')) return
    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res  = await fetch(`/api/academique/${course.id}/import-syllabus`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (res.ok && json.scheduleText) {
        const t = extractTriplet(json.scheduleText)
        if (t) {
          setTriplet(t)
          setHours(t.personal)
          setScheduleText(json.scheduleText)
        }
      }
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-space-grotesk text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
            {course.code}
          </p>
          <p className="font-syne font-bold text-[15px] mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
            {course.name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="font-space-grotesk text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
          style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-accent-study)',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Lecture…' : 'PDF'}
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
          className="w-full accent-[#4A9EFF] h-1.5 rounded-full"
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
        className="self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
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
          <label className="font-space-grotesk text-[12px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Séances / semaine
          </label>
          <span className="font-syne font-bold text-[15px]" style={{ color: '#FFD166' }}>
            {prefs.frequencyPerWeek}×
          </span>
        </div>
        <input
          type="range" min={1} max={7} step={1}
          value={prefs.frequencyPerWeek}
          onChange={e => setPrefs(p => ({ ...p, frequencyPerWeek: parseInt(e.target.value) }))}
          className="w-full h-1.5 rounded-full"
          style={{ accentColor: '#FFD166' }}
          aria-label="Nombre de séances de gym par semaine"
        />
      </div>

      {/* Duration */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="font-space-grotesk text-[12px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Durée séance
          </label>
          <span className="font-syne font-bold text-[15px]" style={{ color: '#FFD166' }}>
            {prefs.sessionDurationMinutes} min
          </span>
        </div>
        <input
          type="range" min={30} max={120} step={15}
          value={prefs.sessionDurationMinutes}
          onChange={e => setPrefs(p => ({ ...p, sessionDurationMinutes: parseInt(e.target.value) }))}
          className="w-full h-1.5 rounded-full"
          style={{ accentColor: '#FFD166' }}
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
                className="font-space-grotesk text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-all duration-150"
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
                className="flex-1 font-space-grotesk text-[13px] font-semibold py-2 rounded-lg transition-all duration-150 capitalize"
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
        className="self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
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
              className="rounded-lg px-3 py-2 font-space-grotesk text-[14px]"
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
        className="self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
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

  function handleCourseUpdate(id: string, hours: number, scheduleText: string) {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-10 max-w-3xl">

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
              Importe le PDF d'un cours pour voir ses créneaux ici.
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
