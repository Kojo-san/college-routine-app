import { createGoal, validateGoalInput } from '@/lib/goals'
import prisma from '@/lib/prisma'

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } })
  return user?.id ?? null
}

export async function POST(request: Request) {
  const body = await request.json()

  const validation = validateGoalInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const userId = await getFirstUserId()
  if (!userId) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  const goal = await createGoal(userId, body)
  return Response.json({ data: goal }, { status: 201 })
}
