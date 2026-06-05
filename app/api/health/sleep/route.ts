import { upsertSleepData } from '@/lib/health'
import { getOptionalSession } from '@/lib/session'

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

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

  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const summary = await upsertSleepData(userId, targetDate, {
    sleepDurationHours,
    sleepEfficiency,
    deepSleepMinutes,
  })

  return Response.json({ data: summary })
}
