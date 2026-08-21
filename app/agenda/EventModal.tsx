'use client'

import { useState, type FormEvent } from 'react'
import type { EventOccurrence } from '@/lib/events'
import { Input } from '@/components/ui/Input'
import { useModalA11y } from '@/lib/useModalA11y'

// ── Types ────────────────────────────────────────────────────────────────────

type EventTypeValue = 'COURS' | 'LAB' | 'PERSO'
type RepeatOption = 'never' | 'weekly' | 'biweekly' | 'daily'

interface EventModalProps {
  event: EventOccurrence | null // null = create mode
  defaultDate: Date // used to prefill start/end when creating
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: EventTypeValue; label: string }[] = [
  { value: 'COURS', label: 'Cours' },
  { value: 'LAB', label: 'Lab' },
  { value: 'PERSO', label: 'Personnel' },
]

const COLOR_SWATCHES = ['#7C5CFC', '#9B8FFF', '#C9006B', '#FFD166', '#A8FF78', '#4E2A84']

const DEFAULT_UNTIL = '2026-12-19'

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

const fieldCls =
  'bg-bg-elevated border border-border-subtle rounded-lg w-full px-3.5 py-2.5 font-space-grotesk text-sm text-text-primary outline-none transition-[border-color] duration-150 focus-ring'

// ── Date/time helpers (local wall-clock, matching the browser's timezone) ──

function dateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function timeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function combineDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`)
}

function parseRrule(rrule: string | null): { repeat: RepeatOption; untilDate: string; hasUntil: boolean } {
  if (!rrule) return { repeat: 'never', untilDate: DEFAULT_UNTIL, hasUntil: false }

  const parts: Record<string, string> = {}
  for (const part of rrule.split(';')) {
    const [k, v] = part.split('=')
    if (k && v) parts[k] = v
  }

  let repeat: RepeatOption = 'weekly'
  if (parts.FREQ === 'DAILY') repeat = 'daily'
  else if (parts.INTERVAL === '2') repeat = 'biweekly'
  else repeat = 'weekly'

  const until = parts.UNTIL
  const untilDate = until && until.length >= 8
    ? `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`
    : DEFAULT_UNTIL

  return { repeat, untilDate, hasUntil: Boolean(until) }
}

function buildRrule(repeat: RepeatOption, startTime: Date, untilDate: string | null): string | null {
  if (repeat === 'never') return null

  let rule: string
  if (repeat === 'daily') {
    rule = 'FREQ=DAILY'
  } else {
    const byday = DAY_CODES[startTime.getDay()]
    rule = repeat === 'biweekly'
      ? `FREQ=WEEKLY;INTERVAL=2;BYDAY=${byday}`
      : `FREQ=WEEKLY;BYDAY=${byday}`
  }

  if (untilDate) {
    rule += `;UNTIL=${untilDate.replaceAll('-', '')}T235959Z`
  }

  return rule
}

// ── Component ────────────────────────────────────────────────────────────────

export function EventModal({ event, defaultDate, onClose, onSaved, onDeleted }: EventModalProps) {
  const isEditing = event !== null

  const initialStart = event ? new Date(event.startTime) : roundToHalfHour(defaultDate)
  const initialEnd = event ? new Date(event.endTime) : new Date(initialStart.getTime() + 60 * 60 * 1000)
  const initialRrule = parseRrule(event?.rrule ?? null)

  const [title, setTitle] = useState(event?.title ?? '')
  const [type, setType] = useState<EventTypeValue>(event?.type ?? 'COURS')
  const [color, setColor] = useState(event?.color ?? COLOR_SWATCHES[0])
  const [startDate, setStartDate] = useState(dateInputValue(initialStart))
  const [startTime, setStartTime] = useState(timeInputValue(initialStart))
  const [endDate, setEndDate] = useState(dateInputValue(initialEnd))
  const [endTime, setEndTime] = useState(timeInputValue(initialEnd))
  const [location, setLocation] = useState(event?.location ?? '')
  const [repeat, setRepeat] = useState<RepeatOption>(initialRrule.repeat)
  const [hasUntil, setHasUntil] = useState(initialRrule.hasUntil)
  const [untilDate, setUntilDate] = useState(initialRrule.untilDate)

  const [status, setStatus] = useState<'idle' | 'saving' | 'deleting' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setStatus('error')
      setErrorMsg('Le titre est requis.')
      return
    }

    const start = combineDateTime(startDate, startTime)
    const end = combineDateTime(endDate, endTime)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setStatus('error')
      setErrorMsg('Date ou heure invalide.')
      return
    }
    if (end <= start) {
      setStatus('error')
      setErrorMsg('La fin doit être après le début.')
      return
    }

    const rrule = buildRrule(repeat, start, hasUntil ? untilDate : null)

    setStatus('saving')
    setErrorMsg('')

    try {
      const body = {
        title: trimmedTitle,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type,
        color,
        location: location.trim() || null,
        rrule,
      }

      const res = await fetch(isEditing ? `/api/events/${event!.eventId}` : '/api/events', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  async function handleDelete() {
    if (!event) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    setStatus('deleting')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/events/${event.eventId}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Erreur serveur')
      }
      onDeleted()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau')
      setConfirmDelete(false)
    }
  }

  const busy = status === 'saving' || status === 'deleting'
  const containerRef = useModalA11y<HTMLDivElement>(true, () => { if (!busy) onClose() })

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={() => { if (!busy) onClose() }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-bg-surface border border-border-subtle rounded-xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="event-modal-title" className="font-syne text-[18px] font-bold text-text-primary">
          {isEditing ? "Modifier l'événement" : 'Nouvel événement'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

          {/* Titre */}
          <Input
            id="ev-title"
            label="Titre"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            placeholder="Ex. INF3710 — Cours"
          />

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <span className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]">
              Type
            </span>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  aria-pressed={type === opt.value}
                  className={`px-3 py-2 rounded-lg font-space-grotesk text-[13px] font-medium border transition-colors cursor-pointer ${
                    type === opt.value
                      ? 'bg-[#C9006B] text-white border-[#C9006B]'
                      : 'bg-bg-elevated text-text-muted border-border-subtle hover:border-[#C9006B]/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div className="flex flex-col gap-1.5">
            <span className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]">
              Couleur
            </span>
            <div className="flex gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={`Couleur ${swatch}`}
                  aria-pressed={color === swatch}
                  className="w-8 h-8 rounded-full cursor-pointer transition-transform"
                  style={{
                    background: swatch,
                    outline: color === swatch ? '2px solid white' : 'none',
                    outlineOffset: '2px',
                    transform: color === swatch ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Début / Fin */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Input id="ev-start-date" label="Début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              <Input id="ev-start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Input id="ev-end-date" label="Fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              <Input id="ev-end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          {/* Lieu */}
          <Input
            id="ev-location"
            label="Lieu (optionnel)"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex. A416, À distance…"
          />

          {/* Répétition */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ev-repeat" className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]">
              Répétition
            </label>
            <select
              id="ev-repeat"
              value={repeat}
              onChange={(e) => setRepeat(e.target.value as RepeatOption)}
              className={fieldCls}
            >
              <option value="never">Jamais</option>
              <option value="weekly">Chaque semaine</option>
              <option value="biweekly">Toutes les 2 semaines</option>
              <option value="daily">Chaque jour</option>
            </select>
          </div>

          {/* Fin de répétition */}
          {repeat !== 'never' && (
            <div className="flex flex-col gap-2">
              <span className="font-space-grotesk text-[12px] font-medium text-text-muted uppercase tracking-[0.06em]">
                Fin de répétition
              </span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 font-space-grotesk text-[13px] text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="until-mode"
                    checked={!hasUntil}
                    onChange={() => setHasUntil(false)}
                  />
                  Jamais
                </label>
                <label className="flex items-center gap-2 font-space-grotesk text-[13px] text-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="until-mode"
                    checked={hasUntil}
                    onChange={() => setHasUntil(true)}
                  />
                  Le…
                  <input
                    type="date"
                    value={untilDate}
                    onChange={(e) => { setUntilDate(e.target.value); setHasUntil(true) }}
                    className={`${fieldCls} flex-1`}
                  />
                </label>
              </div>
            </div>
          )}

          {status === 'error' && (
            <p role="alert" className="font-space-grotesk text-[13px] text-accent-reco">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-muted font-space-grotesk text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 app-btn-primary rounded-lg font-space-grotesk text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className={`ml-auto px-4 py-2 rounded-lg font-space-grotesk text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                  confirmDelete
                    ? 'bg-accent-reco text-white'
                    : 'border border-accent-reco/30 text-accent-reco/70 hover:text-accent-reco hover:border-accent-reco/60'
                }`}
              >
                {status === 'deleting'
                  ? 'Suppression…'
                  : confirmDelete
                    ? 'Confirmer la suppression'
                    : 'Supprimer cet événement'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function roundToHalfHour(d: Date): Date {
  const rounded = new Date(d)
  const minutes = rounded.getMinutes()
  rounded.setMinutes(minutes < 30 ? 30 : 0, 0, 0)
  if (minutes >= 30) rounded.setHours(rounded.getHours() + 1)
  return rounded
}
