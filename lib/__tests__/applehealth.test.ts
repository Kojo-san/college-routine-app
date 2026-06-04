import { describe, it, expect } from 'vitest'
import { parseAppleHealthExport, recordToHealthInput } from '../applehealth'
import type { AppleHealthRecord } from '../applehealth'

// ─── parseAppleHealthExport ───────────────────────────────────────────────────

describe('parseAppleHealthExport', () => {
  it('tracer: returns an array for a valid input', () => {
    const input = [{ date: '2026-06-01' }]
    const result = parseAppleHealthExport(input)
    expect(Array.isArray(result)).toBe(true)
  })

  it('throws for a non-array input', () => {
    expect(() => parseAppleHealthExport({ date: '2026-06-01' })).toThrow()
    expect(() => parseAppleHealthExport('string')).toThrow()
    expect(() => parseAppleHealthExport(null)).toThrow()
  })

  it('returns an empty array for an empty array input', () => {
    expect(parseAppleHealthExport([])).toEqual([])
  })

  it('parses a valid record with sleep data', () => {
    const input = [
      {
        date: '2026-06-01',
        sleep: { durationHours: 7.5, efficiency: 0.9, deepSleepMinutes: 80 },
      },
    ]
    const records = parseAppleHealthExport(input)
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2026-06-01')
    expect(records[0].sleep?.durationHours).toBe(7.5)
  })

  it('parses a valid record with activity data', () => {
    const input = [
      {
        date: '2026-06-02',
        activity: { steps: 8500, activeCalories: 420, workoutMinutes: 45 },
      },
    ]
    const records = parseAppleHealthExport(input)
    expect(records[0].activity?.steps).toBe(8500)
  })

  it('parses a valid record with heartRate data', () => {
    const input = [
      {
        date: '2026-06-03',
        heartRate: { resting: 58, average: 72 },
      },
    ]
    const records = parseAppleHealthExport(input)
    expect(records[0].heartRate?.resting).toBe(58)
  })

  it('filters out records with an invalid date format', () => {
    const input = [
      { date: 'not-a-date', sleep: { durationHours: 7, efficiency: 0.8, deepSleepMinutes: 60 } },
      { date: '2026-06-01', sleep: { durationHours: 7.5, efficiency: 0.9, deepSleepMinutes: 80 } },
    ]
    const records = parseAppleHealthExport(input)
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe('2026-06-01')
  })

  it('filters out records where date is missing', () => {
    const input = [
      { sleep: { durationHours: 7, efficiency: 0.8, deepSleepMinutes: 60 } },
      { date: '2026-06-01' },
    ]
    const records = parseAppleHealthExport(input)
    expect(records).toHaveLength(1)
  })

  it('accepts records with no health sub-objects (date-only record)', () => {
    const input = [{ date: '2026-06-01' }]
    const records = parseAppleHealthExport(input)
    expect(records).toHaveLength(1)
    expect(records[0].sleep).toBeUndefined()
  })

  it('parses multiple records', () => {
    const input = [
      { date: '2026-06-01', sleep: { durationHours: 7, efficiency: 0.85, deepSleepMinutes: 70 } },
      { date: '2026-06-02', activity: { steps: 9000, activeCalories: 500, workoutMinutes: 60 } },
      { date: '2026-06-03', heartRate: { resting: 60, average: 75 } },
    ]
    expect(parseAppleHealthExport(input)).toHaveLength(3)
  })
})

// ─── recordToHealthInput ──────────────────────────────────────────────────────

describe('recordToHealthInput', () => {
  it('tracer: returns an object with a date field', () => {
    const record: AppleHealthRecord = { date: '2026-06-01' }
    const input = recordToHealthInput(record)
    expect(input.date).toBe('2026-06-01')
  })

  it('maps sleep fields correctly', () => {
    const record: AppleHealthRecord = {
      date: '2026-06-01',
      sleep: { durationHours: 7.5, efficiency: 0.9, deepSleepMinutes: 80 },
    }
    const input = recordToHealthInput(record)
    expect(input.sleep).toBeDefined()
    expect(input.sleep!.sleepDurationHours).toBe(7.5)
    expect(input.sleep!.sleepEfficiency).toBe(0.9)
    expect(input.sleep!.deepSleepMinutes).toBe(80)
  })

  it('maps activity fields correctly', () => {
    const record: AppleHealthRecord = {
      date: '2026-06-02',
      activity: { steps: 8000, activeCalories: 400, workoutMinutes: 45 },
    }
    const input = recordToHealthInput(record)
    expect(input.activity).toBeDefined()
    expect(input.activity!.steps).toBe(8000)
    expect(input.activity!.activeCalories).toBe(400)
    expect(input.activity!.workoutMinutes).toBe(45)
  })

  it('maps heartRate fields correctly', () => {
    const record: AppleHealthRecord = {
      date: '2026-06-03',
      heartRate: { resting: 58, average: 72 },
    }
    const input = recordToHealthInput(record)
    expect(input.heartRate).toBeDefined()
    expect(input.heartRate!.restingHeartRate).toBe(58)
    expect(input.heartRate!.averageHeartRate).toBe(72)
  })

  it('returns undefined for absent health sub-objects', () => {
    const record: AppleHealthRecord = { date: '2026-06-01' }
    const input = recordToHealthInput(record)
    expect(input.sleep).toBeUndefined()
    expect(input.activity).toBeUndefined()
    expect(input.heartRate).toBeUndefined()
  })

  it('handles a record with all three health types', () => {
    const record: AppleHealthRecord = {
      date: '2026-06-04',
      sleep: { durationHours: 8, efficiency: 0.92, deepSleepMinutes: 90 },
      activity: { steps: 10000, activeCalories: 600, workoutMinutes: 60 },
      heartRate: { resting: 55, average: 70 },
    }
    const input = recordToHealthInput(record)
    expect(input.sleep).toBeDefined()
    expect(input.activity).toBeDefined()
    expect(input.heartRate).toBeDefined()
  })
})
