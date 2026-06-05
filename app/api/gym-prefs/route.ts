import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const prefs = await prisma.gymPreferences.findUnique({ where: { userId } })
  return Response.json({ data: prefs })
}

export async function PUT(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body = await request.json()

  const { frequencyPerWeek, sessionDurationMinutes, preferredDays, preferredTime } = body

  if (
    typeof frequencyPerWeek !== 'number' || frequencyPerWeek < 1 || frequencyPerWeek > 7 ||
    typeof sessionDurationMinutes !== 'number' || sessionDurationMinutes < 30 || sessionDurationMinutes > 120 ||
    !Array.isArray(preferredDays) ||
    !['matin', 'après-midi', 'soir'].includes(preferredTime)
  ) {
    return Response.json({ error: 'Paramètres de préférences gym invalides' }, { status: 400 })
  }

  const prefs = await prisma.gymPreferences.upsert({
    where: { userId },
    create: { userId, frequencyPerWeek, sessionDurationMinutes, preferredDays, preferredTime },
    update: { frequencyPerWeek, sessionDurationMinutes, preferredDays, preferredTime },
  })

  return Response.json({ data: prefs })
}
