import { deleteTask } from '@/lib/courses'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id: courseId, taskId } = await params

  const task = await prisma.task.findUnique({
    where: { id: taskId, courseId },
    select: { course: { select: { userId: true } } },
  })
  if (!task || task.course.userId !== session.userId) {
    return Response.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  await deleteTask(taskId)
  return Response.json({ data: { deleted: true } })
}
