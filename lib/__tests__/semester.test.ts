import { describe, it, expect } from 'vitest'
import {
  calculateStudyMinutesPerDay,
  buildGridSlots,
  extractTriplet,
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
