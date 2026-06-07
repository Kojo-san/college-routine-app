import { describe, it, expect } from 'vitest'
import {
  calculateStudyMinutesPerDay,
  buildGridSlots,
  extractTriplet,
  parseClaudeScheduleJson,
  parsePolyHoraireJson,
  detectScheduleConflicts,
} from '../semester'
import type { GridSlot } from '../semester'
import type { ScheduleSlot } from '../schedule'

describe('calculateStudyMinutesPerDay', () => {
  it('divides weekly hours by 5 and converts to minutes', () => {
    expect(calculateStudyMinutesPerDay(10)).toBe(120)
  })

  it('handles fractional hours', () => {
    expect(calculateStudyMinutesPerDay(3)).toBe(36)
  })

  it('returns 0 for 0 input', () => {
    expect(calculateStudyMinutesPerDay(0)).toBe(0)
  })

  it('clamps to 0 for negative input', () => {
    expect(calculateStudyMinutesPerDay(-5)).toBe(0)
  })
})

describe('buildGridSlots', () => {
  const slots: ScheduleSlot[] = [
    { dayOfWeek: 1, startTime: '08:30', endTime: '10:00', type: 'COURS' },
    { dayOfWeek: 3, startTime: '14:00', endTime: '16:00', type: 'LAB' },
  ]

  it('converts slots to grid format with pixel positions', () => {
    const grid = buildGridSlots(slots, 7, 22)
    expect(grid).toHaveLength(2)
  })

  it('maps dayOfWeek to column index (1=Mon=0, 2=Tue=1, etc.)', () => {
    const grid = buildGridSlots(slots, 7, 22)
    expect(grid[0].colIndex).toBe(0) // lundi = col 0
    expect(grid[1].colIndex).toBe(2) // mercredi = col 2
  })

  it('computes topPct between 0 and 100', () => {
    const grid = buildGridSlots(slots, 7, 22)
    for (const g of grid) {
      expect(g.topPct).toBeGreaterThanOrEqual(0)
      expect(g.topPct).toBeLessThanOrEqual(100)
    }
  })

  it('computes heightPct > 0', () => {
    const grid = buildGridSlots(slots, 7, 22)
    for (const g of grid) {
      expect(g.heightPct).toBeGreaterThan(0)
    }
  })

  it('filters out slots outside the display window', () => {
    const outOfRange: ScheduleSlot[] = [
      { dayOfWeek: 0, startTime: '06:00', endTime: '07:00', type: 'COURS' }, // before 7h
    ]
    const grid = buildGridSlots(outOfRange, 7, 22)
    expect(grid).toHaveLength(0)
  })

  it('passes through code, room, group when present', () => {
    const withMeta: ScheduleSlot[] = [
      { dayOfWeek: 1, startTime: '08:30', endTime: '11:30', type: 'COURS', code: 'INF2610', room: 'M-1510', group: '02' },
    ]
    const grid = buildGridSlots(withMeta, 7, 22)
    expect(grid[0].code).toBe('INF2610')
    expect(grid[0].room).toBe('M-1510')
    expect(grid[0].group).toBe('02')
  })

  it('omits code/room/group when absent', () => {
    const grid = buildGridSlots(slots, 7, 22)
    expect(grid[0].code).toBeUndefined()
    expect(grid[0].room).toBeUndefined()
  })
})

describe('extractTriplet', () => {
  it('extracts a standard triplet like 3-2-3', () => {
    const result = extractTriplet('INF3405 — Semaine type : 3-2-3')
    expect(result).toEqual({ lecture: 3, lab: 2, personal: 3 })
  })

  it('handles extra spaces', () => {
    const result = extractTriplet('Charge de travail : 3 - 2 - 3')
    expect(result).toEqual({ lecture: 3, lab: 2, personal: 3 })
  })

  it('returns null when no triplet found', () => {
    expect(extractTriplet('Aucun triplet ici')).toBeNull()
  })

  it('returns null for partial matches', () => {
    expect(extractTriplet('1-2')).toBeNull()
  })
})

// ─── parseClaudeScheduleJson ──────────────────────────────────────────────────

describe('parseClaudeScheduleJson', () => {
  it('tracer: extracts schedules and tripletText from a clean JSON string', () => {
    const raw = JSON.stringify({
      schedules: [{ dayOfWeek: 1, startTime: '08:30', endTime: '10:20', type: 'COURS' }],
      tripletText: '3-1-4.5',
    })
    const result = parseClaudeScheduleJson(raw)
    expect(result.schedules).toHaveLength(1)
    expect(result.schedules[0]).toMatchObject({ dayOfWeek: 1, startTime: '08:30', endTime: '10:20', type: 'COURS' })
    expect(result.tripletText).toBe('3-1-4.5')
  })

  it('strips markdown ```json fenced block before parsing', () => {
    const inner = JSON.stringify({
      schedules: [{ dayOfWeek: 3, startTime: '13:00', endTime: '15:00', type: 'LAB' }],
      tripletText: '3-2-3',
    })
    const raw = '```json\n' + inner + '\n```'
    const result = parseClaudeScheduleJson(raw)
    expect(result.schedules).toHaveLength(1)
    expect(result.schedules[0].type).toBe('LAB')
  })

  it('returns empty result on malformed JSON', () => {
    const result = parseClaudeScheduleJson('not json at all { broken')
    expect(result.schedules).toEqual([])
    expect(result.tripletText).toBe('')
  })

  it('filters out slots with dayOfWeek > 6', () => {
    const raw = JSON.stringify({
      schedules: [
        { dayOfWeek: 8, startTime: '09:00', endTime: '10:00', type: 'COURS' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', type: 'COURS' },
      ],
      tripletText: '',
    })
    const result = parseClaudeScheduleJson(raw)
    expect(result.schedules).toHaveLength(1)
    expect(result.schedules[0].dayOfWeek).toBe(2)
  })

  it('filters out slots with negative dayOfWeek', () => {
    const raw = JSON.stringify({
      schedules: [{ dayOfWeek: -1, startTime: '09:00', endTime: '10:00', type: 'COURS' }],
      tripletText: '',
    })
    expect(parseClaudeScheduleJson(raw).schedules).toHaveLength(0)
  })

  it('filters out slots with invalid type (not COURS or LAB)', () => {
    const raw = JSON.stringify({
      schedules: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', type: 'SEMINAR' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', type: 'LAB' },
      ],
      tripletText: '',
    })
    const result = parseClaudeScheduleJson(raw)
    expect(result.schedules).toHaveLength(1)
    expect(result.schedules[0].type).toBe('LAB')
  })

  it('returns empty tripletText when field is absent', () => {
    const raw = JSON.stringify({
      schedules: [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', type: 'COURS' }],
    })
    expect(parseClaudeScheduleJson(raw).tripletText).toBe('')
  })

  it('filters out slots with times not matching HH:MM format', () => {
    const raw = JSON.stringify({
      schedules: [
        { dayOfWeek: 1, startTime: '9:00', endTime: '10:00', type: 'COURS' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '10:00', type: 'COURS' },
      ],
      tripletText: '',
    })
    const result = parseClaudeScheduleJson(raw)
    expect(result.schedules).toHaveLength(1)
    expect(result.schedules[0].dayOfWeek).toBe(2)
  })

  it('handles null items inside schedules array gracefully', () => {
    const raw = JSON.stringify({
      schedules: [null, { dayOfWeek: 1, startTime: '09:00', endTime: '10:00', type: 'COURS' }],
      tripletText: '2-1-3',
    })
    const result = parseClaudeScheduleJson(raw)
    expect(result.schedules).toHaveLength(1)
  })
})

// ─── parsePolyHoraireJson ─────────────────────────────────────────────────────

describe('parsePolyHoraireJson', () => {
  it('tracer: extracts course slots from clean JSON string', () => {
    const raw = JSON.stringify({
      slots: [
        { code: 'INF2610', dayOfWeek: 3, startTime: '08:30', endTime: '11:30', type: 'COURS' },
        { code: 'LOG2995', dayOfWeek: 2, startTime: '09:30', endTime: '17:35', type: 'COURS' },
      ],
    })
    const result = parsePolyHoraireJson(raw)
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ code: 'INF2610', dayOfWeek: 3, startTime: '08:30', endTime: '11:30', type: 'COURS' })
    expect(result[1].code).toBe('LOG2995')
  })

  it('strips markdown ```json fenced block before parsing', () => {
    const inner = JSON.stringify({ slots: [{ code: 'CHM2210', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', type: 'COURS' }] })
    const result = parsePolyHoraireJson('```json\n' + inner + '\n```')
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('CHM2210')
  })

  it('returns empty array on malformed JSON', () => {
    expect(parsePolyHoraireJson('not json { broken')).toEqual([])
  })

  it('filters out slots with dayOfWeek outside 0–6', () => {
    const raw = JSON.stringify({ slots: [
      { code: 'INF2610', dayOfWeek: 8, startTime: '08:00', endTime: '10:00', type: 'COURS' },
      { code: 'LOG2995', dayOfWeek: 2, startTime: '08:00', endTime: '10:00', type: 'COURS' },
    ]})
    expect(parsePolyHoraireJson(raw)).toHaveLength(1)
  })

  it('filters out slots with invalid type', () => {
    const raw = JSON.stringify({ slots: [
      { code: 'INF2610', dayOfWeek: 1, startTime: '08:00', endTime: '10:00', type: 'SEMINAR' },
      { code: 'LOG2995', dayOfWeek: 2, startTime: '08:00', endTime: '10:00', type: 'LAB' },
    ]})
    const result = parsePolyHoraireJson(raw)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('LAB')
  })

  it('filters out slots with times not matching HH:MM', () => {
    const raw = JSON.stringify({ slots: [
      { code: 'INF2610', dayOfWeek: 1, startTime: '8:30', endTime: '10:00', type: 'COURS' },
      { code: 'LOG2995', dayOfWeek: 2, startTime: '09:30', endTime: '11:00', type: 'COURS' },
    ]})
    expect(parsePolyHoraireJson(raw)).toHaveLength(1)
  })

  it('trims and uppercases course code', () => {
    const raw = JSON.stringify({ slots: [
      { code: '  inf2610  ', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', type: 'COURS' },
    ]})
    expect(parsePolyHoraireJson(raw)[0].code).toBe('INF2610')
  })

  it('returns empty array when slots field is missing', () => {
    const raw = JSON.stringify({ other: 'data' })
    expect(parsePolyHoraireJson(raw)).toEqual([])
  })

  it('filters out slots with empty code', () => {
    const raw = JSON.stringify({ slots: [
      { code: '', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', type: 'COURS' },
      { code: 'INF2610', dayOfWeek: 1, startTime: '09:00', endTime: '11:00', type: 'COURS' },
    ]})
    expect(parsePolyHoraireJson(raw)).toHaveLength(1)
  })

  it('passes through room and group when present', () => {
    const raw = JSON.stringify({ slots: [
      { code: 'INF3405', dayOfWeek: 4, startTime: '08:30', endTime: '11:30', type: 'COURS', room: 'A416', group: '02' },
    ]})
    const result = parsePolyHoraireJson(raw)
    expect(result[0].room).toBe('A416')
    expect(result[0].group).toBe('02')
  })

  it('omits room and group when absent', () => {
    const raw = JSON.stringify({ slots: [
      { code: 'INF2610', dayOfWeek: 5, startTime: '08:30', endTime: '11:30', type: 'COURS' },
    ]})
    const result = parsePolyHoraireJson(raw)
    expect(result[0].room).toBeUndefined()
    expect(result[0].group).toBeUndefined()
  })
})

describe('detectScheduleConflicts', () => {
  it('returns no conflicts when slots are on different days', () => {
    const incoming = { dayOfWeek: 1, startTime: '09:00', endTime: '11:00', courseCode: 'INF2610' }
    const existing = [{ dayOfWeek: 2, startTime: '09:00', endTime: '11:00', courseCode: 'INF3405' }]
    expect(detectScheduleConflicts(incoming, existing)).toEqual([])
  })

  it('returns no conflicts when existing ends before incoming starts (same day)', () => {
    const incoming = { dayOfWeek: 1, startTime: '13:00', endTime: '15:00', courseCode: 'INF2610' }
    const existing = [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00', courseCode: 'INF3405' }]
    expect(detectScheduleConflicts(incoming, existing)).toEqual([])
  })

  it('returns no conflicts when slots are adjacent (touching edges)', () => {
    const incoming = { dayOfWeek: 1, startTime: '11:00', endTime: '13:00', courseCode: 'INF2610' }
    const existing = [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00', courseCode: 'INF3405' }]
    expect(detectScheduleConflicts(incoming, existing)).toEqual([])
  })

  it('detects conflict when slots partially overlap on same day', () => {
    const incoming = { dayOfWeek: 1, startTime: '10:00', endTime: '12:00', courseCode: 'INF2610' }
    const existing = [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00', courseCode: 'INF3405' }]
    expect(detectScheduleConflicts(incoming, existing)).toHaveLength(1)
  })

  it('detects conflict when incoming is fully contained in existing', () => {
    const incoming = { dayOfWeek: 3, startTime: '10:00', endTime: '11:00', courseCode: 'INF2610' }
    const existing = [{ dayOfWeek: 3, startTime: '09:00', endTime: '12:00', courseCode: 'INF3405' }]
    expect(detectScheduleConflicts(incoming, existing)).toHaveLength(1)
  })

  it('returns correct ConflictInfo fields', () => {
    const incoming = { dayOfWeek: 1, startTime: '10:00', endTime: '12:00', courseCode: 'INF2610' }
    const existing = [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00', courseCode: 'INF3405' }]
    const conflicts = detectScheduleConflicts(incoming, existing)
    expect(conflicts[0]).toEqual({
      existingCode: 'INF3405',
      day: 'Lun',
      startTime: '09:00',
      endTime: '11:00',
    })
  })

  it('returns all conflicts when multiple existing slots overlap', () => {
    const incoming = { dayOfWeek: 2, startTime: '09:00', endTime: '12:00', courseCode: 'INF2610' }
    const existing = [
      { dayOfWeek: 2, startTime: '08:00', endTime: '10:00', courseCode: 'INF3405' },
      { dayOfWeek: 2, startTime: '11:00', endTime: '13:00', courseCode: 'LOG2995' },
      { dayOfWeek: 2, startTime: '14:00', endTime: '16:00', courseCode: 'MTH2304' },
    ]
    const conflicts = detectScheduleConflicts(incoming, existing)
    expect(conflicts).toHaveLength(2)
    expect(conflicts.map(c => c.existingCode)).toEqual(['INF3405', 'LOG2995'])
  })
})
