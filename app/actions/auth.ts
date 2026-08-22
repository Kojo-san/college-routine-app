'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { createSession, deleteSession, verifySession } from '@/lib/session'

type RegisterState = { errors?: { name?: string[]; email?: string[]; password?: string[] }; message?: string } | undefined
type LoginState = { error?: string } | undefined

export async function register(state: RegisterState, formData: FormData): Promise<RegisterState> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  const errors: NonNullable<RegisterState>['errors'] = {}

  if (!name || name.length < 2) errors.name = ['Le nom doit contenir au moins 2 caractères.']
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Adresse courriel invalide.']
  if (!password || password.length < 8) errors.password = ['Le mot de passe doit contenir au moins 8 caractères.']

  if (Object.keys(errors).length > 0) return { errors }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) return { errors: { email: ['Cette adresse courriel est déjà utilisée.'] } }

  const hashed = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { name, email, password: hashed } })

  await createSession(user.id)
  redirect('/onboarding')
}

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) return { error: 'Courriel et mot de passe requis.' }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, password: true } })
  if (!user?.password) return { error: 'Identifiants incorrects.' }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { error: 'Identifiants incorrects.' }

  await createSession(user.id)
  redirect('/transition?source=login')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

export async function deleteAccount(): Promise<void> {
  const { userId } = await verifySession()
  await prisma.user.delete({ where: { id: userId } })
  await deleteSession()
  redirect('/register')
}

// Fixed defaults for the still-required PlanningPreferences row — onboarding
// no longer collects sleep/wake times (the /planning feature that consumed
// them was removed), but completeOnboarding still needs to create this row
// since app/onboarding/page.tsx gates "onboarding done" on its existence.
const DEFAULT_WAKE_TIME = '08:00'
const DEFAULT_SLEEP_TIME = '23:00'

export interface GymPreferencesInput {
  sessionsPerWeek: number
  sessionDuration: number
  preferredTimes: string[]
  daysToAvoid: string[]
}

export interface ExtraActivity {
  name: string
  type: string
  recurrence: string
}

export interface OnboardingInput {
  name: string
  program: string
  semesterStart: string
}

export async function completeOnboarding(input: OnboardingInput): Promise<{ error?: string } | void> {
  const { userId } = await verifySession()
  const { name, program, semesterStart } = input

  if (!name || name.trim().length < 2) return { error: 'Le nom doit contenir au moins 2 caractères.' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      program: program || null,
      semesterStart: semesterStart || null,
    },
  })

  await prisma.planningPreferences.upsert({
    where:  { userId },
    create: { userId, preferredWakeTime: DEFAULT_WAKE_TIME, preferredSleepTime: DEFAULT_SLEEP_TIME, maxDailyStudyHours: 6 },
    update: {},
  })

  redirect('/transition?source=onboarding')
}
