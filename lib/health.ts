import prisma from './prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SleepInput {
  sleepDurationHours: number  // heures, ex. 7.5
  sleepEfficiency: number     // 0.0 à 1.0
  deepSleepMinutes: number    // minutes de sommeil profond
}

export interface ActivityInput {
  steps: number          // pas par jour
  activeCalories: number // calories actives
  workoutMinutes: number // durée d'entraînement en minutes
}

export interface HeartRateInput {
  restingHeartRate: number  // FC repos (bpm)
  averageHeartRate: number  // FC moyenne journée (bpm)
}

export interface RecoveryResult {
  value: number          // 0–100
  physicalFatigue: number  // 0–100
  cognitiveFatigue: number // 0–100
  sleepDebt: number      // heures de dette de sommeil
}

export interface CognitiveResult {
  focusLevel: number      // 0–100
  mentalFatigue: number   // 0–100
  stressLevel: number     // 0–100
  motivationLevel: number // 0–100
}

export interface HealthSummary {
  id: string
  date: Date
  sleep: SleepInput | null
  activity: ActivityInput | null
  heartRate: HeartRateInput | null
  recovery: RecoveryResult | null
  cognitive: CognitiveResult | null
}

export interface HealthInput {
  sleep?: SleepInput
  activity?: ActivityInput
  heartRate?: HeartRateInput
}

// ─── Pure functions ───────────────────────────────────────────────────────────

const SLEEP_TARGET_HOURS = 7.5

export function calcRecoveryScore(
  sleep: SleepInput,
  activity: ActivityInput,
): RecoveryResult {
  const sleepDebt = Math.max(0, SLEEP_TARGET_HOURS - sleep.sleepDurationHours)

  // Qualité du sommeil : durée (50 pts) + efficacité (30 pts) + sommeil profond (20 pts)
  const sleepScore = Math.round(
    Math.min(sleep.sleepDurationHours / SLEEP_TARGET_HOURS, 1) * 50 +
    sleep.sleepEfficiency * 30 +
    Math.min(sleep.deepSleepMinutes / 90, 1) * 20,
  )

  // Fatigue physique : croît avec la durée d'entraînement
  const physicalFatigue = Math.min(100, Math.round(activity.workoutMinutes * 0.4))

  // Fatigue cognitive : base 40 + 12 pts par heure de dette sommeil
  const cognitiveFatigue = Math.min(100, Math.round(40 + sleepDebt * 12))

  const value = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        sleepScore * 0.7 +
        (100 - physicalFatigue) * 0.2 +
        (100 - cognitiveFatigue) * 0.1,
      ),
    ),
  )

  return { value, physicalFatigue, cognitiveFatigue, sleepDebt }
}

export function calcCognitiveState(
  recovery: RecoveryResult,
  sleep: SleepInput,
): CognitiveResult {
  const focusLevel = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        recovery.value * 0.6 +
        Math.min(sleep.sleepDurationHours / SLEEP_TARGET_HOURS, 1) * 40,
      ),
    ),
  )

  const mentalFatigue = Math.min(100, Math.max(0, recovery.cognitiveFatigue))

  const stressLevel = Math.min(
    100,
    Math.max(
      0,
      Math.round((100 - recovery.value) * 0.7 + recovery.sleepDebt * 5),
    ),
  )

  const motivationLevel = Math.min(
    100,
    Math.max(
      0,
      Math.round(sleep.sleepEfficiency * 50 + recovery.value * 0.5),
    ),
  )

  return { focusLevel, mentalFatigue, stressLevel, motivationLevel }
}

// ─── Couche data Prisma ───────────────────────────────────────────────────────

async function recalculateScores(healthDataId: string): Promise<void> {
  const hd = await prisma.healthData.findUnique({
    where: { id: healthDataId },
    include: { sleepData: true, activityData: true },
  })

  if (!hd?.sleepData || !hd.activityData) return

  const sleep: SleepInput = {
    sleepDurationHours: hd.sleepData.sleepDurationHours,
    sleepEfficiency: hd.sleepData.sleepEfficiency,
    deepSleepMinutes: hd.sleepData.deepSleepMinutes,
  }
  const activity: ActivityInput = {
    steps: hd.activityData.steps,
    activeCalories: hd.activityData.activeCalories,
    workoutMinutes: hd.activityData.workoutMinutes,
  }

  const recovery = calcRecoveryScore(sleep, activity)
  const cognitive = calcCognitiveState(recovery, sleep)

  await prisma.$transaction([
    prisma.recoveryScore.upsert({
      where: { healthDataId },
      create: {
        healthDataId,
        value: recovery.value,
        physicalFatigue: recovery.physicalFatigue,
        cognitiveFatigue: recovery.cognitiveFatigue,
        sleepDebt: recovery.sleepDebt,
      },
      update: {
        value: recovery.value,
        physicalFatigue: recovery.physicalFatigue,
        cognitiveFatigue: recovery.cognitiveFatigue,
        sleepDebt: recovery.sleepDebt,
      },
    }),
    prisma.cognitiveState.upsert({
      where: { healthDataId },
      create: {
        healthDataId,
        focusLevel: cognitive.focusLevel,
        mentalFatigue: cognitive.mentalFatigue,
        stressLevel: cognitive.stressLevel,
        motivationLevel: cognitive.motivationLevel,
      },
      update: {
        focusLevel: cognitive.focusLevel,
        mentalFatigue: cognitive.mentalFatigue,
        stressLevel: cognitive.stressLevel,
        motivationLevel: cognitive.motivationLevel,
      },
    }),
  ])
}

// ─── Historique 7 jours ───────────────────────────────────────────────────────

export interface HealthDaySnapshot {
  date: Date
  dayShort: string       // "Lun", "Mar", …
  isToday: boolean
  recovery: number | null    // 0–100
  sleepHours: number | null  // heures
  sleepEfficiency: number | null  // 0–1
}

const DAY_SHORT_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function buildWeekRange(today: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - (days - 1 - i))
    return d
  })
}

export function getRecoveryColor(value: number | null): string {
  if (value === null) return 'var(--color-border-subtle)'
  if (value >= 70)   return 'var(--color-accent-rec)'
  if (value >= 40)   return 'var(--color-warning)'
  return 'var(--color-accent-reco)'
}

export function getSleepColor(hours: number | null): string {
  if (hours === null) return 'var(--color-border-subtle)'
  if (hours >= 7.5)  return 'var(--color-accent-study)'
  if (hours >= 6)    return 'var(--color-warning)'
  return 'var(--color-accent-reco)'
}

export async function getHealthHistory(
  userId: string,
  days: number,
  today: Date,
): Promise<HealthDaySnapshot[]> {
  const todayMidnight = new Date(today)
  todayMidnight.setHours(0, 0, 0, 0)
  const startDate = new Date(todayMidnight)
  startDate.setDate(startDate.getDate() - (days - 1))

  const records = await prisma.healthData.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: todayMidnight },
    },
    include: { recoveryScore: true, sleepData: true },
    orderBy: { date: 'asc' },
  })

  const byDate = new Map(
    records.map(r => [r.date.toISOString().slice(0, 10), r]),
  )

  return buildWeekRange(today, days).map(d => {
    const key = d.toISOString().slice(0, 10)
    const rec = byDate.get(key)
    return {
      date: d,
      dayShort: DAY_SHORT_FR[d.getUTCDay()],
      isToday: key === todayMidnight.toISOString().slice(0, 10),
      recovery: rec?.recoveryScore?.value ?? null,
      sleepHours: rec?.sleepData?.sleepDurationHours ?? null,
      sleepEfficiency: rec?.sleepData?.sleepEfficiency ?? null,
    }
  })
}

// ─── Prisma data layer ────────────────────────────────────────────────────────

export async function getHealthData(
  userId: string,
  date: Date,
): Promise<HealthSummary | null> {
  const hd = await prisma.healthData.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      sleepData: true,
      activityData: true,
      heartRateData: true,
      recoveryScore: true,
      cognitiveState: true,
    },
  })

  if (!hd) return null

  return {
    id: hd.id,
    date: hd.date,
    sleep: hd.sleepData
      ? {
          sleepDurationHours: hd.sleepData.sleepDurationHours,
          sleepEfficiency: hd.sleepData.sleepEfficiency,
          deepSleepMinutes: hd.sleepData.deepSleepMinutes,
        }
      : null,
    activity: hd.activityData
      ? {
          steps: hd.activityData.steps,
          activeCalories: hd.activityData.activeCalories,
          workoutMinutes: hd.activityData.workoutMinutes,
        }
      : null,
    heartRate: hd.heartRateData
      ? {
          restingHeartRate: hd.heartRateData.restingHeartRate,
          averageHeartRate: hd.heartRateData.averageHeartRate,
        }
      : null,
    recovery: hd.recoveryScore
      ? {
          value: hd.recoveryScore.value,
          physicalFatigue: hd.recoveryScore.physicalFatigue,
          cognitiveFatigue: hd.recoveryScore.cognitiveFatigue,
          sleepDebt: hd.recoveryScore.sleepDebt,
        }
      : null,
    cognitive: hd.cognitiveState
      ? {
          focusLevel: hd.cognitiveState.focusLevel,
          mentalFatigue: hd.cognitiveState.mentalFatigue,
          stressLevel: hd.cognitiveState.stressLevel,
          motivationLevel: hd.cognitiveState.motivationLevel,
        }
      : null,
  }
}

export async function upsertSleepData(
  userId: string,
  date: Date,
  input: SleepInput,
): Promise<HealthSummary> {
  const hd = await prisma.healthData.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  })

  await prisma.sleepData.upsert({
    where: { healthDataId: hd.id },
    create: {
      healthDataId: hd.id,
      sleepDurationHours: input.sleepDurationHours,
      sleepEfficiency: input.sleepEfficiency,
      deepSleepMinutes: input.deepSleepMinutes,
    },
    update: {
      sleepDurationHours: input.sleepDurationHours,
      sleepEfficiency: input.sleepEfficiency,
      deepSleepMinutes: input.deepSleepMinutes,
    },
  })

  await recalculateScores(hd.id)
  return (await getHealthData(userId, date))!
}

export async function upsertActivityData(
  userId: string,
  date: Date,
  input: ActivityInput,
): Promise<HealthSummary> {
  const hd = await prisma.healthData.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  })

  await prisma.activityData.upsert({
    where: { healthDataId: hd.id },
    create: {
      healthDataId: hd.id,
      steps: input.steps,
      activeCalories: input.activeCalories,
      workoutMinutes: input.workoutMinutes,
    },
    update: {
      steps: input.steps,
      activeCalories: input.activeCalories,
      workoutMinutes: input.workoutMinutes,
    },
  })

  await recalculateScores(hd.id)
  return (await getHealthData(userId, date))!
}

export async function upsertHeartRateData(
  userId: string,
  date: Date,
  input: HeartRateInput,
): Promise<HealthSummary> {
  const hd = await prisma.healthData.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date },
    update: {},
  })

  await prisma.heartRateData.upsert({
    where: { healthDataId: hd.id },
    create: {
      healthDataId: hd.id,
      restingHeartRate: input.restingHeartRate,
      averageHeartRate: input.averageHeartRate,
    },
    update: {
      restingHeartRate: input.restingHeartRate,
      averageHeartRate: input.averageHeartRate,
    },
  })

  return (await getHealthData(userId, date))!
}
