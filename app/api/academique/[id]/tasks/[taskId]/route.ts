import { deleteTask } from '@/lib/courses'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params
  try {
    await deleteTask(taskId)
    return Response.json({ data: { deleted: true } })
  } catch {
    return Response.json({ error: 'Tâche introuvable' }, { status: 404 })
  }
}
