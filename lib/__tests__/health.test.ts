import { describe, it, expect } from 'vitest'
import { calcRecoveryScore, calcCognitiveState } from '../health'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const goodSleep = {
  sleepDurationHours: 8,
  sleepEfficiency: 0.9,
  deepSleepMinutes: 90,
}

const poorSleep = {
  sleepDurationHours: 5,
  sleepEfficiency: 0.65,
  deepSleepMinutes: 30,
}

const lightActivity = {
  steps: 8000,
  activeCalories: 300,
  workoutMinutes: 30,
}

const heavyActivity = {
  steps: 15000,
  activeCalories: 700,
  workoutMinutes: 120,
}

// ─── calcRecoveryScore ────────────────────────────────────────────────────────

describe('calcRecoveryScore', () => {
  it('sleepDebt est 0 quand le sommeil atteint la cible de 7.5h', () => {
    const result = calcRecoveryScore(goodSleep, lightActivity)
    expect(result.sleepDebt).toBe(0)
  })

  it('sleepDebt est le déficit exact quand le sommeil est insuffisant', () => {
    const result = calcRecoveryScore(poorSleep, lightActivity)
    expect(result.sleepDebt).toBeCloseTo(2.5, 5)
  })

  it('bon sommeil donne un score de récupération élevé (≥ 80)', () => {
    const result = calcRecoveryScore(goodSleep, lightActivity)
    expect(result.value).toBeGreaterThanOrEqual(80)
  })

  it('mauvais sommeil donne un score de récupération faible (≤ 65)', () => {
    const result = calcRecoveryScore(poorSleep, lightActivity)
    expect(result.value).toBeLessThanOrEqual(65)
  })

  it('entraînement intense augmente physicalFatigue', () => {
    const light = calcRecoveryScore(goodSleep, lightActivity)
    const heavy = calcRecoveryScore(goodSleep, heavyActivity)
    expect(heavy.physicalFatigue).toBeGreaterThan(light.physicalFatigue)
  })

  it('forte dette de sommeil augmente cognitiveFatigue', () => {
    const noDebt = calcRecoveryScore(goodSleep, lightActivity)
    const highDebt = calcRecoveryScore(poorSleep, lightActivity)
    expect(highDebt.cognitiveFatigue).toBeGreaterThan(noDebt.cognitiveFatigue)
  })

  it('value est toujours dans [0, 100]', () => {
    const extreme = calcRecoveryScore(
      { sleepDurationHours: 0, sleepEfficiency: 0, deepSleepMinutes: 0 },
      { steps: 0, activeCalories: 0, workoutMinutes: 300 },
    )
    expect(extreme.value).toBeGreaterThanOrEqual(0)
    expect(extreme.value).toBeLessThanOrEqual(100)
  })

  it('tous les champs sont des entiers (arrondis)', () => {
    const result = calcRecoveryScore(goodSleep, lightActivity)
    expect(Number.isInteger(result.value)).toBe(true)
    expect(Number.isInteger(result.physicalFatigue)).toBe(true)
    expect(Number.isInteger(result.cognitiveFatigue)).toBe(true)
  })
})

// ─── calcCognitiveState ───────────────────────────────────────────────────────

describe('calcCognitiveState', () => {
  it('haute récupération → focusLevel élevé (≥ 75)', () => {
    const recovery = calcRecoveryScore(goodSleep, lightActivity)
    const state = calcCognitiveState(recovery, goodSleep)
    expect(state.focusLevel).toBeGreaterThanOrEqual(75)
  })

  it('faible récupération → focusLevel bas (≤ 65)', () => {
    const recovery = calcRecoveryScore(poorSleep, lightActivity)
    const state = calcCognitiveState(recovery, poorSleep)
    expect(state.focusLevel).toBeLessThanOrEqual(65)
  })

  it('cognitiveFatigue de recovery → mentalFatigue identique', () => {
    const recovery = calcRecoveryScore(poorSleep, lightActivity)
    const state = calcCognitiveState(recovery, poorSleep)
    expect(state.mentalFatigue).toBe(recovery.cognitiveFatigue)
  })

  it('faible récupération → stressLevel élevé', () => {
    const goodRec = calcRecoveryScore(goodSleep, lightActivity)
    const poorRec = calcRecoveryScore(poorSleep, lightActivity)
    const goodState = calcCognitiveState(goodRec, goodSleep)
    const poorState = calcCognitiveState(poorRec, poorSleep)
    expect(poorState.stressLevel).toBeGreaterThan(goodState.stressLevel)
  })

  it('bonne sleepEfficiency → motivationLevel élevé', () => {
    const rec = calcRecoveryScore(goodSleep, lightActivity)
    const state = calcCognitiveState(rec, goodSleep)
    expect(state.motivationLevel).toBeGreaterThanOrEqual(70)
  })

  it('tous les champs sont dans [0, 100]', () => {
    const recovery = calcRecoveryScore(
      { sleepDurationHours: 0, sleepEfficiency: 0, deepSleepMinutes: 0 },
      { steps: 0, activeCalories: 0, workoutMinutes: 300 },
    )
    const state = calcCognitiveState(recovery, {
      sleepDurationHours: 0,
      sleepEfficiency: 0,
      deepSleepMinutes: 0,
    })
    for (const val of Object.values(state)) {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(100)
    }
  })
})

// ─── buildWeekRange ───────────────────────────────────────────────────────────
import { buildWeekRange, getRecoveryColor, getSleepColor } from '../health'

describe('buildWeekRange', () => {
  const today = new Date('2026-06-04T12:00:00Z')

  it('returns exactly `days` entries', () => {
    expect(buildWeekRange(today, 7)).toHaveLength(7)
  })

  it('last entry is today (same date)', () => {
    const range = buildWeekRange(today, 7)
    const last = range[range.length - 1]
    expect(last.toISOString().slice(0, 10)).toBe('2026-06-04')
  })

  it('first entry is today minus (days-1)', () => {
    const range = buildWeekRange(today, 7)
    expect(range[0].toISOString().slice(0, 10)).toBe('2026-05-29')
  })

  it('all entries have time zeroed to midnight', () => {
    const range = buildWeekRange(today, 7)
    for (const d of range) {
      expect(d.getUTCHours()).toBe(0)
      expect(d.getUTCMinutes()).toBe(0)
    }
  })
})

describe('getRecoveryColor', () => {
  it('returns border-subtle CSS var for null', () => {
    expect(getRecoveryColor(null)).toContain('border-subtle')
  })

  it('returns accent-rec CSS var for value >= 70', () => {
    expect(getRecoveryColor(70)).toContain('accent-rec')
    expect(getRecoveryColor(100)).toContain('accent-rec')
  })

  it('returns warning CSS var for value in [40, 70)', () => {
    expect(getRecoveryColor(40)).toContain('warning')
    expect(getRecoveryColor(69)).toContain('warning')
  })

  it('returns accent-reco CSS var for value < 40', () => {
    expect(getRecoveryColor(0)).toContain('accent-reco')
    expect(getRecoveryColor(39)).toContain('accent-reco')
  })
})

describe('getSleepColor', () => {
  it('returns border-subtle for null', () => {
    expect(getSleepColor(null)).toContain('border-subtle')
  })

  it('returns accent-study for hours >= 7.5', () => {
    expect(getSleepColor(7.5)).toContain('accent-study')
    expect(getSleepColor(9)).toContain('accent-study')
  })

  it('returns warning for hours in [6, 7.5)', () => {
    expect(getSleepColor(6)).toContain('warning')
    expect(getSleepColor(7.4)).toContain('warning')
  })

  it('returns accent-reco for hours < 6', () => {
    expect(getSleepColor(0)).toContain('accent-reco')
    expect(getSleepColor(5.9)).toContain('accent-reco')
  })
})
