import { createGoal, validateGoalInput } from '@/lib/goals'
import { getOptionalSession } from '@/lib/session'

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body = await request.json()

  const validation = validateGoalInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const goal = await createGoal(userId, body)
  return Response.json({ data: goal }, { status: 201 })
}
