import { toggleGoalCompleted } from '@/lib/goals'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const result = await toggleGoalCompleted(id)
    return Response.json({ data: result })
  } catch {
    return Response.json({ error: 'Objectif introuvable' }, { status: 404 })
  }
}
