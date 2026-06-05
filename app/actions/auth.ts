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
  redirect('/planning')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

type OnboardingState = { error?: string } | undefined

export async function completeOnboarding(state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const { userId } = await verifySession()

  const wakeTime  = (formData.get('wakeTime') as string)?.trim()
  const sleepTime = (formData.get('sleepTime') as string)?.trim()
  const gymTime   = (formData.get('gymTime') as string)?.trim() || null
  const maxHours  = parseFloat(formData.get('maxDailyStudyHours') as string)

  if (!wakeTime || !sleepTime) return { error: 'Heure de réveil et de coucher requises.' }
  if (isNaN(maxHours) || maxHours < 1 || maxHours > 16) return { error: "Heures d'étude invalides (1–16)." }

  await prisma.planningPreferences.upsert({
    where:  { userId },
    create: { userId, preferredWakeTime: wakeTime, preferredSleepTime: sleepTime, preferredGymTime: gymTime, maxDailyStudyHours: maxHours },
    update: { preferredWakeTime: wakeTime, preferredSleepTime: sleepTime, preferredGymTime: gymTime, maxDailyStudyHours: maxHours },
  })

  redirect('/planning')
}
