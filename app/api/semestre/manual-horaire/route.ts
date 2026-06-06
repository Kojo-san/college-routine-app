import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

interface ManualSlot {
  courseId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  type: 'COURS' | 'LAB'
  room?: string
  group?: string
}

const HHMM_RE = /^\d{2}:\d{2}$/

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  let slots: ManualSlot[]
  try {
    const body = await request.json() as { slots?: unknown }
    if (!Array.isArray(body.slots)) {
      return Response.json({ error: 'Champ "slots" manquant ou invalide' }, { status: 400 })
    }
    slots = (body.slots as unknown[])
      .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object')
      .filter(s =>
        typeof s.courseId === 'string' &&
        typeof s.dayOfWeek === 'number' &&
        (s.dayOfWeek as number) >= 1 && (s.dayOfWeek as number) <= 5 &&
        typeof s.startTime === 'string' && HHMM_RE.test(s.startTime as string) &&
        typeof s.endTime === 'string' && HHMM_RE.test(s.endTime as string) &&
        (s.type === 'COURS' || s.type === 'LAB'),
      )
      .map(s => ({
        courseId:  s.courseId as string,
        dayOfWeek: s.dayOfWeek as number,
        startTime: s.startTime as string,
        endTime:   s.endTime as string,
        type:      s.type as 'COURS' | 'LAB',
        room:      typeof s.room  === 'string' && s.room  ? (s.room  as string).trim() : undefined,
        group:     typeof s.group === 'string' && s.group ? (s.group as string).trim() : undefined,
      }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Corps de requête invalide : ${msg}` }, { status: 400 })
  }

  if (slots.length === 0) {
    return Response.json({ error: 'Aucun créneau valide fourni' }, { status: 400 })
  }

  const courseIds = [...new Set(slots.map(s => s.courseId))]
  const userCourses = await prisma.course.findMany({
    where: { id: { in: courseIds }, userId: session.userId },
    select: { id: true, code: true },
  })
  const validIds = new Set(userCourses.map(c => c.id))
  const filtered = slots.filter(s => validIds.has(s.courseId))

  if (filtered.length === 0) {
    return Response.json({ error: 'Aucun cours valide trouvé' }, { status: 403 })
  }

  const byCourse = new Map<string, ManualSlot[]>()
  for (const slot of filtered) {
    if (!byCourse.has(slot.courseId)) byCourse.set(slot.courseId, [])
    byCourse.get(slot.courseId)!.push(slot)
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const [courseId, courseSlots] of byCourse) {
        await tx.courseSchedule.deleteMany({ where: { courseId } })
        await tx.courseSchedule.createMany({
          data: courseSlots.map(s => ({
            courseId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime:   s.endTime,
            type:      s.type,
            room:      s.room  ?? null,
            group:     s.group ?? null,
          })),
        })
      }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Sauvegarde échouée : ${msg}`, step: 'db' }, { status: 500 })
  }

  return Response.json({
    slots: filtered.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime:   s.endTime,
      type:      s.type,
      courseId:  s.courseId,
      ...(s.room  ? { room:  s.room  } : {}),
      ...(s.group ? { group: s.group } : {}),
    })),
    matched:   courseIds.length,
    total:     courseIds.length,
    unmatched: [],
  }, { status: 201 })
}
