import { describe, it, expect } from 'vitest'
import {
  parseTime,
  formatTime,
  daysUntil,
  deadlineUrgency,
  calcStudyBudget,
  boostStudyBudget,
  shouldIncludeGym,
  generateRecommendations,
  buildSchedule,
  validateTimeBlockPatch,
} from '../planning'
import type {
  PlanningPrefsInput,
  DeadlineInput,
  PlanningContext,
  ScheduleSlot,
} from '../planning'
import type { RecoveryResult, CognitiveResult } from '../health'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const basePrefs: PlanningPrefsInput = {
  preferredWakeTime: '07:00',
  preferredSleepTime: '23:00',
  preferredGymTime: null,
  maxDailyStudyHours: 4,
}

const prefsWithGym: PlanningPrefsInput = {
  ...basePrefs,
  preferredGymTime: '17:00',
}

const today = new Date('2026-06-04T00:00:00.000Z')

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)

const in30Days = new Date(today)
in30Days.setDate(in30Days.getDate() + 30)

const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

const healthyRecovery: RecoveryResult = {
  value: 80,
  physicalFatigue: 20,
  cognitiveFatigue: 30,
  sleepDebt: 0,
}

const poorRecovery: RecoveryResult = {
  value: 30,
  physicalFatigue: 70,
  cognitiveFatigue: 80,
  sleepDebt: 2.5,
}

const fatigueOnly: RecoveryResult = {
  value: 80,
  physicalFatigue: 70,
  cognitiveFatigue: 30,
  sleepDebt: 0,
}

const cogFatigueOnly: RecoveryResult = {
  value: 80,
  physicalFatigue: 20,
  cognitiveFatigue: 80,
  sleepDebt: 0,
}

const lowRecoveryOnly: RecoveryResult = {
  value: 30,
  physicalFatigue: 20,
  cognitiveFatigue: 30,
  sleepDebt: 0,
}

const healthyCognitive: CognitiveResult = {
  focusLevel: 80,
  mentalFatigue: 30,
  stressLevel: 25,
  motivationLevel: 70,
}

const poorCognitive: CognitiveResult = {
  focusLevel: 25,
  mentalFatigue: 80,
  stressLevel: 80,
  motivationLevel: 20,
}

const lowFocusCognitive: CognitiveResult = {
  focusLevel: 30,
  mentalFatigue: 50,
  stressLevel: 40,
  motivationLevel: 50,
}

const highStressCognitive: CognitiveResult = {
  focusLevel: 60,
  mentalFatigue: 50,
  stressLevel: 75,
  motivationLevel: 40,
}

const sampleDeadline: DeadlineInput = {
  id: 'd1',
  title: 'Devoir 1',
  dueDate: tomorrow,
  weight: 50,
  completed: false,
  courseId: 'c1',
  courseCode: 'MTH1102',
  courseDifficulty: 3,
}

const completedDeadline: DeadlineInput = {
  ...sampleDeadline,
  id: 'd2',
  completed: true,
}

const farDeadline: DeadlineInput = {
  ...sampleDeadline,
  id: 'd3',
  dueDate: in30Days,
}

const baseContext: PlanningContext = {
  date: today,
  prefs: basePrefs,
  recovery: healthyRecovery,
  cognitive: healthyCognitive,
  deadlines: [sampleDeadline],
  tasks: [],
}

// ─── parseTime ────────────────────────────────────────────────────────────────

describe('parseTime', () => {
  it('parses "08:00" to 480', () => {
    expect(parseTime('08:00')).toBe(480)
  })

  it('parses "00:00" to 0', () => {
    expect(parseTime('00:00')).toBe(0)
  })

  it('parses "23:59" to 1439', () => {
    expect(parseTime('23:59')).toBe(1439)
  })

  it('parses "01:30" to 90', () => {
    expect(parseTime('01:30')).toBe(90)
  })
})

// ─── formatTime ───────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats 480 to "08:00"', () => {
    expect(formatTime(480)).toBe('08:00')
  })

  it('formats 0 to "00:00"', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats 90 to "01:30"', () => {
    expect(formatTime(90)).toBe('01:30')
  })

  it('formats 1439 to "23:59"', () => {
    expect(formatTime(1439)).toBe('23:59')
  })
})

// ─── daysUntil ────────────────────────────────────────────────────────────────

describe('daysUntil', () => {
  it('returns 0 for the same day', () => {
    expect(daysUntil(today, today)).toBe(0)
  })

  it('returns 1 for tomorrow', () => {
    expect(daysUntil(tomorrow, today)).toBe(1)
  })

  it('returns -1 for yesterday', () => {
    expect(daysUntil(yesterday, today)).toBe(-1)
  })

  it('returns 7 for 7 days ahead', () => {
    const in7 = new Date(today)
    in7.setDate(in7.getDate() + 7)
    expect(daysUntil(in7, today)).toBe(7)
  })
})

// ─── deadlineUrgency ──────────────────────────────────────────────────────────

describe('deadlineUrgency', () => {
  it('returns 0 for a completed deadline', () => {
    expect(deadlineUrgency(completedDeadline, today)).toBe(0)
  })

  it('returns 0 for a past deadline', () => {
    const past = { ...sampleDeadline, dueDate: yesterday }
    expect(deadlineUrgency(past, today)).toBe(0)
  })

  it('returns a high score (>= 70) for a deadline tomorrow with weight 50 and difficulty 3', () => {
    expect(deadlineUrgency(sampleDeadline, today)).toBeGreaterThanOrEqual(70)
  })

  it('returns a low score (<= 30) for a deadline 30 days away', () => {
    expect(deadlineUrgency(farDeadline, today)).toBeLessThanOrEqual(30)
  })

  it('scores a heavier deadline higher than a lighter one at the same distance', () => {
    const heavy = { ...sampleDeadline, weight: 80 }
    const light = { ...sampleDeadline, weight: 10 }
    expect(deadlineUrgency(heavy, today)).toBeGreaterThan(deadlineUrgency(light, today))
  })
})

// ─── calcStudyBudget ──────────────────────────────────────────────────────────

describe('calcStudyBudget', () => {
  it('returns maxDailyStudyHours × 60 for healthy recovery', () => {
    expect(calcStudyBudget(basePrefs, healthyRecovery)).toBe(240)
  })

  it('returns the full budget when recovery is null', () => {
    expect(calcStudyBudget(basePrefs, null)).toBe(240)
  })

  it('reduces budget by 30% when recovery.value < 40', () => {
    const result = calcStudyBudget(basePrefs, lowRecoveryOnly)
    expect(result).toBe(Math.round(240 * 0.7))
  })

  it('reduces budget by 20% when cognitiveFatigue > 70', () => {
    const result = calcStudyBudget(basePrefs, cogFatigueOnly)
    expect(result).toBe(Math.round(240 * 0.8))
  })

  it('applies both reductions when both conditions are met', () => {
    const result = calcStudyBudget(basePrefs, poorRecovery)
    const expected = Math.round(Math.round(240 * 0.7) * 0.8)
    expect(result).toBe(expected)
  })
})

// ─── shouldIncludeGym ─────────────────────────────────────────────────────────

describe('shouldIncludeGym', () => {
  it('returns false when no gymTime in prefs', () => {
    expect(shouldIncludeGym(basePrefs, healthyRecovery)).toBe(false)
  })

  it('returns true when gymTime is set and recovery is null', () => {
    expect(shouldIncludeGym(prefsWithGym, null)).toBe(true)
  })

  it('returns false when physicalFatigue > 60', () => {
    expect(shouldIncludeGym(prefsWithGym, fatigueOnly)).toBe(false)
  })

  it('returns true when physicalFatigue <= 60 and gymTime is set', () => {
    expect(shouldIncludeGym(prefsWithGym, healthyRecovery)).toBe(true)
  })
})

// ─── generateRecommendations ─────────────────────────────────────────────────

describe('generateRecommendations', () => {
  it('returns an empty array when both arguments are null', () => {
    expect(generateRecommendations(null, null)).toHaveLength(0)
  })

  it('returns an empty array for a healthy state', () => {
    expect(generateRecommendations(healthyRecovery, healthyCognitive)).toHaveLength(0)
  })

  it('returns a SLEEP recommendation when sleepDebt > 1', () => {
    const recs = generateRecommendations(poorRecovery, healthyCognitive)
    expect(recs.some(r => r.type === 'SLEEP')).toBe(true)
  })

  it('returns a STUDY recommendation when focusLevel < 40', () => {
    const recs = generateRecommendations(healthyRecovery, lowFocusCognitive)
    expect(recs.some(r => r.type === 'STUDY')).toBe(true)
  })

  it('returns a RECOVERY recommendation when physicalFatigue > 60', () => {
    const recs = generateRecommendations(fatigueOnly, healthyCognitive)
    expect(recs.some(r => r.type === 'RECOVERY')).toBe(true)
  })

  it('returns a STRESS recommendation when stressLevel > 70', () => {
    const recs = generateRecommendations(healthyRecovery, highStressCognitive)
    expect(recs.some(r => r.type === 'STRESS')).toBe(true)
  })

  it('returns multiple recommendations when multiple conditions are triggered', () => {
    const recs = generateRecommendations(poorRecovery, poorCognitive)
    expect(recs.length).toBeGreaterThanOrEqual(2)
  })

  it('each recommendation has a non-empty message and explanation', () => {
    const recs = generateRecommendations(poorRecovery, poorCognitive)
    for (const r of recs) {
      expect(r.message.length).toBeGreaterThan(0)
      expect(r.explanation.length).toBeGreaterThan(0)
    }
  })
})

// ─── buildSchedule ───────────────────────────────────────────────────────────

describe('buildSchedule', () => {
  it('includes breakfast, lunch, and dinner blocks', () => {
    const plan = buildSchedule(baseContext)
    const meals = plan.blocks.filter(b => b.typeActivite === 'MEAL')
    expect(meals.length).toBeGreaterThanOrEqual(3)
  })

  it('includes a gym block when shouldIncludeGym returns true', () => {
    const ctx: PlanningContext = {
      ...baseContext,
      prefs: prefsWithGym,
      recovery: healthyRecovery,
    }
    const plan = buildSchedule(ctx)
    expect(plan.blocks.some(b => b.typeActivite === 'FITNESS')).toBe(true)
  })

  it('omits the gym block when shouldIncludeGym returns false', () => {
    const ctx: PlanningContext = {
      ...baseContext,
      prefs: prefsWithGym,
      recovery: fatigueOnly,
    }
    const plan = buildSchedule(ctx)
    expect(plan.blocks.some(b => b.typeActivite === 'FITNESS')).toBe(false)
  })

  it('includes at least one study block for pending deadlines', () => {
    const plan = buildSchedule(baseContext)
    expect(plan.blocks.some(b => b.typeActivite === 'STUDY')).toBe(true)
  })

  it('labels study blocks with the course code', () => {
    const plan = buildSchedule(baseContext)
    const study = plan.blocks.find(b => b.typeActivite === 'STUDY')!
    expect(study.label).toContain('MTH1102')
  })

  it('does not exceed the (possibly boosted) study budget', () => {
    const plan = buildSchedule(baseContext)
    const base = calcStudyBudget(basePrefs, healthyRecovery)
    const budget = boostStudyBudget(base, baseContext.deadlines, baseContext.date)
    const studyMinutes = plan.blocks
      .filter(b => b.typeActivite === 'STUDY')
      .reduce((sum, b) => sum + b.endMinute - b.startMinute, 0)
    expect(studyMinutes).toBeLessThanOrEqual(budget)
  })

  it('study blocks do not overlap with meal blocks', () => {
    const plan = buildSchedule(baseContext)
    const meals = plan.blocks.filter(b => b.typeActivite === 'MEAL')
    const studies = plan.blocks.filter(b => b.typeActivite === 'STUDY')
    for (const meal of meals) {
      for (const study of studies) {
        const noOverlap =
          study.startMinute >= meal.endMinute || study.endMinute <= meal.startMinute
        expect(noOverlap).toBe(true)
      }
    }
  })

  it('returns a scoreJournee between 0 and 100', () => {
    const plan = buildSchedule(baseContext)
    expect(plan.scoreJournee).toBeGreaterThanOrEqual(0)
    expect(plan.scoreJournee).toBeLessThanOrEqual(100)
  })

  it('returns recommendations from health data', () => {
    const ctx: PlanningContext = {
      ...baseContext,
      recovery: poorRecovery,
      cognitive: poorCognitive,
    }
    const plan = buildSchedule(ctx)
    expect(plan.recommendations.length).toBeGreaterThan(0)
  })

  it('returns blocks sorted by start time', () => {
    const plan = buildSchedule(baseContext)
    for (let i = 1; i < plan.blocks.length; i++) {
      expect(plan.blocks[i].startMinute).toBeGreaterThanOrEqual(
        plan.blocks[i - 1].startMinute,
      )
    }
  })
})

// ─── buildWeekDates ───────────────────────────────────────────────────────────
import { buildWeekDates, summarizePlanBlocks, formatWeekRange } from '../planning'

describe('buildWeekDates', () => {
  // Wednesday 2026-06-03 → week is Mon 2026-06-01 to Sun 2026-06-07
  const wednesday = new Date('2026-06-03T12:00:00Z')

  it('returns exactly 7 dates', () => {
    expect(buildWeekDates(wednesday)).toHaveLength(7)
  })

  it('first date is Monday of the ISO week', () => {
    const dates = buildWeekDates(wednesday)
    expect(dates[0].toISOString().slice(0, 10)).toBe('2026-06-01')
  })

  it('last date is Sunday of the ISO week', () => {
    const dates = buildWeekDates(wednesday)
    expect(dates[6].toISOString().slice(0, 10)).toBe('2026-06-07')
  })

  it('handles a Sunday input correctly', () => {
    const sunday = new Date('2026-06-07T00:00:00Z')
    const dates = buildWeekDates(sunday)
    expect(dates[0].toISOString().slice(0, 10)).toBe('2026-06-01')
    expect(dates[6].toISOString().slice(0, 10)).toBe('2026-06-07')
  })
})

describe('summarizePlanBlocks', () => {
  const blocks = [
    { id: '1', startTime: new Date(), endTime: new Date(), label: 'Étude', priority: 'MEDIUM', typeActivite: 'STUDY' },
    { id: '2', startTime: new Date(), endTime: new Date(), label: 'Étude', priority: 'MEDIUM', typeActivite: 'STUDY' },
    { id: '3', startTime: new Date(), endTime: new Date(), label: 'Gym', priority: 'MEDIUM', typeActivite: 'FITNESS' },
    { id: '4', startTime: new Date(), endTime: new Date(), label: 'Repas', priority: 'LOW', typeActivite: 'MEAL' },
    { id: '5', startTime: new Date(), endTime: new Date(), label: 'Récup', priority: 'LOW', typeActivite: 'RECOVERY' },
  ]

  it('counts study blocks correctly', () => {
    expect(summarizePlanBlocks(blocks).study).toBe(2)
  })

  it('counts fitness blocks correctly', () => {
    expect(summarizePlanBlocks(blocks).fitness).toBe(1)
  })

  it('counts total correctly', () => {
    expect(summarizePlanBlocks(blocks).total).toBe(5)
  })

  it('returns zeros for empty array', () => {
    const s = summarizePlanBlocks([])
    expect(s.study).toBe(0)
    expect(s.total).toBe(0)
  })
})

describe('formatWeekRange', () => {
  it('formats a Mon-Sun range correctly in French', () => {
    const mon = new Date('2026-06-01T00:00:00Z')
    const sun = new Date('2026-06-07T00:00:00Z')
    const label = formatWeekRange(mon, sun)
    expect(label).toContain('1')
    expect(label).toContain('7')
    expect(label).toMatch(/juin/i)
  })

  it('handles cross-month ranges', () => {
    const mon = new Date('2026-05-25T00:00:00Z')
    const sun = new Date('2026-05-31T00:00:00Z')
    const label = formatWeekRange(mon, sun)
    expect(label).toContain('25')
  })
})

// ── validateTimeBlockPatch ─────────────────────────────────────────────────────

describe('validateTimeBlockPatch — valid inputs', () => {
  it('accepts label-only patch', () => {
    const r = validateTimeBlockPatch({ label: 'Deep Work — Algo' })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('accepts startTime + endTime patch', () => {
    const r = validateTimeBlockPatch({ startTime: '09:00', endTime: '10:30' })
    expect(r.valid).toBe(true)
  })

  it('accepts all three fields', () => {
    const r = validateTimeBlockPatch({ label: 'Gym', startTime: '17:00', endTime: '18:30' })
    expect(r.valid).toBe(true)
  })

  it('accepts boundary times 00:00 → 23:59', () => {
    const r = validateTimeBlockPatch({ startTime: '00:00', endTime: '23:59' })
    expect(r.valid).toBe(true)
  })

  it('accepts single startTime-only', () => {
    expect(validateTimeBlockPatch({ startTime: '08:00' }).valid).toBe(true)
  })

  it('accepts single endTime-only', () => {
    expect(validateTimeBlockPatch({ endTime: '10:00' }).valid).toBe(true)
  })
})

describe('validateTimeBlockPatch — invalid inputs', () => {
  it('rejects null', () => {
    expect(validateTimeBlockPatch(null).valid).toBe(false)
  })

  it('rejects non-object', () => {
    expect(validateTimeBlockPatch('09:00').valid).toBe(false)
  })

  it('rejects empty object — no fields', () => {
    const r = validateTimeBlockPatch({})
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('champ'))).toBe(true)
  })

  it('rejects empty label', () => {
    const r = validateTimeBlockPatch({ label: '' })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('label'))).toBe(true)
  })

  it('rejects whitespace-only label', () => {
    expect(validateTimeBlockPatch({ label: '   ' }).valid).toBe(false)
  })

  it('rejects startTime missing leading zero — "9:00"', () => {
    expect(validateTimeBlockPatch({ startTime: '9:00', endTime: '10:00' }).valid).toBe(false)
  })

  it('rejects invalid time format "25:00"', () => {
    expect(validateTimeBlockPatch({ startTime: '25:00' }).valid).toBe(false)
  })

  it('rejects invalid time format "09:60"', () => {
    expect(validateTimeBlockPatch({ endTime: '09:60' }).valid).toBe(false)
  })

  it('rejects endTime ≤ startTime (end before start)', () => {
    const r = validateTimeBlockPatch({ startTime: '10:00', endTime: '09:00' })
    expect(r.valid).toBe(false)
    expect(r.errors.some(e => e.toLowerCase().includes('endtime') || e.toLowerCase().includes('postérieur'))).toBe(true)
  })

  it('rejects endTime === startTime', () => {
    expect(validateTimeBlockPatch({ startTime: '10:00', endTime: '10:00' }).valid).toBe(false)
  })
})

// ─── buildSchedule — fixedSchedules ──────────────────────────────────────────

// today (2026-06-04) is a Thursday → dayOfWeek 4
const thursdayCours: ScheduleSlot = { dayOfWeek: 4, startTime: '08:30', endTime: '10:20', type: 'COURS' }
const thursdayLab:   ScheduleSlot = { dayOfWeek: 4, startTime: '13:00', endTime: '14:50', type: 'LAB'  }
const mondaySlot:    ScheduleSlot = { dayOfWeek: 1, startTime: '08:30', endTime: '10:20', type: 'COURS' }

const schedCtx: PlanningContext = {
  date: today,
  prefs: basePrefs,
  recovery: null,
  cognitive: null,
  deadlines: [],
  tasks: [],
}

describe('buildSchedule — fixedSchedules', () => {
  it('tracer: inserts a COURS block when fixedSchedules match the day', () => {
    const plan = buildSchedule({ ...schedCtx, fixedSchedules: [thursdayCours] })
    const coursBlocks = plan.blocks.filter(b => b.typeActivite === 'COURS')
    expect(coursBlocks).toHaveLength(1)
  })

  it('COURS block has correct startMinute / endMinute', () => {
    const plan = buildSchedule({ ...schedCtx, fixedSchedules: [thursdayCours] })
    const b = plan.blocks.find(b => b.typeActivite === 'COURS')!
    expect(b.startMinute).toBe(8 * 60 + 30)   // 510
    expect(b.endMinute).toBe(10 * 60 + 20)     // 620
  })

  it('COURS block has priority HIGH', () => {
    const plan = buildSchedule({ ...schedCtx, fixedSchedules: [thursdayCours] })
    const b = plan.blocks.find(b => b.typeActivite === 'COURS')!
    expect(b.priority).toBe('HIGH')
  })

  it('Pomodoro blocks do not overlap with the COURS block', () => {
    const plan = buildSchedule({ ...schedCtx, fixedSchedules: [thursdayCours] })
    const coursBlock = plan.blocks.find(b => b.typeActivite === 'COURS')!
    const studyBlocks = plan.blocks.filter(b => b.typeActivite === 'STUDY')
    for (const s of studyBlocks) {
      const overlaps = s.startMinute < coursBlock.endMinute && s.endMinute > coursBlock.startMinute
      expect(overlaps).toBe(false)
    }
  })

  it('inserts multiple fixedSchedules blocks on the same day', () => {
    const plan = buildSchedule({ ...schedCtx, fixedSchedules: [thursdayCours, thursdayLab] })
    const fixedBlocks = plan.blocks.filter(b => b.typeActivite === 'COURS')
    expect(fixedBlocks).toHaveLength(2)
  })

  it('does NOT insert fixedSchedules from a different day', () => {
    const plan = buildSchedule({ ...schedCtx, fixedSchedules: [mondaySlot] })
    const coursBlocks = plan.blocks.filter(b => b.typeActivite === 'COURS')
    expect(coursBlocks).toHaveLength(0)
  })
})
