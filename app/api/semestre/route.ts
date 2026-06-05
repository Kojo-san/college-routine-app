import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const setup = await prisma.semesterSetup.findUnique({
    where: { userId },
    include: {
      courseHours: {
        include: { course: { select: { id: true, code: true, name: true } } },
      },
    },
  })

  return Response.json({ data: setup })
}

export async function PUT(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body = await request.json()

  if (
    typeof body.wakeTime !== 'string' ||
    typeof body.sleepTime !== 'string' ||
    !/^\d{2}:\d{2}$/.test(body.wakeTime) ||
    !/^\d{2}:\d{2}$/.test(body.sleepTime)
  ) {
    return Response.json({ error: 'wakeTime et sleepTime requis au format HH:MM' }, { status: 400 })
  }

  const setup = await prisma.semesterSetup.upsert({
    where: { userId },
    create: { userId, wakeTime: body.wakeTime, sleepTime: body.sleepTime },
    update: { wakeTime: body.wakeTime, sleepTime: body.sleepTime },
  })

  return Response.json({ data: setup })
}
