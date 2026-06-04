import { generateDailyPlan } from '@/lib/planning'
import prisma from '@/lib/prisma'

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } })
  return user?.id ?? null
}

export async function POST() {
  const userId = await getFirstUserId()
  if (!userId) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const plan = await generateDailyPlan(userId, today)
  return Response.json({ data: plan })
}
