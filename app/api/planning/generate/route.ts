import { generateDailyPlan } from '@/lib/planning'
import { getOptionalSession } from '@/lib/session'

export async function POST() {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const plan = await generateDailyPlan(userId, today)
  return Response.json({ data: plan })
}
