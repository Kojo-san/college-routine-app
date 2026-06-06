import { describe, it, expect } from 'vitest'
import {
  calculateStudyMinutesPerDay,
  buildGridSlots,
  extractTriplet,
  parseClaudeScheduleJson,
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
