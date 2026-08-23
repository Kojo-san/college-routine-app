import prisma from './prisma'

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface CreateCourseInput {
  code: string
  name: string
  difficultyLevel?: number
  estimatedWeeklyWorkload?: number
  courseHours?: number
  labHours?: number
  personalHours?: number
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  estimatedDurationMinutes?: number
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface CreateDeadlineInput {
  title: string
  dueDate: string  // "YYYY-MM-DD"
  weight?: number | null  // 0–100, optionnel
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export function validateCourseInput(input: unknown): ValidationResult {
  const errors: string[] = []

  if (input === null || typeof input !== 'object') {
    return { valid: false, errors: ['Corps de requête invalide'] }
  }

  const i = input as Record<string, unknown>

  const code = typeof i.code === 'string' ? i.code.trim() : ''
  if (!code) errors.push('Le code du Cours est requis')

  const name = typeof i.name === 'string' ? i.name.trim() : ''
  if (!name) errors.push('Le nom du Cours est requis')

  if (i.difficultyLevel !== undefined && i.difficultyLevel !== null) {
    const d = Number(i.difficultyLevel)
    if (!Number.isInteger(d) || d < 1 || d > 5) {
      errors.push('La difficulté doit être un entier entre 1 et 5')
    }
  }

  if (i.estimatedWeeklyWorkload !== undefined && i.estimatedWeeklyWorkload !== null) {
    const w = Number(i.estimatedWeeklyWorkload)
    if (isNaN(w) || w < 0) errors.push('La charge hebdomadaire doit être ≥ 0')
  }

  for (const field of ['courseHours', 'labHours', 'personalHours'] as const) {
    if (i[field] !== undefined && i[field] !== null) {
      const v = Number(i[field])
      if (!Number.isInteger(v) || v < 0) errors.push(`${field} doit être un entier ≥ 0`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateTaskInput(input: unknown): ValidationResult {
  const errors: string[] = []

  if (input === null || typeof input !== 'object') {
    return { valid: false, errors: ['Corps de requête invalide'] }
  }

  const i = input as Record<string, unknown>

  const title = typeof i.title === 'string' ? i.title.trim() : ''
  if (!title) errors.push('Le titre de la Tâche est requis')

  if (i.estimatedDurationMinutes !== undefined && i.estimatedDurationMinutes !== null) {
    const d = Number(i.estimatedDurationMinutes)
    if (isNaN(d) || d <= 0) errors.push('La durée estimée doit être > 0')
  }

  if (i.priority !== undefined && i.priority !== null && !VALID_PRIORITIES.has(i.priority as string)) {
    errors.push('La priorité doit être LOW, MEDIUM, HIGH ou CRITICAL')
  }

  return { valid: errors.length === 0, errors }
}

export function validateDeadlineInput(input: unknown): ValidationResult {
  const errors: string[] = []

  if (input === null || typeof input !== 'object') {
    return { valid: false, errors: ['Corps de requête invalide'] }
  }

  const i = input as Record<string, unknown>

  const title = typeof i.title === 'string' ? i.title.trim() : ''
  if (!title) errors.push("Le titre de l'Échéance est requis")

  if (!i.dueDate || typeof i.dueDate !== 'string') {
    errors.push("La date d'échéance est requise")
  } else {
    const d = new Date(i.dueDate)
    if (isNaN(d.getTime())) errors.push("La date d'échéance est invalide")
  }

  if (i.weight !== undefined && i.weight !== null) {
    const w = Number(i.weight)
    if (isNaN(w) || w < 0 || w > 100) errors.push('Le poids doit être entre 0 et 100')
  }

  if (i.priority !== undefined && i.priority !== null && !VALID_PRIORITIES.has(i.priority as string)) {
    errors.push('La priorité doit être LOW, MEDIUM, HIGH ou CRITICAL')
  }

  return { valid: errors.length === 0, errors }
}

// ─────────────────────────────────────────────────────────────────────────────

export interface DeadlinePreview {
  id: string
  title: string
  dueDate: Date
  weight: number | null
  completed: boolean
}

export interface CourseWithStats {
  id: string
  code: string
  name: string
  taskCount: number
  deadlines: DeadlinePreview[]
  courseHours: number
  labHours: number
  personalHours: number
}

export interface TaskItem {
  id: string
  title: string
  description: string | null
  estimatedDurationMinutes: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  completed: boolean
}

export interface CourseDetail {
  id: string
  userId: string
  code: string
  name: string
  difficultyLevel: number
  estimatedWeeklyWorkload: number
  courseHours: number
  labHours: number
  personalHours: number
  tasks: TaskItem[]
  deadlines: DeadlinePreview[]
}

export async function getCourses(userId: string): Promise<CourseWithStats[]> {
  const courses = await prisma.course.findMany({
    where: { userId },
    include: {
      deadlines: {
        select: { id: true, title: true, dueDate: true, weight: true, completed: true },
        orderBy: { dueDate: 'asc' },
      },
      tasks: {
        where: { completed: false },
        select: { id: true },
      },
    },
    orderBy: { code: 'asc' },
  })

  return courses.map((c) => ({
    id:            c.id,
    code:          c.code,
    name:          c.name,
    taskCount:     c.tasks.length,
    deadlines:     c.deadlines,
    courseHours:   c.courseHours,
    labHours:      c.labHours,
    personalHours: c.personalHours,
  }))
}

export async function createCourse(userId: string, input: CreateCourseInput): Promise<CourseWithStats> {
  const course = await prisma.course.create({
    data: {
      userId,
      code:                    input.code.trim().toUpperCase(),
      name:                    input.name.trim(),
      difficultyLevel:         input.difficultyLevel ?? 3,
      estimatedWeeklyWorkload: input.estimatedWeeklyWorkload ?? 3.0,
      courseHours:             input.courseHours ?? 0,
      labHours:                input.labHours ?? 0,
      personalHours:           input.personalHours ?? 0,
    },
    include: {
      deadlines: {
        select: { id: true, title: true, dueDate: true, weight: true, completed: true },
        orderBy: { dueDate: 'asc' },
      },
      tasks: {
        where: { completed: false },
        select: { id: true },
      },
    },
  })

  return {
    id:            course.id,
    code:          course.code,
    name:          course.name,
    taskCount:     course.tasks.length,
    deadlines:     course.deadlines,
    courseHours:   course.courseHours,
    labHours:      course.labHours,
    personalHours: course.personalHours,
  }
}

export async function deleteCourse(courseId: string): Promise<void> {
  // Session.courseId → ON DELETE SET NULL, TimeBlock.taskId → ON DELETE SET NULL
  // Task/Deadline/CoursePlan → ON DELETE CASCADE — all handled by DB constraints
  await prisma.course.delete({ where: { id: courseId } })
}

export async function createTask(courseId: string, input: CreateTaskInput): Promise<TaskItem> {
  const task = await prisma.task.create({
    data: {
      courseId,
      title:                    input.title.trim(),
      description:              input.description ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? 30,
      priority:                 input.priority ?? 'MEDIUM',
    },
  })

  return {
    id:                       task.id,
    title:                    task.title,
    description:              task.description,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
    priority:                 task.priority as TaskItem['priority'],
    completed:                task.completed,
  }
}

export async function updateTask(taskId: string, input: CreateTaskInput): Promise<TaskItem> {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      title:                    input.title.trim(),
      description:              input.description ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? 30,
    },
  })

  return {
    id:                       task.id,
    title:                    task.title,
    description:              task.description,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
    priority:                 task.priority as TaskItem['priority'],
    completed:                task.completed,
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  // TimeBlock.taskId → ON DELETE SET NULL — handled by DB constraint
  await prisma.task.delete({ where: { id: taskId } })
}

export async function createDeadline(courseId: string, input: CreateDeadlineInput): Promise<DeadlinePreview> {
  const deadline = await prisma.deadline.create({
    data: {
      courseId,
      title:    input.title.trim(),
      dueDate:  new Date(input.dueDate + 'T12:00:00'),
      weight:   input.weight ?? undefined,
      priority: input.priority ?? 'MEDIUM',
    },
    select: { id: true, title: true, dueDate: true, weight: true, completed: true },
  })

  return deadline
}

export async function updateDeadline(deadlineId: string, input: CreateDeadlineInput): Promise<DeadlinePreview> {
  const deadline = await prisma.deadline.update({
    where: { id: deadlineId },
    data: {
      title:   input.title.trim(),
      dueDate: new Date(input.dueDate + 'T12:00:00'),
      weight:  input.weight ?? null,
    },
    select: { id: true, title: true, dueDate: true, weight: true, completed: true },
  })

  return deadline
}

export async function deleteDeadline(deadlineId: string): Promise<void> {
  await prisma.deadline.delete({ where: { id: deadlineId } })
}

export async function getCourse(courseId: string): Promise<CourseDetail | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      tasks: {
        orderBy: [{ completed: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
      },
      deadlines: {
        orderBy: { dueDate: 'asc' },
      },
    },
  })

  if (!course) return null

  return {
    id:                      course.id,
    userId:                  course.userId,
    code:                    course.code,
    name:                    course.name,
    difficultyLevel:         course.difficultyLevel,
    estimatedWeeklyWorkload: course.estimatedWeeklyWorkload,
    courseHours:             course.courseHours,
    labHours:                course.labHours,
    personalHours:           course.personalHours,
    tasks:                   course.tasks.map((t) => ({
      id:                       t.id,
      title:                    t.title,
      description:              t.description,
      estimatedDurationMinutes: t.estimatedDurationMinutes,
      priority:                 t.priority as TaskItem['priority'],
      completed:                t.completed,
    })),
    deadlines: course.deadlines,
  }
}
