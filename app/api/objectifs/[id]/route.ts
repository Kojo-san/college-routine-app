import { deleteGoal } from '@/lib/goals'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await params

  const goal = await prisma.goal.findUnique({ where: { id, userId: session.userId }, select: { id: true } })
  if (!goal) return Response.json({ error: 'Objectif introuvable' }, { status: 404 })

  await deleteGoal(id)
  return Response.json({ data: { deleted: true } })
}
