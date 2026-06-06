import { buildDeadlineInputs } from '@/lib/syllabus'
import type { SyllabusEvaluation } from '@/lib/syllabus'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId } = await params

  const course = await prisma.course.findUnique({ where: { id: courseId, userId: session.userId } })
  if (!course) return Response.json({ error: 'Cours introuvable' }, { status: 404 })

  let tripletText = ''
  let evaluations: SyllabusEvaluation[] = []
  try {
    const body = await request.json() as Record<string, unknown>
    tripletText = typeof body.tripletText === 'string' ? body.tripletText.trim() : ''
    if (Array.isArray(body.evaluations)) {
      evaluations = (body.evaluations as unknown[])
        .filter((e): e is Record<string, unknown> => e !== null && typeof e === 'object')
        .filter(e => typeof e.title === 'string' && typeof e.weight === 'number')
        .map(e => ({
          title:  (e.title as string).trim(),
          weight: Math.round(e.weight as number),
          ...(typeof e.date === 'string' && DATE_RE.test(e.date as string)
            ? { date: e.date as string }
            : {}),
        }))
        .filter(e => e.title.length > 0 && e.weight >= 1 && e.weight <= 100)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Corps de requête invalide : ${msg}` }, { status: 400 })
  }

  const today = new Date()
  const deadlineInputs = buildDeadlineInputs(courseId, evaluations, today)

  try {
    await prisma.$transaction(async (tx) => {
      await tx.coursePlan.upsert({
        where: { courseId },
        create: {
          courseId,
          sourceFileName: 'manual',
          topics: [],
          evaluationRules: evaluations.map(e =>
            `${e.title} — ${e.weight}%${e.date ? ` (${e.date})` : ''}`,
          ),
        },
        update: {
          evaluationRules: evaluations.map(e =>
            `${e.title} — ${e.weight}%${e.date ? ` (${e.date})` : ''}`,
          ),
        },
      })

      if (deadlineInputs.length > 0) {
        await tx.deadline.createMany({
          data: deadlineInputs.map(d => ({
            courseId,
            title:    d.title,
            dueDate:  d.dueDate,
            weight:   d.weight,
            priority: d.priority,
          })),
          skipDuplicates: true,
        })
      }
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ error: `Sauvegarde échouée : ${msg}`, step: 'db' }, { status: 500 })
  }

  return Response.json({
    scheduleText: tripletText ? `Triplet saisi : ${tripletText}` : '',
    data: {
      evaluationsExtracted: evaluations.length,
      deadlinesCreated:     deadlineInputs.length,
    },
  }, { status: 201 })
}
