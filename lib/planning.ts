import type { RecoveryResult, CognitiveResult } from './health'
import type { ScheduleSlot } from './schedule'
import { getHealthData } from './health'
import { enrichRecommendationMessage } from './ai'
import type { SeedRule, AIRecommendationContext } from './ai'
import prisma from './prisma'

// ─── TimeBlock patch ──────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface TimeBlockPatch {
  label?: string
  startTime?: string  // "HH:MM"
  endTime?: string    // "HH:MM"
}

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

export function validateTimeBlockPatch(input: unknown): ValidationResult {
  const errors: string[] = []

  if (input === null || typeof input !== 'object') {
    return { valid: false, errors: ['Corps de requête invalide'] }
  }

  const i = input as Record<string, unknown>
  const hasLabel = 'label' in i
  const hasStart = 'startTime' in i
  const hasEnd   = 'endTime' in i

  if (!hasLabel && !hasStart && !hasEnd) {
    return { valid: false, errors: ['Au moins un champ est requis : label, startTime, endTime'] }
  }

  if (hasLabel) {
    const label = typeof i.label === 'string' ? i.label.trim() : ''
    if (!label) errors.push('Le label du Bloc ne peut pas être vide')
  }

  if (hasStart) {
    if (typeof i.startTime !== 'string' || !TIME_REGEX.test(i.startTime)) {
      errors.push('startTime doit être au format HH:MM (24h)')
    }
  }

  if (hasEnd) {
    if (typeof i.endTime !== 'string' || !TIME_REGEX.test(i.endTime)) {
      errors.push('endTime doit être au format HH:MM (24h)')
    }
  }

  if (
    hasStart && hasEnd &&
    typeof i.startTime === 'string' && TIME_REGEX.test(i.startTime) &&
    typeof i.endTime   === 'string' && TIME_REGEX.test(i.endTime)
  ) {
    if (parseTime(i.endTime) <= parseTime(i.startTime)) {
      errors.push('endTime doit être postérieur à startTime')
    }
  }

  return { valid: errors.length === 0, errors }
}

export async function patchTimeBlock(
  planId: string,
  blockId: string,
  patch: TimeBlockPatch,
): Promise<TimeBlockSummary> {
  const existing = await prisma.timeBlock.findFirst({
    where: { id: blockId, dailyPlanId: planId },
    select: { id: true, startTime: true, endTime: true, label: true, priority: true, typeActivite: true },
  })
  if (!existing) throw new Error('Bloc introuvable')

  const data: Record<string, unknown> = {}

  if (patch.label !== undefined) data.label = patch.label.trim()

  if (patch.startTime !== undefined) {
    const [h, m] = patch.startTime.split(':').map(Number)
    const d = new Date(existing.startTime)
    d.setHours(h, m, 0, 0)
    data.startTime = d
  }

  if (patch.endTime !== undefined) {
    const [h, m] = patch.endTime.split(':').map(Number)
    const d = new Date(existing.endTime)
    d.setHours(h, m, 0, 0)
    data.endTime = d
  }

  const updated = await prisma.timeBlock.update({
    where: { id: blockId },
    data,
    select: { id: true, startTime: true, endTime: true, label: true, priority: true, typeActivite: true },
  })

  return {
    id:          updated.id,
    startTime:   updated.startTime,
    endTime:     updated.endTime,
    label:       updated.label,
    priority:    updated.priority,
    typeActivite: updated.typeActivite,
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanningPrefsInput {
  preferredWakeTime: string
  preferredSleepTime: string
  preferredGymTime?: string | null
  maxDailyStudyHours: number
}

export interface GymPrefsInput {
  frequencyPerWeek: number         // 1–7
  sessionDurationMinutes: number   // 30–120
  preferredDays: number[]          // 0=Dim … 6=Sam
  preferredTime: 'matin' | 'après-midi' | 'soir' | null
}

export interface CourseHoursInput {
  courseId: string
  courseCode: string
  personalHoursPerWeek: number
}

export interface DeadlineInput {
  id: string
  title: string
  dueDate: Date
  weight: number       // 0–100 percentage of final grade
  completed: boolean
  courseId: string
  courseCode: string
  courseDifficulty: number  // 1–5
}

export interface TaskInput {
  id: string
  title: string
  estimatedDurationMinutes: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  completed: boolean
  courseId: string
  courseCode: string
}

export interface PlanningContext {
  date: Date
  prefs: PlanningPrefsInput
  recovery: RecoveryResult | null
  cognitive: CognitiveResult | null
  deadlines: DeadlineInput[]
  tasks: TaskInput[]
  fixedSchedules?: ScheduleSlot[]
  gymPrefs?: GymPrefsInput | null
  courseHours?: CourseHoursInput[]
}

export interface GeneratedBlock {
  startMinute: number  // minutes from midnight
  endMinute: number
  label: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  typeActivite: 'STUDY' | 'FITNESS' | 'RECOVERY' | 'MEAL' | 'FREE' | 'COURS'
  courseId?: string
  taskId?: string
}

export interface GeneratedRecommendation {
  type: 'STUDY' | 'FITNESS' | 'RECOVERY' | 'SLEEP' | 'PLANNING' | 'STRESS'
  message: string
  explanation: string
  confidenceScore: number
  ruleName: string
}

export interface GeneratedPlan {
  blocks: GeneratedBlock[]
  recommendations: GeneratedRecommendation[]
  scoreJournee: number
}

export interface TimeBlockSummary {
  id: string
  startTime: Date
  endTime: Date
  label: string
  priority: string
  typeActivite: string | null
}

export interface RecommendationSummary {
  id: string
  type: string
  message: string
  explanation: string | null
  confidenceScore: number
}

export interface DailyPlanSummary {
  id: string
  date: Date
  scoreJournee: number | null
  timeBlocks: TimeBlockSummary[]
  recommendations: RecommendationSummary[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PREFS: PlanningPrefsInput = {
  preferredWakeTime: '07:00',
  preferredSleepTime: '23:00',
  preferredGymTime: null,
  maxDailyStudyHours: 6,
}

const POMODORO_STUDY_MINUTES = 50
const POMODORO_BREAK_MINUTES = 10
const URGENCY_HORIZON_DAYS = 14  // deadlines beyond this window score 0 for proximity

// ─── Pure functions ───────────────────────────────────────────────────────────

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function daysUntil(dueDate: Date, today: Date): number {
  const due = new Date(dueDate)
  const t = new Date(today)
  due.setHours(0, 0, 0, 0)
  t.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - t.getTime()) / (1000 * 60 * 60 * 24))
}

export function deadlineUrgency(deadline: DeadlineInput, today: Date): number {
  if (deadline.completed) return 0
  const days = daysUntil(deadline.dueDate, today)
  if (days < 0) return 0
  const proximityScore = Math.round(
    Math.max(0, (URGENCY_HORIZON_DAYS - days) / URGENCY_HORIZON_DAYS) * 70,
  )
  const weightScore = Math.round((deadline.weight / 100) * 20)
  const difficultyScore = Math.round((deadline.courseDifficulty / 5) * 10)
  return Math.min(100, proximityScore + weightScore + difficultyScore)
}

export function calcStudyBudget(
  prefs: PlanningPrefsInput,
  recovery: RecoveryResult | null,
): number {
  let budget = prefs.maxDailyStudyHours * 60
  if (recovery !== null) {
    if (recovery.value < 40) budget = Math.round(budget * 0.7)
    if (recovery.cognitiveFatigue > 70) budget = Math.round(budget * 0.8)
  }
  return budget
}

export function shouldIncludeGym(
  prefs: PlanningPrefsInput,
  recovery: RecoveryResult | null,
): boolean {
  if (!prefs.preferredGymTime) return false
  if (recovery === null) return true
  return recovery.physicalFatigue <= 60
}

const GYM_TIME_WINDOWS: Record<string, [number, number]> = {
  'matin':       [7 * 60, 12 * 60],
  'après-midi':  [12 * 60, 17 * 60],
  'soir':        [17 * 60, 22 * 60],
}

export function findGymSlot(
  blocks: GeneratedBlock[],
  gymPrefs: GymPrefsInput,
  date: Date,
  deadlines: DeadlineInput[],
  wakeMin: number,
  sleepMin: number,
): { start: number; end: number } | null {
  const dow = date.getUTCDay()
  if (gymPrefs.preferredDays.length > 0 && !gymPrefs.preferredDays.includes(dow)) return null

  // Avoid day before an exam
  const tomorrow = new Date(date)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const hasExamTomorrow = deadlines.some(d => {
    if (d.completed) return false
    const due = new Date(d.dueDate)
    due.setHours(0, 0, 0, 0)
    const t = new Date(tomorrow)
    t.setHours(0, 0, 0, 0)
    return due.getTime() === t.getTime()
  })
  if (hasExamTomorrow) return null

  const [winStart, winEnd] = (gymPrefs.preferredTime != null ? GYM_TIME_WINDOWS[gymPrefs.preferredTime] : null) ?? [wakeMin, sleepMin]
  const duration = gymPrefs.sessionDurationMinutes

  let cursor = Math.max(wakeMin, winStart)
  const limit = Math.min(sleepMin, winEnd)

  while (cursor + duration <= limit) {
    if (!hasOverlap(blocks, cursor, cursor + duration)) {
      return { start: cursor, end: cursor + duration }
    }
    cursor += 15
  }
  return null
}

const EXAM_BOOST_DAYS = 7

export function boostStudyBudget(
  base: number,
  deadlines: DeadlineInput[],
  date: Date,
): number {
  const hasUrgentExam = deadlines.some(d => {
    if (d.completed) return false
    const days = daysUntil(d.dueDate, date)
    return days >= 0 && days <= EXAM_BOOST_DAYS
  })
  return hasUrgentExam ? Math.round(base * 1.25) : base
}

export function revisionLabel(courseCode: string): string {
  return `Révision ${courseCode}`
}

export function generateRecommendations(
  recovery: RecoveryResult | null,
  cognitive: CognitiveResult | null,
): GeneratedRecommendation[] {
  const recs: GeneratedRecommendation[] = []

  if (recovery !== null && recovery.sleepDebt > 1) {
    recs.push({
      type: 'SLEEP',
      message: `Ta dette de sommeil est de ${recovery.sleepDebt.toFixed(1)}h. Priorise une nuit complète de 7h30 ce soir.`,
      explanation:
        'Tricou 2023-2024 (Polytechnique Montréal) — La dette de sommeil réduit les récepteurs à la dopamine, impactant directement concentration et motivation.',
      confidenceScore: 0.85,
      ruleName: 'SLEEP_DEBT_RULE',
    })
  }

  if (cognitive !== null && cognitive.focusLevel < 40) {
    recs.push({
      type: 'STUDY',
      message:
        'Ton focus est faible. Utilise des Séances courtes de 25 min avec pauses obligatoires (Pomodoro court).',
      explanation:
        'Hassanbeigi et al. 2011 (Procedia Social and Behavioral Sciences) — Fatigue cognitive et procrastination sont corrélées à des performances académiques réduites.',
      confidenceScore: 0.78,
      ruleName: 'LOW_FOCUS_RULE',
    })
  }

  if (recovery !== null && recovery.physicalFatigue > 60) {
    recs.push({
      type: 'RECOVERY',
      message:
        'Fatigue physique élevée. Remplace la Séance Fitness par une récupération active : marche légère ou étirements 20 min.',
      explanation:
        'Tricou 2023-2024 (Polytechnique Montréal) — La surcharge physique sans récupération réduit la qualité du sommeil et les performances cognitives le lendemain.',
      confidenceScore: 0.80,
      ruleName: 'HIGH_FATIGUE_RULE',
    })
  }

  if (cognitive !== null && cognitive.stressLevel > 70) {
    recs.push({
      type: 'STRESS',
      message:
        'Niveau de stress critique. Intègre une pause de 20 min en milieu de journée (NSDR ou cohérence cardiaque).',
      explanation:
        "SEP Polytechnique 2025 (Réussir à Poly) — Le stress chronique en période d'Échéances réduit la qualité de l'apprentissage profond.",
      confidenceScore: 0.75,
      ruleName: 'HIGH_STRESS_RULE',
    })
  }

  return recs
}

// ─── Schedule builder helpers ─────────────────────────────────────────────────

function makeBlock(
  startMinute: number,
  endMinute: number,
  label: string,
  typeActivite: GeneratedBlock['typeActivite'],
  priority: GeneratedBlock['priority'] = 'MEDIUM',
  courseId?: string,
  taskId?: string,
): GeneratedBlock {
  return { startMinute, endMinute, label, typeActivite, priority, courseId, taskId }
}

function hasOverlap(
  blocks: GeneratedBlock[],
  start: number,
  end: number,
): boolean {
  return blocks.some(b => start < b.endMinute && end > b.startMinute)
}

function urgencyToPriority(
  score: number,
): GeneratedBlock['priority'] {
  if (score >= 70) return 'CRITICAL'
  if (score >= 40) return 'HIGH'
  if (score >= 20) return 'MEDIUM'
  return 'LOW'
}

// ─── buildSchedule ────────────────────────────────────────────────────────────

export function buildSchedule(context: PlanningContext): GeneratedPlan {
  const { prefs, recovery, cognitive, deadlines, date, gymPrefs } = context
  const blocks: GeneratedBlock[] = []

  const wakeMin = parseTime(prefs.preferredWakeTime)
  const sleepMin = parseTime(prefs.preferredSleepTime)

  // ── Fixed schedule blocks (cours / lab) — immovable ──
  const todayDow = date.getUTCDay()
  for (const slot of context.fixedSchedules ?? []) {
    if (slot.dayOfWeek !== todayDow) continue
    const start = parseTime(slot.startTime)
    const end   = parseTime(slot.endTime)
    if (end > sleepMin || start < wakeMin) continue
    const label = slot.type === 'COURS' ? 'Cours magistral' : 'Laboratoire'
    blocks.push(makeBlock(start, end, label, 'COURS', 'HIGH'))
  }

  // ── Meal blocks ──
  blocks.push(makeBlock(wakeMin, wakeMin + 20, 'Petit-déjeuner', 'MEAL'))

  const lunchStart = 720  // 12:00
  if (lunchStart >= wakeMin + 20) {
    blocks.push(makeBlock(lunchStart, lunchStart + 30, 'Déjeuner', 'MEAL'))
  }

  const dinnerStart = 1080  // 18:00
  if (dinnerStart + 30 <= sleepMin) {
    blocks.push(makeBlock(dinnerStart, dinnerStart + 30, 'Dîner', 'MEAL'))
  }

  // ── Gym block — from GymPreferences (preferred) or legacy preferredGymTime ──
  if (gymPrefs) {
    const slot = findGymSlot(blocks, gymPrefs, date, deadlines, wakeMin, sleepMin)
    if (slot) {
      blocks.push(makeBlock(slot.start, slot.end, 'Séance Gym', 'FITNESS', 'MEDIUM'))
    }
  } else {
    const gymMin = prefs.preferredGymTime ? parseTime(prefs.preferredGymTime) : null
    if (gymMin !== null && shouldIncludeGym(prefs, recovery)) {
      const gymEnd = gymMin + 60
      if (!hasOverlap(blocks, gymMin, gymEnd) && gymEnd <= sleepMin) {
        blocks.push(makeBlock(gymMin, gymEnd, 'Séance Fitness', 'FITNESS', 'MEDIUM'))
      }
    }
  }

  // ── Study blocks (greedy Pomodoro fill) ──
  const baseBudget = calcStudyBudget(prefs, recovery)
  const budget = boostStudyBudget(baseBudget, deadlines, date)

  const urgentDeadlines = deadlines
    .filter(d => !d.completed)
    .map(d => ({ ...d, score: deadlineUrgency(d, date) }))
    .sort((a, b) => b.score - a.score)

  let remaining = budget
  let cursor = wakeMin + 20
  let di = 0

  while (remaining >= POMODORO_STUDY_MINUTES && cursor + POMODORO_STUDY_MINUTES <= sleepMin) {
    const blockEnd = cursor + POMODORO_STUDY_MINUTES

    if (hasOverlap(blocks, cursor, blockEnd)) {
      const blocker = blocks.find(b => cursor < b.endMinute && blockEnd > b.startMinute)!
      cursor = blocker.endMinute + POMODORO_BREAK_MINUTES
      continue
    }

    const dl = urgentDeadlines.length > 0
      ? urgentDeadlines[di % urgentDeadlines.length]
      : null

    // Always name by course — never "Étude libre"
    const label = dl ? revisionLabel(dl.courseCode) : (
      context.tasks.length > 0 ? revisionLabel(context.tasks[0].courseCode) : 'Révision'
    )
    const priority = dl ? urgencyToPriority(dl.score) : 'MEDIUM'

    blocks.push(makeBlock(cursor, blockEnd, label, 'STUDY', priority, dl?.courseId))
    cursor = blockEnd + POMODORO_BREAK_MINUTES
    remaining -= POMODORO_STUDY_MINUTES
    di++
  }

  // ── Recovery block if health warrants it ──
  const recommendations = generateRecommendations(recovery, cognitive)
  const needsRecovery = recommendations.some(
    r => r.type === 'RECOVERY' || r.type === 'STRESS',
  )

  if (needsRecovery) {
    const recStart = 1020  // 17:00
    const recEnd = recStart + 30
    if (!hasOverlap(blocks, recStart, recEnd) && recEnd <= sleepMin) {
      blocks.push(makeBlock(recStart, recEnd, 'Récupération active', 'RECOVERY', 'MEDIUM'))
    }
  }

  // ── Sort by start time ──
  blocks.sort((a, b) => a.startMinute - b.startMinute)

  // ── Day score ──
  const studyMinutes = blocks
    .filter(b => b.typeActivite === 'STUDY')
    .reduce((sum, b) => sum + b.endMinute - b.startMinute, 0)
  const planCoverage = Math.min(1, studyMinutes / Math.max(1, budget))
  const healthBonus = recovery !== null ? recovery.value / 100 : 0.5
  const scoreJournee = Math.round(
    Math.max(0, Math.min(100, (planCoverage * 0.6 + healthBonus * 0.4) * 100)),
  )

  return { blocks, recommendations, scoreJournee }
}

// ─── Vue hebdomadaire ─────────────────────────────────────────────────────────

export interface BlockTypeSummary {
  study: number
  fitness: number
  recovery: number
  meal: number
  total: number
}

export interface WeekDayPlan {
  date: Date
  dayShort: string   // "Lun", "Mar", …
  dayNum: number     // day of month
  isToday: boolean
  plan: DailyPlanSummary | null
}

const DAY_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export function buildWeekDates(today: Date): Date[] {
  const d = new Date(today)
  d.setUTCHours(0, 0, 0, 0)
  // Adjust to Monday of the ISO week (Sunday = 0 → adjust -6; Mon-Sat → 1 - day)
  const dow = d.getUTCDay()
  const diffToMonday = dow === 0 ? -6 : 1 - dow
  const monday = new Date(d)
  monday.setUTCDate(d.getUTCDate() + diffToMonday)

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setUTCDate(monday.getUTCDate() + i)
    return day
  })
}

export function summarizePlanBlocks(blocks: TimeBlockSummary[]): BlockTypeSummary {
  const s: BlockTypeSummary = { study: 0, fitness: 0, recovery: 0, meal: 0, total: blocks.length }
  for (const b of blocks) {
    if (b.typeActivite === 'STUDY')    s.study++
    else if (b.typeActivite === 'FITNESS')  s.fitness++
    else if (b.typeActivite === 'RECOVERY') s.recovery++
    else if (b.typeActivite === 'MEAL')     s.meal++
  }
  return s
}

export function formatWeekRange(monday: Date, sunday: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', timeZone: 'UTC' }
  const startLabel = monday.toLocaleDateString('fr-CA', opts)
  const endLabel   = sunday.toLocaleDateString('fr-CA', { ...opts, year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

export async function getWeeklyPlans(
  userId: string,
  weekDates: Date[],
): Promise<WeekDayPlan[]> {
  const start = weekDates[0]
  const end   = weekDates[weekDates.length - 1]
  const todayKey = new Date().toISOString().slice(0, 10)

  const plans = await prisma.dailyPlan.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    include: {
      timeBlocks: { orderBy: { startTime: 'asc' } },
      recommendations: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { date: 'asc' },
  })

  const byDate = new Map(
    plans.map(p => [p.date.toISOString().slice(0, 10), p]),
  )

  return weekDates.map(d => {
    const key  = d.toISOString().slice(0, 10)
    const raw  = byDate.get(key) ?? null
    const plan: DailyPlanSummary | null = raw ? {
      id: raw.id,
      date: raw.date,
      scoreJournee: raw.scoreJournee,
      timeBlocks: raw.timeBlocks.map(b => ({
        id: b.id, startTime: b.startTime, endTime: b.endTime,
        label: b.label, priority: b.priority, typeActivite: b.typeActivite,
      })),
      recommendations: raw.recommendations.map(r => ({
        id: r.id, type: r.type, message: r.message,
        explanation: r.explanation, confidenceScore: r.confidenceScore,
      })),
    } : null

    return {
      date: d,
      dayShort: DAY_SHORT[d.getUTCDay()],
      dayNum: d.getUTCDate(),
      isToday: key === todayKey,
      plan,
    }
  })
}

// ─── Couche data Prisma ───────────────────────────────────────────────────────

function minutesToDateTime(date: Date, minutes: number): Date {
  const dt = new Date(date)
  dt.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return dt
}

export async function getDailyPlan(
  userId: string,
  date: Date,
): Promise<DailyPlanSummary | null> {
  const plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      timeBlocks: { orderBy: { startTime: 'asc' } },
      recommendations: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!plan) return null

  return {
    id: plan.id,
    date: plan.date,
    scoreJournee: plan.scoreJournee,
    timeBlocks: plan.timeBlocks.map(b => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
      label: b.label,
      priority: b.priority,
      typeActivite: b.typeActivite,
    })),
    recommendations: plan.recommendations.map(r => ({
      id: r.id,
      type: r.type,
      message: r.message,
      explanation: r.explanation,
      confidenceScore: r.confidenceScore,
    })),
  }
}

export async function generateDailyPlan(
  userId: string,
  date: Date,
): Promise<DailyPlanSummary> {
  const [userPrefs, rawCourses, healthData, dbRules, dbSchedules, dbSemester] = await Promise.all([
    prisma.planningPreferences.findUnique({ where: { userId } }),
    prisma.course.findMany({
      where: { userId },
      include: {
        deadlines: { where: { completed: false } },
        tasks: { where: { completed: false } },
        personalHours: true,
      },
    }),
    getHealthData(userId, date),
    prisma.scientificRule.findMany({ include: { evidenceSource: true } }),
    prisma.courseSchedule.findMany({
      where: { course: { userId } },
      select: { dayOfWeek: true, startTime: true, endTime: true, type: true },
    }),
    prisma.semesterSetup.findUnique({ where: { userId } }),
  ])

  const ruleMap = new Map(dbRules.map(r => [r.name, r]))

  const prefs: PlanningPrefsInput = userPrefs
    ? {
        preferredWakeTime:  dbSemester?.wakeTime  ?? userPrefs.preferredWakeTime,
        preferredSleepTime: dbSemester?.sleepTime ?? userPrefs.preferredSleepTime,
        preferredGymTime:   userPrefs.preferredGymTime,
        maxDailyStudyHours: userPrefs.maxDailyStudyHours,
      }
    : {
        ...DEFAULT_PREFS,
        preferredWakeTime:  dbSemester?.wakeTime  ?? DEFAULT_PREFS.preferredWakeTime,
        preferredSleepTime: dbSemester?.sleepTime ?? DEFAULT_PREFS.preferredSleepTime,
      }

  const gymPrefs: GymPrefsInput | null = null

  const courseHours: CourseHoursInput[] = rawCourses.flatMap(c =>
    c.personalHours.map(h => ({
      courseId: c.id,
      courseCode: c.code,
      personalHoursPerWeek: h.personalHoursPerWeek,
    })),
  )

  const deadlines: DeadlineInput[] = rawCourses.flatMap(c =>
    c.deadlines.map(d => ({
      id: d.id,
      title: d.title,
      dueDate: d.dueDate,
      weight: d.weight,
      completed: d.completed,
      courseId: c.id,
      courseCode: c.code,
      courseDifficulty: c.difficultyLevel,
    })),
  )

  const tasks: TaskInput[] = rawCourses.flatMap(c =>
    c.tasks.map(t => ({
      id: t.id,
      title: t.title,
      estimatedDurationMinutes: t.estimatedDurationMinutes,
      priority: t.priority as TaskInput['priority'],
      completed: t.completed,
      courseId: c.id,
      courseCode: c.code,
    })),
  )

  const fixedSchedules: ScheduleSlot[] = dbSchedules.map(s => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime:   s.endTime,
    type:      s.type as 'COURS' | 'LAB',
  }))

  const context: PlanningContext = {
    date,
    prefs,
    recovery: healthData?.recovery ?? null,
    cognitive: healthData?.cognitive ?? null,
    deadlines,
    tasks,
    fixedSchedules,
    gymPrefs,
    courseHours,
  }

  const generated = buildSchedule(context)

  // ── Enrich recommendations with Claude (parallel, with fallback) ──
  const enrichedRecs = await Promise.all(
    generated.recommendations.map(async rec => {
      const dbRule = ruleMap.get(rec.ruleName)
      if (!dbRule) return { ...rec, dbRuleId: undefined as string | undefined }

      const seedRule: SeedRule = {
        id: dbRule.id,
        name: dbRule.name,
        condition: dbRule.condition,
        recommendationTemplate: dbRule.recommendationTemplate,
        evidenceTitle: dbRule.evidenceSource.title,
        evidenceAuthors: dbRule.evidenceSource.authors,
        evidenceYear: dbRule.evidenceSource.year,
        evidenceSummary: dbRule.evidenceSource.summary,
      }

      const aiCtx: AIRecommendationContext = {
        ruleName: rec.ruleName,
        sleepDebt:       context.recovery?.sleepDebt,
        focusLevel:      context.cognitive?.focusLevel,
        physicalFatigue: context.recovery?.physicalFatigue,
        stressLevel:     context.cognitive?.stressLevel,
        recoveryValue:   context.recovery?.value,
        motivationLevel: context.cognitive?.motivationLevel,
      }

      const aiMessage   = await enrichRecommendationMessage(seedRule, aiCtx)
      const sourceLabel = `${dbRule.evidenceSource.authors} ${dbRule.evidenceSource.year}`

      return {
        ...rec,
        message:     aiMessage,
        explanation: sourceLabel,
        dbRuleId:    dbRule.id as string | undefined,
      }
    }),
  )

  const saved = await prisma.$transaction(async (tx) => {
    const dailyPlan = await tx.dailyPlan.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, scoreJournee: generated.scoreJournee },
      update: { scoreJournee: generated.scoreJournee },
    })

    await tx.timeBlock.deleteMany({ where: { dailyPlanId: dailyPlan.id } })
    await tx.recommendation.deleteMany({ where: { dailyPlanId: dailyPlan.id } })

    await tx.timeBlock.createMany({
      data: generated.blocks.map(b => ({
        dailyPlanId: dailyPlan.id,
        startTime: minutesToDateTime(date, b.startMinute),
        endTime: minutesToDateTime(date, b.endMinute),
        label: b.label,
        priority: b.priority,
        typeActivite: b.typeActivite,
        taskId: b.taskId ?? null,
      })),
    })

    // Individual creates to enable M2M rule connection
    for (const rec of enrichedRecs) {
      await tx.recommendation.create({
        data: {
          dailyPlanId:     dailyPlan.id,
          type:            rec.type,
          message:         rec.message,
          explanation:     rec.explanation,
          confidenceScore: rec.confidenceScore,
          ...(rec.dbRuleId ? { rules: { connect: [{ id: rec.dbRuleId }] } } : {}),
        },
      })
    }

    return tx.dailyPlan.findUnique({
      where: { id: dailyPlan.id },
      include: {
        timeBlocks: { orderBy: { startTime: 'asc' } },
        recommendations: { orderBy: { createdAt: 'asc' } },
      },
    })
  })

  return {
    id: saved!.id,
    date: saved!.date,
    scoreJournee: saved!.scoreJournee,
    timeBlocks: saved!.timeBlocks.map(b => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
      label: b.label,
      priority: b.priority,
      typeActivite: b.typeActivite,
    })),
    recommendations: saved!.recommendations.map(r => ({
      id: r.id,
      type: r.type,
      message: r.message,
      explanation: r.explanation,
      confidenceScore: r.confidenceScore,
    })),
  }
}
