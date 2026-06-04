import { upsertSleepData } from '@/lib/health'
import prisma from '@/lib/prisma'

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } })
  return user?.id ?? null
}

export async function POST(request: Request) {
  const body = await request.json()
  const { date, sleepDurationHours, sleepEfficiency, deepSleepMinutes } = body

  if (
    typeof sleepDurationHours !== 'number' ||
    typeof sleepEfficiency !== 'number' ||
    typeof deepSleepMinutes !== 'number' ||
    sleepDurationHours < 0 ||
    sleepDurationHours > 24 ||
    sleepEfficiency < 0 ||
    sleepEfficiency > 1 ||
    deepSleepMinutes < 0
  ) {
    return Response.json({ error: 'Données de sommeil invalides' }, { status: 400 })
  }

  const userId = await getFirstUserId()
  if (!userId) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const summary = await upsertSleepData(userId, targetDate, {
    sleepDurationHours,
    sleepEfficiency,
    deepSleepMinutes,
  })

  return Response.json({ data: summary })
}
