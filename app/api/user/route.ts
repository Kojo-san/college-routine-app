import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      program: true,
      wakeTime: true,
      sleepTime: true,
      includeGym: true,
      gymPreferences: true,
      extraActivities: true,
    },
  })

  return Response.json({ data: user })
}

export async function PATCH(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await request.json()

  const allowed = ['name', 'program', 'wakeTime', 'sleepTime', 'includeGym', 'gymPreferences', 'extraActivities']
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucun champ valide fourni.' }, { status: 400 })
  }

  if (typeof data.name === 'string' && data.name.trim().length < 2) {
    return Response.json({ error: 'Le nom doit contenir au moins 2 caractères.' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: {
      name: true,
      program: true,
      wakeTime: true,
      sleepTime: true,
      includeGym: true,
      gymPreferences: true,
      extraActivities: true,
    },
  })

  return Response.json({ data: updated })
}
