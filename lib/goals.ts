import prisma from './prisma'

// ─── Validation ───────────────────────────────────────────────────────────────

export interface CreateGoalInput {
  type: 'ACADEMIC' | 'FITNESS'
  title: string
  description?: string | null
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  targetDate?: string | null
  targetGpa?: number | null
  targetGrade?: string | null
  targetWeight?: number | null
  targetBodyFat?: number | null
  targetStrength?: string | null
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const VALID_TYPES     = new Set(['ACADEMIC', 'FITNESS'])
const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export function validateGoalInput(input: unknown): ValidationResult {
  const errors: string[] = []

  if (input === null || typeof input !== 'object') {
    return { valid: false, errors: ['Corps de requête invalide'] }
  }

  const i = input as Record<string, unknown>

  // type
  if (!i.type || !VALID_TYPES.has(i.type as string)) {
    errors.push("Le type doit être ACADEMIC ou FITNESS")
  }

  // title
  const title = typeof i.title === 'string' ? i.title.trim() : ''
  if (!title) {
    errors.push("Le titre est requis")
  }

  // priority (optional — default MEDIUM)
  if (i.priority !== undefined && i.priority !== null && !VALID_PRIORITIES.has(i.priority as string)) {
    errors.push("La priorité doit être LOW, MEDIUM, HIGH ou CRITICAL")
  }

  // Academic-specific
  if (i.targetGpa !== undefined && i.targetGpa !== null) {
    const gpa = Number(i.targetGpa)
    if (isNaN(gpa) || gpa < 0) errors.push("Le GPA cible doit être ≥ 0")
    else if (gpa > 4.0)        errors.push("Le GPA cible doit être ≤ 4.0")
  }

  // Fitness-specific
  if (i.targetWeight !== undefined && i.targetWeight !== null) {
    const w = Number(i.targetWeight)
    if (isNaN(w) || w < 0) errors.push("Le poids cible doit être ≥ 0")
  }

  if (i.targetBodyFat !== undefined && i.targetBodyFat !== null) {
    const bf = Number(i.targetBodyFat)
    if (isNaN(bf) || bf < 0 || bf > 100) errors.push("Le % de masse grasse doit être entre 0 et 100")
  }

  return { valid: errors.length === 0, errors }
}

export interface GoalSummary {
  id: string
  type: 'ACADEMIC' | 'FITNESS'
  title: string
  description: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  completed: boolean
  createdAt: Date
  targetDate: Date | null
  // Academic
  targetGpa: number | null
  targetGrade: string | null
  // Fitness
  targetWeight: number | null
  targetBodyFat: number | null
  targetStrength: string | null
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createGoal(
  userId: string,
  input: CreateGoalInput,
): Promise<GoalSummary> {
  const goal = await prisma.goal.create({
    data: {
      userId,
      type:           input.type,
      title:          input.title.trim(),
      description:    input.description ?? null,
      priority:       input.priority ?? 'MEDIUM',
      targetDate:     input.targetDate ? new Date(input.targetDate) : null,
      targetGpa:      input.targetGpa ?? null,
      targetGrade:    input.targetGrade ?? null,
      targetWeight:   input.targetWeight ?? null,
      targetBodyFat:  input.targetBodyFat ?? null,
      targetStrength: input.targetStrength ?? null,
    },
  })

  return {
    id:             goal.id,
    type:           goal.type as 'ACADEMIC' | 'FITNESS',
    title:          goal.title,
    description:    goal.description,
    priority:       goal.priority as CreateGoalInput['priority'] & string,
    completed:      goal.completed,
    createdAt:      goal.createdAt,
    targetDate:     goal.targetDate,
    targetGpa:      goal.targetGpa,
    targetGrade:    goal.targetGrade,
    targetWeight:   goal.targetWeight,
    targetBodyFat:  goal.targetBodyFat,
    targetStrength: goal.targetStrength,
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  await prisma.goal.delete({ where: { id: goalId } })
}

export async function toggleGoalCompleted(goalId: string): Promise<{ completed: boolean }> {
  const current = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { completed: true },
  })
  if (!current) throw new Error('Objectif introuvable')

  const updated = await prisma.goal.update({
    where: { id: goalId },
    data: { completed: !current.completed },
    select: { completed: true },
  })
  return { completed: updated.completed }
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getGoals(userId: string): Promise<GoalSummary[]> {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [
      { completed: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return goals.map(g => ({
    id:             g.id,
    type:           g.type as 'ACADEMIC' | 'FITNESS',
    title:          g.title,
    description:    g.description,
    priority:       g.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    completed:      g.completed,
    createdAt:      g.createdAt,
    targetDate:     g.targetDate,
    targetGpa:      g.targetGpa,
    targetGrade:    g.targetGrade,
    targetWeight:   g.targetWeight,
    targetBodyFat:  g.targetBodyFat,
    targetStrength: g.targetStrength,
  }))
}
