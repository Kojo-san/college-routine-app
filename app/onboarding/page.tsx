import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/session'
import prisma from '@/lib/prisma'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage() {
  const { userId } = await verifySession()

  const [prefs, user] = await Promise.all([
    prisma.planningPreferences.findUnique({ where: { userId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ])

  if (prefs) redirect('/planning')

  return <OnboardingForm name={user?.name ?? 'Étudiant'} />
}
