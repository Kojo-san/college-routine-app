import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

interface GymSession {
  startTime: string
  endTime: string
}

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  let sessions: GymSession[]
  try {
    sessions = await request.json()
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return Response.json({ error: 'Aucune séance fournie.' }, { status: 400 })
    }
  } catch {
    return Response.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  // Group sessions by date, create or reuse DailyPlan, insert TimeBlocks
  const byDate = new Map<string, GymSession[]>()
  for (const s of sessions) {
    const dateKey = new Date(s.startTime).toISOString().slice(0, 10)
    if (!byDate.has(dateKey)) byDate.set(dateKey, [])
    byDate.get(dateKey)!.push(s)
  }

  const created = []
  for (const [dateKey, daySessions] of byDate) {
    const date = new Date(dateKey + 'T00:00:00.000Z')

    let plan = await prisma.dailyPlan.findFirst({
      where: { userId, date },
    })

    if (!plan) {
      plan = await prisma.dailyPlan.create({
        data: { userId, date },
      })
    }

    for (const s of daySessions) {
      const block = await prisma.timeBlock.create({
        data: {
          dailyPlanId: plan.id,
          label: '💪 Séance de gym',
          typeActivite: 'FITNESS',
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        },
      })
      created.push(block)
    }
  }

  return Response.json({ data: created })
}
