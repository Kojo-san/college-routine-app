import { describe, it, expect } from 'vitest'
import {
  getRotationTypeForDayOfWeek,
  TAB_TO_DB_TYPES,
  ALL_GYM_TABS,
  SESSION_TYPE_COLORS,
  estimateSessionMinutes,
} from '../gym'
import type { GymTabType } from '../gym'

describe('getRotationTypeForDayOfWeek', () => {
  it('maps each day of the week to a tab type', () => {
    expect(getRotationTypeForDayOfWeek(0)).toBe('Full Body')    // Dimanche
    expect(getRotationTypeForDayOfWeek(1)).toBe('Push Day')     // Lundi
    expect(getRotationTypeForDayOfWeek(2)).toBe('Pull Day')     // Mardi
    expect(getRotationTypeForDayOfWeek(3)).toBe('Legs & Abs')   // Mercredi
    expect(getRotationTypeForDayOfWeek(4)).toBe('Full Body')    // Jeudi
    expect(getRotationTypeForDayOfWeek(5)).toBe('Cardio')       // Vendredi
    expect(getRotationTypeForDayOfWeek(6)).toBe('Stretching')   // Samedi
  })

  it('returns Full Body as fallback for out-of-range values', () => {
    expect(getRotationTypeForDayOfWeek(99)).toBe('Full Body')
    expect(getRotationTypeForDayOfWeek(-1)).toBe('Full Body')
  })

  it('returns a valid GymTabType for every day 0-6', () => {
    for (let d = 0; d <= 6; d++) {
      expect(ALL_GYM_TABS).toContain(getRotationTypeForDayOfWeek(d))
    }
  })
})

describe('TAB_TO_DB_TYPES', () => {
  it('maps Push Day to PUSH only', () => {
    expect(TAB_TO_DB_TYPES['Push Day']).toEqual(['PUSH'])
  })

  it('maps Legs & Abs to both LEGS and ABS', () => {
    expect(TAB_TO_DB_TYPES['Legs & Abs']).toContain('LEGS')
    expect(TAB_TO_DB_TYPES['Legs & Abs']).toContain('ABS')
    expect(TAB_TO_DB_TYPES['Legs & Abs']).toHaveLength(2)
  })

  it('all tabs have at least one DB type', () => {
    for (const tab of ALL_GYM_TABS) {
      expect(TAB_TO_DB_TYPES[tab].length).toBeGreaterThan(0)
    }
  })

  it('covers all 7 ExerciseDbTypes across all tabs', () => {
    const allTypes = Object.values(TAB_TO_DB_TYPES).flat()
    const expected = ['PUSH', 'PULL', 'LEGS', 'ABS', 'FULL_BODY', 'CARDIO', 'STRETCHING']
    for (const t of expected) {
      expect(allTypes).toContain(t)
    }
  })
})

describe('SESSION_TYPE_COLORS', () => {
  it('every GymTabType has a color entry', () => {
    for (const tab of ALL_GYM_TABS) {
      const c = SESSION_TYPE_COLORS[tab]
      expect(c).toBeDefined()
      expect(c.bg).toBeTruthy()
      expect(c.border).toBeTruthy()
      expect(c.text).toBeTruthy()
      expect(c.glow).toBeTruthy()
    }
  })
})

describe('estimateSessionMinutes', () => {
  it('returns 10 minutes for 0 exercises (warmup only)', () => {
    expect(estimateSessionMinutes(0)).toBe(10)
  })

  it('returns 60 minutes for 10 exercises', () => {
    expect(estimateSessionMinutes(10)).toBe(60)
  })

  it('increases linearly with exercise count', () => {
    const a = estimateSessionMinutes(5)
    const b = estimateSessionMinutes(10)
    expect(b).toBeGreaterThan(a)
  })
})

describe('ALL_GYM_TABS', () => {
  it('contains exactly 6 tabs', () => {
    expect(ALL_GYM_TABS).toHaveLength(6)
  })

  it('includes all expected tab labels', () => {
    const expected: GymTabType[] = [
      'Push Day', 'Pull Day', 'Legs & Abs', 'Full Body', 'Cardio', 'Stretching',
    ]
    for (const tab of expected) {
      expect(ALL_GYM_TABS).toContain(tab)
    }
  })
})
