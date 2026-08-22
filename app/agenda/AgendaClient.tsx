'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EventOccurrence } from '@/lib/events'
import { getMondayLocal, addDaysLocal, formatWeekRangeLabel, isSameLocalDay, WEEKDAY_LABELS_FR } from '@/lib/weekDates'
import { EventModal } from './EventModal'

// ── Constants ──────────────────────────────────────────────────────────────

const START_HOUR = 7
const END_HOUR = 23
const SLOT_MINUTES = 30
const SLOT_HEIGHT = 28 // px
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT
const GRIDLINE_COLOR = 'rgba(255,255,255,0.06)'
const NOW_LINE_COLOR = '#C9006B'

interface AgendaClientProps {
  initialWeekStart: string
  initialEvents: EventOccurrence[]
  initiallyEmpty: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((n) => isNaN(n))) return `rgba(78,42,132,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

function minutesFromGridStart(d: Date): number {
  return (d.getHours() - START_HOUR) * 60 + d.getMinutes()
}

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}`
}

// ── EmptyState ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-bg-surface border border-border-subtle rounded-xl">
      <svg
        className="h-10 w-10 text-text-muted"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
      <p className="font-syne text-[15px] font-semibold text-text-primary">
        Aucun cours pour l&apos;instant
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="px-4 py-2 rounded-lg bg-[#C9006B] text-white font-space-grotesk text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
      >
        + Ajouter un événement
      </button>
    </div>
  )
}

// ── WeekGrid ───────────────────────────────────────────────────────────────

interface WeekGridProps {
  weekStart: Date
  events: EventOccurrence[]
  now: Date
  onEventClick: (event: EventOccurrence) => void
}

function WeekGrid({ weekStart, events, now, onEventClick }: WeekGridProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDaysLocal(weekStart, i))
  const hourLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  const nowOffset = minutesFromGridStart(now)
  const nowVisible = days.some((d) => isSameLocalDay(d, now)) && nowOffset >= 0 && nowOffset <= (END_HOUR - START_HOUR) * 60
  const nowTop = (nowOffset / SLOT_MINUTES) * SLOT_HEIGHT

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
        <div className="border-b" style={{ borderColor: GRIDLINE_COLOR }} />
        {days.map((day) => {
          const isToday = isSameLocalDay(day, now)
          return (
            <div
              key={day.toISOString()}
              className="border-b border-l px-1 py-2 text-center"
              style={{ borderColor: GRIDLINE_COLOR, background: isToday ? 'rgba(201,0,107,0.08)' : 'transparent' }}
            >
              <div
                className="font-space-grotesk text-[11px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: isToday ? '#C9006B' : 'rgba(255,255,255,0.6)' }}
              >
                {WEEKDAY_LABELS_FR[(day.getDay() + 6) % 7]}
              </div>
              <div
                className="font-syne text-[13px] font-bold"
                style={{ color: isToday ? '#C9006B' : 'var(--color-text-primary)' }}
              >
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid body */}
      <div className="relative overflow-x-auto">
        <div className="relative grid" style={{ gridTemplateColumns: '48px repeat(7, 1fr)', height: GRID_HEIGHT }}>
          {/* Time labels column */}
          <div className="relative">
            {hourLabels.map((h) => (
              <span
                key={h}
                className="absolute -translate-y-1/2 pr-2 font-space-grotesk text-[11px] font-semibold tracking-[0.05em] text-text-muted"
                style={{ top: ((h - START_HOUR) * 60 / SLOT_MINUTES) * SLOT_HEIGHT, right: 0 }}
              >
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const isToday = isSameLocalDay(day, now)
            const dayEvents = events.filter((e) => isSameLocalDay(new Date(e.startTime), day))

            return (
              <div
                key={day.toISOString()}
                className="relative border-l"
                style={{
                  borderColor: GRIDLINE_COLOR,
                  backgroundColor: isToday ? 'rgba(201,0,107,0.04)' : 'transparent',
                  backgroundImage: `repeating-linear-gradient(to bottom, ${GRIDLINE_COLOR} 0, ${GRIDLINE_COLOR} 1px, transparent 1px, transparent ${SLOT_HEIGHT}px)`,
                }}
              >
                {dayEvents.map((event) => {
                  const start = new Date(event.startTime)
                  const end = new Date(event.endTime)
                  const top = Math.max(0, (minutesFromGridStart(start) / SLOT_MINUTES) * SLOT_HEIGHT)
                  const rawHeight = ((end.getTime() - start.getTime()) / 60000 / SLOT_MINUTES) * SLOT_HEIGHT
                  const height = Math.max(18, Math.min(rawHeight, GRID_HEIGHT - top))

                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick(event)}
                      className="absolute left-0.5 right-0.5 flex flex-col overflow-hidden px-1.5 py-1 text-left cursor-pointer transition-transform hover:scale-[1.01] focus-ring"
                      style={{
                        top,
                        height,
                        borderLeft: `3px solid ${event.color}`,
                        backgroundColor: hexToRgba(event.color, 0.15),
                        borderRadius: '2px',
                      }}
                    >
                      <span className="font-space-grotesk text-[11px] font-semibold text-white truncate leading-tight">
                        {event.title}
                      </span>
                      <span
                        className="font-space-grotesk text-[11px] font-semibold tracking-[0.05em] truncate leading-tight"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                      >
                        {formatTimeRange(start, end)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {/* Current time indicator */}
          {nowVisible && (
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 pointer-events-none"
              style={{ top: nowTop, height: 1, background: NOW_LINE_COLOR, zIndex: 5 }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── AgendaClient ───────────────────────────────────────────────────────────

export function AgendaClient({ initialWeekStart, initialEvents, initiallyEmpty }: AgendaClientProps) {
  const [weekStart, setWeekStart] = useState(() => getMondayLocal(new Date()))
  const [events, setEvents] = useState<EventOccurrence[]>(initialEvents)
  const [hasAnyEventEver, setHasAnyEventEver] = useState(!initiallyEmpty)
  const [now, setNow] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<EventOccurrence | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Keep the "now" line reasonably live
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const fetchWeek = useCallback(async (start: Date) => {
    try {
      const res = await fetch(`/api/events?weekStart=${encodeURIComponent(start.toISOString())}`)
      if (!res.ok) return
      const json = await res.json()
      const data: EventOccurrence[] = json.data ?? []
      setEvents(data)
      if (data.length > 0) setHasAnyEventEver(true)
    } catch {
      // silent — grid just keeps showing the last known events
    }
  }, [])

  // Refetch whenever the displayed week changes (covers the initial mount too,
  // since `initialWeekStart` was only a server-side best guess).
  useEffect(() => {
    void fetchWeek(weekStart)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  function goPrev() { setWeekStart((w) => addDaysLocal(w, -7)) }
  function goNext() { setWeekStart((w) => addDaysLocal(w, 7)) }
  function goToday() { setWeekStart(getMondayLocal(new Date())) }

  function openCreate() {
    setSelectedEvent(null)
    setShowModal(true)
  }

  function openEdit(event: EventOccurrence) {
    setSelectedEvent(event)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setSelectedEvent(null)
  }

  function handleSaved() {
    closeModal()
    void fetchWeek(weekStart)
  }

  function handleDeleted() {
    closeModal()
    void fetchWeek(weekStart)
  }

  const isEmpty = !hasAnyEventEver

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Semaine précédente"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-text-muted transition-colors cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToday}
              className="px-3 h-8 rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-text-muted font-space-grotesk text-[13px] transition-colors cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Semaine suivante"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:text-text-primary hover:border-text-muted transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>
          <span className="font-space-grotesk text-[13px] text-text-muted">
            {formatWeekRangeLabel(weekStart)}
          </span>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-[#C9006B] text-white font-space-grotesk text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          + Ajouter
        </button>
      </div>

      {isEmpty ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <WeekGrid weekStart={weekStart} events={events} now={now} onEventClick={openEdit} />
      )}

      {showModal && (
        <EventModal
          event={selectedEvent}
          defaultDate={now}
          onClose={closeModal}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
