import { upsertActivityData } from '@/lib/health'
import { getOptionalSession } from '@/lib/session'

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body = await request.json()
  const { date, steps, activeCalories, workoutMinutes } = body

  if (
    typeof steps !== 'number' ||
    typeof activeCalories !== 'number' ||
    typeof workoutMinutes !== 'number' ||
    steps < 0 ||
    activeCalories < 0 ||
    workoutMinutes < 0
  ) {
    return Response.json({ error: "Données d'activité invalides" }, { status: 400 })
  }

  const targetDate = date ? new Date(date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const summary = await upsertActivityData(userId, targetDate, {
    steps,
    activeCalories,
    workoutMinutes,
  })

  return Response.json({ data: summary })
}
