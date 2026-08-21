import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import type { EventType } from '@/app/generated/prisma/client'

interface PatchEventBody {
  title?: unknown
  startTime?: unknown
  endTime?: unknown
  type?: unknown
  color?: unknown
  location?: unknown
  rrule?: unknown
}

const VALID_TYPES = new Set(['COURS', 'LAB', 'PERSO'])

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.event.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.userId) {
    return Response.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  let body: PatchEventBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if ('title' in body) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) return Response.json({ error: 'Le titre ne peut pas être vide' }, { status: 400 })
    data.title = title
  }

  if ('startTime' in body) {
    const d = typeof body.startTime === 'string' ? new Date(body.startTime) : null
    if (!d || isNaN(d.getTime())) return Response.json({ error: 'startTime invalide' }, { status: 400 })
    data.startTime = d
  }

  if ('endTime' in body) {
    const d = typeof body.endTime === 'string' ? new Date(body.endTime) : null
    if (!d || isNaN(d.getTime())) return Response.json({ error: 'endTime invalide' }, { status: 400 })
    data.endTime = d
  }

  if (data.startTime && data.endTime && (data.endTime as Date) <= (data.startTime as Date)) {
    return Response.json({ error: 'endTime doit être postérieur à startTime' }, { status: 400 })
  }

  if ('type' in body) {
    if (typeof body.type !== 'string' || !VALID_TYPES.has(body.type)) {
      return Response.json({ error: 'type invalide' }, { status: 400 })
    }
    data.type = body.type as EventType
  }

  if ('color' in body) {
    if (typeof body.color !== 'string' || !body.color) {
      return Response.json({ error: 'color invalide' }, { status: 400 })
    }
    data.color = body.color
  }

  if ('location' in body) {
    data.location = typeof body.location === 'string' && body.location.trim() ? body.location.trim() : null
  }

  if ('rrule' in body) {
    data.rrule = typeof body.rrule === 'string' && body.rrule.trim() ? body.rrule.trim() : null
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucun champ valide fourni' }, { status: 400 })
  }

  const updated = await prisma.event.update({ where: { id }, data })
  return Response.json({ data: updated })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.event.findUnique({ where: { id }, select: { userId: true } })
  if (!existing || existing.userId !== session.userId) {
    return Response.json({ error: 'Événement introuvable' }, { status: 404 })
  }

  await prisma.event.delete({ where: { id } })
  return Response.json({ data: { success: true } })
}
