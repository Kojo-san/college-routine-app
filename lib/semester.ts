import type { ScheduleSlot } from './schedule'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GridSlot {
  colIndex: number    // 0=Lun, 1=Mar, 2=Mer, 3=Jeu, 4=Ven
  topPct: number
  heightPct: number
  type: 'COURS' | 'LAB'
  startTime: string
  endTime: string
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
      endTime: slot.endTime,
    })
  }

  return result
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
