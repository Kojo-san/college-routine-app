import type { SleepInput, ActivityInput, HeartRateInput } from './health'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppleHealthRecord {
  date: string
  sleep?: {
    durationHours: number
    efficiency: number      // 0.0 to 1.0
    deepSleepMinutes: number
  }
  activity?: {
    steps: number
    activeCalories: number
    workoutMinutes: number
  }
  heartRate?: {
    resting: number
    average: number
  }
}

export interface HealthDayInput {
  date: string
  sleep?: SleepInput
  activity?: ActivityInput
  heartRate?: HeartRateInput
}

// YYYY-MM-DD regex
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(s: unknown): s is string {
  return typeof s === 'string' && DATE_RE.test(s)
}

// ─── Pure functions ───────────────────────────────────────────────────────────

export function parseAppleHealthExport(json: unknown): AppleHealthRecord[] {
  if (!Array.isArray(json)) {
    throw new Error('Apple Health export must be a JSON array')
  }

  const records: AppleHealthRecord[] = []

  for (const item of json) {
    if (typeof item !== 'object' || item === null) continue
    const obj = item as Record<string, unknown>

    if (!isValidDate(obj.date)) continue

    const record: AppleHealthRecord = { date: obj.date }

    const sleep = obj.sleep
    if (
      typeof sleep === 'object' && sleep !== null &&
      typeof (sleep as Record<string, unknown>).durationHours === 'number' &&
      typeof (sleep as Record<string, unknown>).efficiency === 'number' &&
      typeof (sleep as Record<string, unknown>).deepSleepMinutes === 'number'
    ) {
      const s = sleep as { durationHours: number; efficiency: number; deepSleepMinutes: number }
      record.sleep = { durationHours: s.durationHours, efficiency: s.efficiency, deepSleepMinutes: s.deepSleepMinutes }
    }

    const activity = obj.activity
    if (
      typeof activity === 'object' && activity !== null &&
      typeof (activity as Record<string, unknown>).steps === 'number' &&
      typeof (activity as Record<string, unknown>).activeCalories === 'number' &&
      typeof (activity as Record<string, unknown>).workoutMinutes === 'number'
    ) {
      const a = activity as { steps: number; activeCalories: number; workoutMinutes: number }
      record.activity = { steps: a.steps, activeCalories: a.activeCalories, workoutMinutes: a.workoutMinutes }
    }

    const heartRate = obj.heartRate
    if (
      typeof heartRate === 'object' && heartRate !== null &&
      typeof (heartRate as Record<string, unknown>).resting === 'number' &&
      typeof (heartRate as Record<string, unknown>).average === 'number'
    ) {
      const h = heartRate as { resting: number; average: number }
      record.heartRate = { resting: h.resting, average: h.average }
    }

    records.push(record)
  }

  return records
}

export function recordToHealthInput(record: AppleHealthRecord): HealthDayInput {
  const result: HealthDayInput = { date: record.date }

  if (record.sleep) {
    result.sleep = {
      sleepDurationHours: record.sleep.durationHours,
      sleepEfficiency: record.sleep.efficiency,
      deepSleepMinutes: record.sleep.deepSleepMinutes,
    }
  }

  if (record.activity) {
    result.activity = {
      steps: record.activity.steps,
      activeCalories: record.activity.activeCalories,
      workoutMinutes: record.activity.workoutMinutes,
    }
  }

  if (record.heartRate) {
    result.heartRate = {
      restingHeartRate: record.heartRate.resting,
      averageHeartRate: record.heartRate.average,
    }
  }

  return result
}
