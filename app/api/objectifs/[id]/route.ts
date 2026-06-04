import { deleteGoal } from '@/lib/goals'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    await deleteGoal(id)
    return Response.json({ data: { deleted: true } })
  } catch {
    return Response.json({ error: 'Objectif introuvable' }, { status: 404 })
  }
}
