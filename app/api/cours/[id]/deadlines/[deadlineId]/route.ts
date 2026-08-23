import { updateDeadline, deleteDeadline, validateDeadlineInput } from '@/lib/courses'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

async function assertOwnership(courseId: string, deadlineId: string, userId: string): Promise<boolean> {
  const deadline = await prisma.deadline.findUnique({
    where: { id: deadlineId, courseId },
    select: { course: { select: { userId: true } } },
  })
  return Boolean(deadline && deadline.course.userId === userId)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; deadlineId: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId, deadlineId } = await params

  if (!(await assertOwnership(courseId, deadlineId, session.userId))) {
    return Response.json({ error: 'Échéance introuvable' }, { status: 404 })
  }

  const body = await request.json()

  const validation = validateDeadlineInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const deadline = await updateDeadline(deadlineId, body)
  return Response.json({ data: deadline })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; deadlineId: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId, deadlineId } = await params

  if (!(await assertOwnership(courseId, deadlineId, session.userId))) {
    return Response.json({ error: 'Échéance introuvable' }, { status: 404 })
  }

  await deleteDeadline(deadlineId)
  return Response.json({ data: { deleted: true } })
}
