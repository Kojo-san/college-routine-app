import { upsertHeartRateData } from '@/lib/health'
import prisma from '@/lib/prisma'

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } })
  return user?.id ?? null
}

export async function POST(request: Request) {
  const body = await request.json()
  const { date, restingHeartRate, averageHeartRate } = body

  if (
    typeof restingHeartRate !== 'number' ||
    typeof averageHeartRate !== 'number' ||
    restingHeartRate < 30 ||
    restingHeartRate > 200 ||
    averageHeartRate < 30 ||
    averageHeartRate > 220
  ) {
    return Response.json({ error: 'Données de fréquence cardiaque invalides' }, { status: 400 })
  }

  const userId = await getFirstUserId()
  if (!userId) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const summary = await upsertHeartRateData(userId, targetDate, {
    restingHeartRate,
    averageHeartRate,
  })

  return Response.json({ data: summary })
}
