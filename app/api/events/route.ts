import { getOptionalSession } from '@/lib/session'
import { getWeekEvents } from '@/lib/events'
import prisma from '@/lib/prisma'
import type { EventType } from '@/app/generated/prisma/client'

export async function GET(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekStartParam = searchParams.get('weekStart')
  if (!weekStartParam) {
    return Response.json({ error: 'weekStart requis' }, { status: 400 })
  }

  const weekStart = new Date(weekStartParam)
  if (isNaN(weekStart.getTime())) {
    return Response.json({ error: 'weekStart invalide' }, { status: 400 })
  }

  const occurrences = await getWeekEvents(session.userId, weekStart)
  return Response.json({ data: occurrences })
}

interface CreateEventBody {
  title?: unknown
  startTime?: unknown
  endTime?: unknown
  type?: unknown
  color?: unknown
  location?: unknown
  rrule?: unknown
}

const VALID_TYPES = new Set(['COURS', 'LAB', 'PERSO'])

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  let body: CreateEventBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return Response.json({ error: 'Le titre est requis' }, { status: 400 })

  const startTime = typeof body.startTime === 'string' ? new Date(body.startTime) : null
  const endTime = typeof body.endTime === 'string' ? new Date(body.endTime) : null
  if (!startTime || isNaN(startTime.getTime()) || !endTime || isNaN(endTime.getTime())) {
    return Response.json({ error: 'startTime et endTime sont requis et doivent être valides' }, { status: 400 })
  }
  if (endTime <= startTime) {
    return Response.json({ error: 'endTime doit être postérieur à startTime' }, { status: 400 })
  }

  const type = typeof body.type === 'string' && VALID_TYPES.has(body.type) ? (body.type as EventType) : 'PERSO'
  const color = typeof body.color === 'string' && body.color ? body.color : '#4E2A84'
  const location = typeof body.location === 'string' && body.location.trim() ? body.location.trim() : null
  const rrule = typeof body.rrule === 'string' && body.rrule.trim() ? body.rrule.trim() : null

  const event = await prisma.event.create({
    data: { userId: session.userId, title, startTime, endTime, type, color, location, rrule },
  })

  return Response.json({ data: event }, { status: 201 })
}
