import { createDeadline, validateDeadlineInput } from '@/lib/courses'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId } = await params

  const course = await prisma.course.findUnique({ where: { id: courseId, userId: session.userId }, select: { id: true } })
  if (!course) return Response.json({ error: 'Cours introuvable' }, { status: 404 })

  const body = await request.json()

  const validation = validateDeadlineInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const deadline = await createDeadline(courseId, body)
  return Response.json({ data: deadline }, { status: 201 })
}
