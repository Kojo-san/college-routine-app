import { upsertActivityData } from '@/lib/health'
import prisma from '@/lib/prisma'

async function getFirstUserId(): Promise<string | null> {
  const user = await prisma.user.findFirst({ select: { id: true } })
  return user?.id ?? null
}

export async function POST(request: Request) {
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

  const userId = await getFirstUserId()
  if (!userId) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
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
