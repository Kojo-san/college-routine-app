import { deleteTask, updateTask, validateTaskInput } from '@/lib/courses'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

async function assertOwnership(courseId: string, taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId, courseId },
    select: { course: { select: { userId: true } } },
  })
  return Boolean(task && task.course.userId === userId)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId, taskId } = await params

  if (!(await assertOwnership(courseId, taskId, session.userId))) {
    return Response.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  const body = await request.json()

  const validation = validateTaskInput(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  const task = await updateTask(taskId, body)
  return Response.json({ data: task })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId, taskId } = await params

  if (!(await assertOwnership(courseId, taskId, session.userId))) {
    return Response.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  await deleteTask(taskId)
  return Response.json({ data: { deleted: true } })
}
