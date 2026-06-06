import type { ScheduleSlot } from './schedule'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GridSlot {
  colIndex: number    // 0=Lun, 1=Mar, 2=Mer, 3=Jeu, 4=Ven
  topPct: number
  heightPct: number
  type: 'COURS' | 'LAB'
  startTime: string
  endTime: string
  code?: string       // course code, e.g. "INF2610"
  room?: string       // room, e.g. "A416"
  group?: string      // group number, e.g. "02"
}

export interface Triplet {
  lecture: number    // heures cours magistral/semaine
  lab: number        // heures labo/semaine
  personal: number   // heures perso recommandées/semaine
}

// ─── Pure functions ───────────────────────────────────────────────────────────

export function calculateStudyMinutesPerDay(personalHoursPerWeek: number): number {
  if (personalHoursPerWeek <= 0) return 0
  return Math.round((personalHoursPerWeek / 5) * 60)
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// dayOfWeek: 1=Lun→colIndex 0, 2=Mar→1, ..., 5=Ven→4. Weekend ignored.
const DOW_TO_COL: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 }

export function buildGridSlots(
  slots: ScheduleSlot[],
  gridStartHour: number,
  gridEndHour: number,
): GridSlot[] {
  const gridStart = gridStartHour * 60
  const gridEnd   = gridEndHour   * 60
  const range     = gridEnd - gridStart

  const result: GridSlot[] = []

  for (const slot of slots) {
    const col = DOW_TO_COL[slot.dayOfWeek]
    if (col === undefined) continue

    const start = parseMinutes(slot.startTime)
    const end   = parseMinutes(slot.endTime)

    if (start < gridStart || end > gridEnd) continue

    const topPct    = ((start - gridStart) / range) * 100
    const heightPct = ((end - start) / range) * 100

    result.push({
      colIndex: col,
      topPct,
      heightPct,
      type: slot.type,
      startTime: slot.startTime,
      endTime:   slot.endTime,
      ...(slot.code  ? { code:  slot.code  } : {}),
      ...(slot.room  ? { room:  slot.room  } : {}),
      ...(slot.group ? { group: slot.group } : {}),
    })
  }

  return result
}

// ─── parseClaudeScheduleJson ──────────────────────────────────────────────────

const HHMM_RE = /^\d{2}:\d{2}$/

export function parseClaudeScheduleJson(raw: string): { schedules: ScheduleSlot[]; tripletText: string } {
  const empty = { schedules: [], tripletText: '' }
  try {
    const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const parsed = JSON.parse(stripped) as Record<string, unknown>

    const tripletText = typeof parsed.tripletText === 'string' ? parsed.tripletText : ''

    const raw_slots = Array.isArray(parsed.schedules) ? parsed.schedules : []
    const schedules: ScheduleSlot[] = raw_slots
      .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object')
      .filter(s => {
        const dow = s.dayOfWeek
        return typeof dow === 'number' && dow >= 0 && dow <= 6
      })
      .filter(s => s.type === 'COURS' || s.type === 'LAB')
      .filter(s => typeof s.startTime === 'string' && HHMM_RE.test(s.startTime as string))
      .filter(s => typeof s.endTime === 'string' && HHMM_RE.test(s.endTime as string))
      .map(s => ({
        dayOfWeek: s.dayOfWeek as number,
        startTime: s.startTime as string,
        endTime:   s.endTime as string,
        type:      s.type as 'COURS' | 'LAB',
        ...(typeof s.room  === 'string' && s.room  ? { room:  s.room  as string } : {}),
        ...(typeof s.group === 'string' && s.group ? { group: s.group as string } : {}),
      }))

    return { schedules, tripletText }
  } catch {
    return empty
  }
}

// ─── parsePolyHoraireJson ─────────────────────────────────────────────────────

export interface ParsedCourseSlot {
  code: string
  dayOfWeek: number
  startTime: string
  endTime: string
  type: 'COURS' | 'LAB'
  room?: string
  group?: string
}

export function parsePolyHoraireJson(raw: string): ParsedCourseSlot[] {
  try {
    const stripped = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const parsed = JSON.parse(stripped) as Record<string, unknown>
    const rawSlots = Array.isArray(parsed.slots) ? parsed.slots : []

    return (rawSlots as unknown[])
      .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object')
      .filter(s => typeof s.code === 'string' && (s.code as string).trim().length > 0)
      .filter(s => typeof s.dayOfWeek === 'number' && (s.dayOfWeek as number) >= 0 && (s.dayOfWeek as number) <= 6)
      .filter(s => s.type === 'COURS' || s.type === 'LAB')
      .filter(s => typeof s.startTime === 'string' && HHMM_RE.test(s.startTime as string))
      .filter(s => typeof s.endTime === 'string' && HHMM_RE.test(s.endTime as string))
      .map(s => ({
        code:      (s.code as string).trim().toUpperCase(),
        dayOfWeek: s.dayOfWeek as number,
        startTime: s.startTime as string,
        endTime:   s.endTime as string,
        type:      s.type as 'COURS' | 'LAB',
        ...(typeof s.room  === 'string' && s.room  ? { room:  (s.room  as string).trim() } : {}),
        ...(typeof s.group === 'string' && s.group ? { group: (s.group as string).trim() } : {}),
      }))
  } catch {
    return []
  }
}

const TRIPLET_RE = /(\d)\s*[-–]\s*(\d)\s*[-–]\s*(\d)/

export function extractTriplet(text: string): Triplet | null {
  const match = TRIPLET_RE.exec(text)
  if (!match) return null
  return {
    lecture:  parseInt(match[1], 10),
    lab:      parseInt(match[2], 10),
    personal: parseInt(match[3], 10),
  }
}
