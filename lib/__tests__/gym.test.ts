import { describe, it, expect } from 'vitest'
import {
  getGymRotationType,
  buildWgerUrl,
  mapWgerCategory,
  filterExercisesForDuration,
} from '../gym'
import type { WgerExercise } from '../gym'

describe('getGymRotationType', () => {
  it('cycles Push → Pull → Legs → Full Body', () => {
    expect(getGymRotationType(0)).toBe('Push Day')
    expect(getGymRotationType(1)).toBe('Pull Day')
    expect(getGymRotationType(2)).toBe('Leg Day')
    expect(getGymRotationType(3)).toBe('Full Body')
  })

  it('wraps around after 4', () => {
    expect(getGymRotationType(4)).toBe('Push Day')
    expect(getGymRotationType(7)).toBe('Full Body')
  })

  it('handles negative indices gracefully', () => {
    const result = getGymRotationType(-1)
    expect(['Push Day', 'Pull Day', 'Leg Day', 'Full Body', 'Cardio', 'Stretching']).toContain(result)
  })
})

describe('buildWgerUrl', () => {
  it('returns a valid URL string', () => {
    const url = buildWgerUrl({ language: 2, limit: 20 })
    expect(url).toMatch(/https:\/\/wger\.de\/api\/v2\/exercise/)
    expect(url).toContain('language=2')
    expect(url).toContain('limit=20')
  })

  it('includes category when provided', () => {
    const url = buildWgerUrl({ language: 2, category: 10 })
    expect(url).toContain('category=10')
  })
})

describe('mapWgerCategory', () => {
  it('maps known gym types to wger category IDs', () => {
    expect(mapWgerCategory('Push Day')).toBeGreaterThan(0)
    expect(mapWgerCategory('Pull Day')).toBeGreaterThan(0)
    expect(mapWgerCategory('Cardio')).toBeGreaterThan(0)
  })

  it('returns a fallback for unknown types', () => {
    const id = mapWgerCategory('Unknown Type')
    expect(typeof id).toBe('number')
  })
})

describe('filterExercisesForDuration', () => {
  const exercises: WgerExercise[] = [
    { id: 1, name: 'Bench Press', category: 'Chest', muscles: ['Pectoraux'], sets: 4, reps: 8, durationMinutes: 15 },
    { id: 2, name: 'Push-up', category: 'Chest', muscles: ['Pectoraux'], sets: 3, reps: 12, durationMinutes: 8 },
    { id: 3, name: 'Dumbbell Fly', category: 'Chest', muscles: ['Pectoraux'], sets: 3, reps: 10, durationMinutes: 10 },
    { id: 4, name: 'Tricep Pushdown', category: 'Triceps', muscles: ['Triceps'], sets: 3, reps: 12, durationMinutes: 8 },
  ]

  it('selects exercises fitting within duration budget', () => {
    const result = filterExercisesForDuration(exercises, 30)
    const totalTime = result.reduce((s, e) => s + e.durationMinutes, 0)
    expect(totalTime).toBeLessThanOrEqual(30)
  })

  it('returns at least 1 exercise when duration >= min exercise time', () => {
    const result = filterExercisesForDuration(exercises, 10)
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('returns empty array when duration is 0', () => {
    expect(filterExercisesForDuration(exercises, 0)).toHaveLength(0)
  })
})
