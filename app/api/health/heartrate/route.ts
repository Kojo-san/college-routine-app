import { upsertHeartRateData } from '@/lib/health'
import { getOptionalSession } from '@/lib/session'

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

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

  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const summary = await upsertHeartRateData(userId, targetDate, {
    restingHeartRate,
    averageHeartRate,
  })

  return Response.json({ data: summary })
}
