'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { GridSlot, ConflictInfo } from '@/lib/semester'
import { extractTriplet, buildGridSlots, detectScheduleConflicts } from '@/lib/semester'
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

interface CourseOption {
  id: string
  code: string
  name: string
}

interface ManualSlotEntry {
  localId: number
  courseId: string
  courseCode: string
  dayOfWeek: number
  startTime: string
  endTime: string
  type: 'COURS' | 'LAB'
  room?: string
  group?: string
}

interface ManualEvalEntry {
  localId: number
  title: string
  weight: number
  date?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isApiError(err: string | null): boolean {
  if (!err) return false
  return /credit|503|api/i.test(err)
}

// ─── Visual grid (7h→22h, Lun→Ven) ───────────────────────────────────────────

const GRID_START = 7
const GRID_END   = 22
const DAYS_FR    = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']

const DAY_OPTIONS = [
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mer', value: 3 },
  { label: 'Jeu', value: 4 },
  { label: 'Ven', value: 5 },
]

const DAY_NAMES: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Jeu', 5: 'Ven' }

const COURSE_PALETTE = [
  { bg: 'rgba(155,143,255,0.22)', border: '#9B8FFF', text: '#9B8FFF', glow: 'rgba(155,143,255,0.35)' },
  { bg: 'rgba(74,158,255,0.20)',  border: '#4A9EFF', text: '#4A9EFF', glow: 'rgba(74,158,255,0.35)'  },
  { bg: 'rgba(168,255,120,0.18)', border: '#A8FF78', text: '#A8FF78', glow: 'rgba(168,255,120,0.35)' },
  { bg: 'rgba(255,209,102,0.18)', border: '#FFD166', text: '#FFD166', glow: 'rgba(255,209,102,0.35)' },
  { bg: 'rgba(255,107,157,0.18)', border: '#FF6B9D', text: '#FF6B9D', glow: 'rgba(255,107,157,0.35)' },
  { bg: 'rgba(100,220,200,0.18)', border: '#64DCC8', text: '#64DCC8', glow: 'rgba(100,220,200,0.35)' },
]

function buildCourseColorMap(slots: GridSlot[]): Map<string, typeof COURSE_PALETTE[0]> {
  const codes = [...new Set(slots.map(s => s.code).filter((c): c is string => Boolean(c)))]
  const map = new Map<string, typeof COURSE_PALETTE[0]>()
  codes.forEach((code, i) => map.set(code, COURSE_PALETTE[i % COURSE_PALETTE.length]))
  return map
}

const DEFAULT_COLOR = COURSE_PALETTE[0]

const ROW_H = 44 // pixels per hour slot

function ScheduleGrid({
  slots,
  courseNameMap = {},
}: {
  slots: GridSlot[]
  courseNameMap?: Record<string, string>
}) {
  const [tooltip, setTooltip] = useState<{ slot: GridSlot; x: number; y: number } | null>(null)
  const colorMap = buildCourseColorMap(slots)
  const numHours = GRID_END - GRID_START // 15
  const hourLines = Array.from({ length: numHours + 1 }, (_, i) => GRID_START + i) // 7..22

  return (
    <>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div
          style={{
            minWidth: '500px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-surface)',
          }}
        >
          {/* Day headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '44px repeat(5, 1fr)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div />
            {DAYS_FR.map(d => (
              <div
                key={d}
                style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  padding: '10px 0 9px',
                  color: 'var(--color-text-muted)',
                  borderLeft: '1px solid var(--color-border-subtle)',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid body — fixed height, absolute children */}
          <div style={{ position: 'relative', height: `${numHours * ROW_H}px` }}>

            {/* Hour lines + labels */}
            {hourLines.map((h, i) => (
              <div
                key={h}
                style={{ position: 'absolute', top: `${i * ROW_H}px`, left: 0, right: 0, pointerEvents: 'none' }}
              >
                <span style={{
                  position: 'absolute',
                  left: 0,
                  width: '40px',
                  top: '-8px',
                  paddingRight: '6px',
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'right',
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {h}h
                </span>
                {i > 0 && (
                  <div style={{ marginLeft: '44px', height: '1px', background: 'var(--color-border-subtle)' }} />
                )}
              </div>
            ))}

            {/* Column separators */}
            {[0, 1, 2, 3, 4].map(col => (
              <div
                key={col}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(44px + ${col} * (100% - 44px) / 5)`,
                  width: '1px',
                  background: 'var(--color-border-subtle)',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Course blocks */}
            {slots.map((slot, i) => {
              const color = (slot.code ? colorMap.get(slot.code) : undefined) ?? DEFAULT_COLOR
              const topPx    = (slot.topPct    / 100) * (numHours * ROW_H)
              const heightPx = (slot.heightPct / 100) * (numHours * ROW_H)
              const PAD = 2

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `calc(44px + ${slot.colIndex} * (100% - 44px) / 5 + ${PAD}px)`,
                    width: `calc((100% - 44px) / 5 - ${PAD * 2}px)`,
                    top: `${topPx + PAD}px`,
                    height: `${Math.max(heightPx - PAD * 2, 10)}px`,
                    zIndex: 1,
                  }}
                  onMouseEnter={e => setTooltip({ slot, x: e.clientX, y: e.clientY })}
                  onMouseMove={e => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '6px',
                      border: `1px solid ${color.border}`,
                      background: color.bg,
                      boxShadow: `0 0 10px ${color.glow}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      padding: '3px 6px',
                      overflow: 'hidden',
                      cursor: 'default',
                      gap: '1px',
                    }}
                  >
                    {/* Course code — always shown */}
                    <span style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontWeight: 700,
                      fontSize: '9px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: color.text,
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {slot.code ?? slot.type}
                    </span>
                    {/* Type badge — block ≥ 40px */}
                    {heightPx >= 40 && (
                      <span style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: color.text,
                        opacity: 0.7,
                        lineHeight: 1.2,
                      }}>
                        {slot.type}
                      </span>
                    )}
                    {/* Time range — block ≥ 54px */}
                    {heightPx >= 54 && (
                      <span style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '8px',
                        color: color.text,
                        opacity: 0.55,
                        lineHeight: 1.2,
                        marginTop: '1px',
                      }}>
                        {slot.startTime}–{slot.endTime}
                      </span>
                    )}
                    {/* Room — block ≥ 80px */}
                    {heightPx >= 80 && slot.room && (
                      <span style={{
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '8px',
                        color: color.text,
                        opacity: 0.5,
                        lineHeight: 1.2,
                      }}>
                        {slot.room}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (() => {
        const slot = tooltip.slot
        const color = (slot.code ? colorMap.get(slot.code) : undefined) ?? DEFAULT_COLOR
        const name = slot.code ? (courseNameMap[slot.code] ?? slot.code) : slot.type
        const tx = Math.max(8, Math.min(tooltip.x + 14, window.innerWidth - 214))
        const ty = tooltip.y + 10
        return (
          <div
            style={{
              position: 'fixed',
              left: `${tx}px`,
              top: `${ty}px`,
              zIndex: 9999,
              background: '#12121F',
              border: `1px solid ${color.border}`,
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 16px ${color.glow}`,
              pointerEvents: 'none',
              minWidth: '160px',
              maxWidth: '210px',
            }}
          >
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '13px', color: '#F0F0FF', marginBottom: '6px', lineHeight: 1.3 }}>
              {name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', fontWeight: 600, color: color.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {slot.type}
              </span>
              <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', color: '#8888AA' }}>
                {slot.startTime} → {slot.endTime}
              </span>
              {slot.room && (
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', color: '#8888AA' }}>
                  Salle {slot.room}
                </span>
              )}
              {slot.group && (
                <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '11px', color: '#8888AA' }}>
                  Groupe {slot.group}
                </span>
              )}
            </div>
          </div>
        )
      })()}
    </>
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
  const [extractionErrorMsg, setExtractionErrorMsg] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) return
    setLoading(true)
    setExtractionSummary(null)
    setExtractionErrorMsg(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/academique/${course.id}/import-syllabus`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!res.ok) {
        const msg = json.error ?? 'Erreur inconnue'
        setExtractionErrorMsg(msg)
        if (isApiError(msg)) setShowManual(true)
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
      const newSlots: ScheduleSlot[] = (Array.isArray(json.schedules) ? json.schedules : [])
        .map((s: ScheduleSlot) => ({ ...s, code: course.code }))
      const newGridSlots = newSlots.length > 0
        ? buildGridSlots(newSlots, GRID_START, GRID_END)
        : undefined
      onUpdate(course.id, t?.personal ?? hours, text, newGridSlots)
    } catch (e) {
      setExtractionErrorMsg(e instanceof Error ? e.message : 'Erreur réseau')
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
      {extractionErrorMsg && !loading && (
        <div
          className="rounded-lg px-3 py-2 font-space-grotesk text-[12px]"
          style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.25)', color: '#FF6B9D' }}
        >
          {extractionErrorMsg}
        </div>
      )}

      {/* Manual entry link (always accessible, hidden when form is open) */}
      {!showManual && !loading && (
        <div className="flex justify-end" style={{ marginTop: '-8px' }}>
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="cursor-pointer font-space-grotesk text-[11px]"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            Saisir manuellement
          </button>
        </div>
      )}

      {/* Manual syllabus fallback */}
      {showManual && (
        <ManualSyllabusForm
          courseId={course.id}
          onSuccess={(tripletText) => {
            const t = extractTriplet(tripletText)
            if (t) { setTriplet(t); setHours(t.personal); setScheduleText(`Triplet saisi : ${tripletText}`) }
            setExtractionSummary(null)
            setShowManual(false)
          }}
          onClose={() => setShowManual(false)}
        />
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
          onChange={e => { setHours(parseFloat(e.target.value)); setSaved(false) }}
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
        disabled={saved}
        className="self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : 'var(--color-accent-study)',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
          cursor: saved ? 'default' : 'pointer',
          opacity: saved ? 0.85 : 1,
        }}
      >
        {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
      </button>
    </div>
  )
}

// ─── Manual horaire form ──────────────────────────────────────────────────────

function ManualHoraireForm({
  courses,
  onSlotsReady,
  onClose,
}: {
  courses: CourseOption[]
  onSlotsReady: (slots: GridSlot[]) => void
  onClose: () => void
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '')
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('11:30')
  const [type, setType] = useState<'COURS' | 'LAB'>('COURS')
  const [room, setRoom] = useState('')
  const [group, setGroup] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [slots, setSlots] = useState<ManualSlotEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingEntry, setPendingEntry] = useState<ManualSlotEntry | null>(null)
  const [pendingConflicts, setPendingConflicts] = useState<ConflictInfo[]>([])
  const nextIdRef = useRef(0)

  function resetForm() {
    setCourseId(courses[0]?.id ?? '')
    setDayOfWeek(1)
    setStartTime('08:30')
    setEndTime('11:30')
    setType('COURS')
    setRoom('')
    setGroup('')
    setEditingId(null)
  }

  function startEdit(s: ManualSlotEntry) {
    setCourseId(s.courseId)
    setDayOfWeek(s.dayOfWeek)
    setStartTime(s.startTime)
    setEndTime(s.endTime)
    setType(s.type)
    setRoom(s.room ?? '')
    setGroup(s.group ?? '')
    setEditingId(s.localId)
  }

  function applyEntry(entry: ManualSlotEntry) {
    if (editingId !== null) {
      setSlots(prev => prev.map(s => s.localId === editingId ? entry : s))
    } else {
      setSlots(prev => [...prev, entry])
    }
    resetForm()
  }

  function commitSlot() {
    const course = courses.find(c => c.id === courseId)
    if (!course || !startTime || !endTime) return
    const entry: ManualSlotEntry = {
      localId:    editingId ?? nextIdRef.current++,
      courseId,
      courseCode: course.code,
      dayOfWeek,
      startTime,
      endTime,
      type,
      room:  room.trim()  || undefined,
      group: group.trim() || undefined,
    }
    // Check conflicts against existing slots (excluding current edited one)
    const others = slots.filter(s => s.localId !== editingId)
    const conflicts = detectScheduleConflicts(
      { dayOfWeek: entry.dayOfWeek, startTime: entry.startTime, endTime: entry.endTime, courseCode: entry.courseCode },
      others.map(s => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, courseCode: s.courseCode })),
    )
    if (conflicts.length > 0) {
      setPendingEntry(entry)
      setPendingConflicts(conflicts)
      return
    }
    applyEntry(entry)
  }

  function resolveConflict(replace: boolean) {
    if (!pendingEntry) return
    if (replace) {
      // Remove all conflicting slots then add new entry
      const conflictKeys = pendingConflicts.map(c => `${c.day}|${c.startTime}|${c.endTime}`)
      setSlots(prev => prev.filter(s => {
        const key = `${DAY_NAMES[s.dayOfWeek]}|${s.startTime}|${s.endTime}`
        return !conflictKeys.includes(key)
      }))
      applyEntry(pendingEntry)
    }
    setPendingEntry(null)
    setPendingConflicts([])
  }

  function removeSlot(localId: number) {
    setSlots(prev => prev.filter(s => s.localId !== localId))
    if (editingId === localId) resetForm()
  }

  async function save() {
    if (slots.length === 0) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/semestre/manual-horaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: slots.map(s => ({
            courseId:  s.courseId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime:   s.endTime,
            type:      s.type,
            ...(s.room  ? { room:  s.room  } : {}),
            ...(s.group ? { group: s.group } : {}),
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur inconnue'); return }
      setSaved(true)
      if (Array.isArray(json.slots) && json.slots.length > 0) {
        onSlotsReady(buildGridSlots(json.slots, GRID_START, GRID_END))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const isEditing = editingId !== null

  return (
    <div
      className="flex flex-col gap-4 pt-4"
      style={{ borderTop: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <p className="font-space-grotesk text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          {isEditing ? 'Modifier le créneau' : 'Saisie manuelle'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer font-space-grotesk text-[11px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Fermer
        </button>
      </div>

      {/* Cours + Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Cours</label>
          <select
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            className="cursor-pointer rounded-lg px-3 py-2 font-space-grotesk text-[13px]"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.code}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Type</label>
          <div className="flex gap-2 h-[38px]">
            {(['COURS', 'LAB'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className="cursor-pointer flex-1 font-space-grotesk text-[12px] font-semibold rounded-lg"
                style={{
                  background: type === t ? (t === 'COURS' ? 'rgba(155,143,255,0.2)' : 'rgba(74,158,255,0.2)') : 'var(--color-bg-elevated)',
                  border: `1px solid ${type === t ? (t === 'COURS' ? '#9B8FFF' : '#4A9EFF') : 'var(--color-border-subtle)'}`,
                  color: type === t ? (t === 'COURS' ? '#9B8FFF' : '#4A9EFF') : 'var(--color-text-muted)',
                }}
                aria-pressed={type === t}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jour */}
      <div className="flex flex-col gap-1">
        <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Jour</label>
        <div className="flex gap-2">
          {DAY_OPTIONS.map(d => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDayOfWeek(d.value)}
              className="cursor-pointer flex-1 font-space-grotesk text-[12px] font-semibold py-1.5 rounded-lg"
              style={{
                background: dayOfWeek === d.value ? 'rgba(155,143,255,0.15)' : 'var(--color-bg-elevated)',
                border: `1px solid ${dayOfWeek === d.value ? 'rgba(155,143,255,0.4)' : 'var(--color-border-subtle)'}`,
                color: dayOfWeek === d.value ? '#9B8FFF' : 'var(--color-text-muted)',
              }}
              aria-pressed={dayOfWeek === d.value}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Horaires */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Début', value: startTime, onChange: setStartTime },
          { label: 'Fin',   value: endTime,   onChange: setEndTime },
        ].map(({ label, value, onChange }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{label}</label>
            <input
              type="time"
              value={value}
              onChange={e => onChange(e.target.value)}
              className="cursor-pointer rounded-lg px-3 py-2 font-space-grotesk text-[13px]"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
            />
          </div>
        ))}
      </div>

      {/* Salle + Groupe */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Salle <span style={{ opacity: 0.5 }}>(optionnel)</span>
          </label>
          <input
            type="text"
            placeholder="ex : A416, L-4810"
            value={room}
            onChange={e => setRoom(e.target.value)}
            className="rounded-lg px-3 py-2 font-space-grotesk text-[13px]"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Groupe <span style={{ opacity: 0.5 }}>(optionnel)</span>
          </label>
          <input
            type="text"
            placeholder="ex : 02, 03"
            value={group}
            onChange={e => setGroup(e.target.value)}
            className="rounded-lg px-3 py-2 font-space-grotesk text-[13px]"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        {isEditing && (
          <button
            type="button"
            onClick={resetForm}
            className="cursor-pointer font-space-grotesk text-[12px] px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
          >
            Annuler
          </button>
        )}
        <button
          type="button"
          onClick={commitSlot}
          disabled={!courseId}
          className="cursor-pointer font-space-grotesk text-[12px] font-semibold px-3 py-1.5 rounded-lg"
          style={{
            background: isEditing ? 'rgba(74,158,255,0.12)' : 'rgba(155,143,255,0.12)',
            border: `1px solid ${isEditing ? 'rgba(74,158,255,0.3)' : 'rgba(155,143,255,0.3)'}`,
            color: isEditing ? '#4A9EFF' : '#9B8FFF',
            opacity: courseId ? 1 : 0.5,
          }}
        >
          {isEditing ? 'Valider les changements' : '+ Ajouter ce créneau'}
        </button>
      </div>

      {/* Liste créneaux */}
      {slots.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {slots.map(s => {
            const isActive = editingId === s.localId
            return (
              <div
                key={s.localId}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 cursor-pointer"
                style={{
                  background: isActive ? 'rgba(74,158,255,0.08)' : 'var(--color-bg-elevated)',
                  border: `1px solid ${isActive ? 'rgba(74,158,255,0.3)' : 'var(--color-border-subtle)'}`,
                }}
                onClick={() => startEdit(s)}
                role="button"
                aria-label={`Modifier le créneau ${s.courseCode}`}
              >
                <span className="font-space-grotesk text-[12px] min-w-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                  <span className="font-semibold">{s.courseCode}</span>
                  {s.group && <span style={{ color: 'var(--color-text-muted)' }}> ({s.group})</span>}
                  {' — '}{DAY_NAMES[s.dayOfWeek]} {s.startTime}–{s.endTime}{' '}
                  <span style={{ color: s.type === 'COURS' ? '#9B8FFF' : '#4A9EFF' }}>{s.type}</span>
                  {s.room && <span style={{ color: 'var(--color-text-muted)' }}> · {s.room}</span>}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeSlot(s.localId) }}
                  className="cursor-pointer font-space-grotesk text-[14px] leading-none flex-shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label={`Supprimer le créneau ${s.courseCode}`}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Conflict modal */}
      {pendingEntry && pendingConflicts.length > 0 && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(255,209,102,0.08)', border: '1px solid rgba(255,209,102,0.3)' }}
          role="alertdialog"
          aria-label="Conflit de créneau"
        >
          <p className="font-space-grotesk text-[13px] font-semibold" style={{ color: '#FFD166' }}>
            Conflit détecté
          </p>
          <p className="font-space-grotesk text-[12px]" style={{ color: 'var(--color-text-primary)' }}>
            {pendingConflicts.map(c =>
              `Ce créneau chevauche ${c.existingCode} (${c.day} ${c.startTime}–${c.endTime}).`
            ).join(' ')}
            {' '}Voulez-vous le remplacer ou annuler ?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => resolveConflict(false)}
              className="cursor-pointer font-space-grotesk text-[12px] px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => resolveConflict(true)}
              className="cursor-pointer font-space-grotesk text-[12px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,209,102,0.15)', border: '1px solid rgba(255,209,102,0.4)', color: '#FFD166' }}
            >
              Remplacer
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-lg px-3 py-2 font-space-grotesk text-[12px]"
          style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.25)', color: '#FF6B9D' }}
        >
          {error}
        </div>
      )}

      {saved && (
        <div
          className="rounded-lg px-3 py-2 font-space-grotesk text-[12px]"
          style={{ background: 'rgba(168,255,120,0.07)', border: '1px solid rgba(168,255,120,0.2)', color: '#A8FF78' }}
        >
          {slots.length} créneau{slots.length !== 1 ? 'x' : ''} sauvegardé{slots.length !== 1 ? 's' : ''}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={slots.length === 0 || saving}
        className="cursor-pointer self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : 'var(--color-accent-study)',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
          opacity: slots.length === 0 || saving ? 0.5 : 1,
        }}
      >
        {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé ✓' : `Sauvegarder l'horaire (${slots.length})`}
      </button>
    </div>
  )
}

// ─── Manual syllabus form ─────────────────────────────────────────────────────

function ManualSyllabusForm({
  courseId,
  onSuccess,
  onClose,
}: {
  courseId: string
  onSuccess: (tripletText: string) => void
  onClose: () => void
}) {
  const [tripletX, setTripletX] = useState(3)
  const [tripletY, setTripletY] = useState(1)
  const [tripletZ, setTripletZ] = useState(5)
  const [evalTitle, setEvalTitle] = useState('')
  const [evalWeight, setEvalWeight] = useState('')
  const [evalDate, setEvalDate] = useState('')
  const [evals, setEvals] = useState<ManualEvalEntry[]>([])
  const [editingEvalId, setEditingEvalId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const nextIdRef = useRef(0)

  function resetEvalForm() {
    setEvalTitle('')
    setEvalWeight('')
    setEvalDate('')
    setEditingEvalId(null)
  }

  function startEvalEdit(e: ManualEvalEntry) {
    setEvalTitle(e.title)
    setEvalWeight(String(e.weight))
    setEvalDate(e.date ?? '')
    setEditingEvalId(e.localId)
  }

  function commitEval() {
    const w = parseInt(evalWeight, 10)
    if (!evalTitle.trim() || isNaN(w) || w < 1 || w > 100) return
    const entry: ManualEvalEntry = {
      localId: editingEvalId ?? nextIdRef.current++,
      title:   evalTitle.trim(),
      weight:  w,
      ...(evalDate ? { date: evalDate } : {}),
    }
    if (editingEvalId !== null) {
      setEvals(prev => prev.map(e => e.localId === editingEvalId ? entry : e))
    } else {
      setEvals(prev => [...prev, entry])
    }
    resetEvalForm()
  }

  function removeEval(localId: number) {
    setEvals(prev => prev.filter(e => e.localId !== localId))
    if (editingEvalId === localId) resetEvalForm()
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    const tripletText = `${tripletX}-${tripletY}-${tripletZ}`
    try {
      const res = await fetch(`/api/academique/${courseId}/manual-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripletText,
          evaluations: evals.map(e => ({
            title:  e.title,
            weight: e.weight,
            ...(e.date ? { date: e.date } : {}),
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur inconnue'); return }
      setSaved(true)
      onSuccess(tripletText)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-4 pt-4"
      style={{ borderTop: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <p className="font-space-grotesk text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Saisie manuelle
        </p>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer font-space-grotesk text-[11px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Fermer
        </button>
      </div>

      {/* Triplet — unchanged */}
      <div className="flex flex-col gap-1.5">
        <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Triplet horaire (Cours – Lab – Perso)
        </label>
        <div className="flex items-center gap-2">
          {[
            { val: tripletX, set: setTripletX, label: 'Cours' },
            { val: tripletY, set: setTripletY, label: 'Lab' },
            { val: tripletZ, set: setTripletZ, label: 'Perso' },
          ].map(({ val, set, label }, idx) => (
            <div key={label} className="flex items-center gap-2">
              {idx > 0 && (
                <span className="font-syne font-bold text-[18px]" style={{ color: 'var(--color-text-muted)' }}>–</span>
              )}
              <input
                type="number"
                min={0}
                max={20}
                value={val}
                onChange={e => set(parseInt(e.target.value, 10) || 0)}
                className="rounded-lg px-2 py-1.5 font-syne font-bold text-[16px] text-center w-14"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
                aria-label={label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Évaluations */}
      <div className="flex flex-col gap-2">
        <label className="font-space-grotesk text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
          Évaluations
        </label>

        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Titre de l'évaluation"
            value={evalTitle}
            onChange={e => setEvalTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitEval() }}
            className="rounded-lg px-3 py-1.5 font-space-grotesk text-[12px] flex-1 min-w-[120px]"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="0"
              min={1}
              max={100}
              value={evalWeight}
              onChange={e => setEvalWeight(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitEval() }}
              className="rounded-lg px-2 py-1.5 font-space-grotesk text-[12px] w-14 text-center"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
              aria-label="Pondération %"
            />
            <span className="font-space-grotesk text-[11px]" style={{ color: 'var(--color-text-muted)' }}>%</span>
          </div>
          <input
            type="date"
            value={evalDate}
            onChange={e => setEvalDate(e.target.value)}
            className="cursor-pointer rounded-lg px-2 py-1.5 font-space-grotesk text-[12px]"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-primary)', outline: 'none' }}
            aria-label="Date (optionnelle)"
          />
          <div className="flex gap-2">
            {editingEvalId !== null && (
              <button
                type="button"
                onClick={resetEvalForm}
                className="cursor-pointer font-space-grotesk text-[11px] px-2.5 py-1.5 rounded-lg"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}
              >
                Annuler
              </button>
            )}
            <button
              type="button"
              onClick={commitEval}
              disabled={!evalTitle.trim() || !evalWeight}
              className="cursor-pointer font-space-grotesk text-[11px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap"
              style={{
                background: editingEvalId !== null ? 'rgba(74,158,255,0.15)' : 'rgba(74,158,255,0.12)',
                border: '1px solid rgba(74,158,255,0.3)',
                color: '#4A9EFF',
                opacity: evalTitle.trim() && evalWeight ? 1 : 0.5,
              }}
            >
              {editingEvalId !== null ? 'Valider les changements' : '+ Ajouter'}
            </button>
          </div>
        </div>

        {evals.length > 0 && (
          <div className="flex flex-col gap-1">
            {evals.map(e => {
              const isActive = editingEvalId === e.localId
              return (
                <div
                  key={e.localId}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 cursor-pointer"
                  style={{
                    background: isActive ? 'rgba(74,158,255,0.08)' : 'var(--color-bg-elevated)',
                    border: `1px solid ${isActive ? 'rgba(74,158,255,0.3)' : 'var(--color-border-subtle)'}`,
                  }}
                  onClick={() => startEvalEdit(e)}
                  role="button"
                  aria-label={`Modifier ${e.title}`}
                >
                  <span className="font-space-grotesk text-[12px] min-w-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {e.title}
                    <span className="font-semibold" style={{ color: '#4A9EFF' }}> — {e.weight}%</span>
                    {e.date && <span style={{ color: 'var(--color-text-muted)' }}> ({e.date})</span>}
                  </span>
                  <button
                    type="button"
                    onClick={ev => { ev.stopPropagation(); removeEval(e.localId) }}
                    className="cursor-pointer font-space-grotesk text-[14px] leading-none flex-shrink-0"
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-label={`Supprimer ${e.title}`}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <div
          className="rounded-lg px-3 py-2 font-space-grotesk text-[12px]"
          style={{ background: 'rgba(255,107,157,0.1)', border: '1px solid rgba(255,107,157,0.25)', color: '#FF6B9D' }}
        >
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="cursor-pointer self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : 'var(--color-accent-study)',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
          opacity: saving ? 0.5 : 1,
        }}
      >
        {saving ? 'Sauvegarde…' : saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
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

function SessionScheduleImport({
  courses,
  onSlotsReady,
}: {
  courses: CourseOption[]
  onSlotsReady: (slots: GridSlot[]) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SessionImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)

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
        const msg = json.error ?? 'Erreur inconnue'
        setError(msg)
        if (isApiError(msg)) setShowManual(true)
        return
      }

      setResult({ matched: json.matched, total: json.total, unmatched: json.unmatched ?? [] })

      if (Array.isArray(json.slots) && json.slots.length > 0) {
        onSlotsReady(buildGridSlots(json.slots, GRID_START, GRID_END))
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
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

      {/* Link to manual entry (always accessible) */}
      {!showManual && courses.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="cursor-pointer font-space-grotesk text-[11px]"
            style={{ color: 'var(--color-text-muted)', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          >
            Saisir manuellement
          </button>
        </div>
      )}

      {showManual && (
        <ManualHoraireForm
          courses={courses}
          onSlotsReady={onSlotsReady}
          onClose={() => setShowManual(false)}
        />
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
    setSaved(false)
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
          onChange={e => { setSaved(false); setPrefs(p => ({ ...p, frequencyPerWeek: parseInt(e.target.value) })) }}
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
          onChange={e => { setSaved(false); setPrefs(p => ({ ...p, sessionDurationMinutes: parseInt(e.target.value) })) }}
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
                onClick={() => { setSaved(false); setPrefs(p => ({ ...p, preferredTime: t })) }}
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
        disabled={saved}
        className="self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : '#FFD166',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
          cursor: saved ? 'default' : 'pointer',
          opacity: saved ? 0.85 : 1,
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
        disabled={saved}
        className="self-end font-space-grotesk text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-150"
        style={{
          background: saved ? 'rgba(168,255,120,0.12)' : 'var(--color-accent-study)',
          color: saved ? 'var(--color-accent-rec)' : 'var(--color-bg-base)',
          border: saved ? '1px solid rgba(168,255,120,0.3)' : 'none',
          cursor: saved ? 'default' : 'pointer',
          opacity: saved ? 0.85 : 1,
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
        <SessionScheduleImport
          courses={courses.map(c => ({ id: c.id, code: c.code, name: c.name }))}
          onSlotsReady={handleSessionSlotsReady}
        />
      </section>

      {/* ── Grille horaire visuelle ── */}
      <section aria-labelledby="grid-section">
        <h2 id="grid-section" className="font-syne font-bold text-[18px] mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Grille horaire
        </h2>
        {slots.length > 0 ? (
          <ScheduleGrid
            slots={slots}
            courseNameMap={Object.fromEntries(courses.map(c => [c.code, c.name]))}
          />
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
