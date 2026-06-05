import { patchTimeBlock, validateTimeBlockPatch } from '@/lib/planning'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string; blockId: string }> },
) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { planId, blockId } = await params

  const plan = await prisma.dailyPlan.findUnique({ where: { id: planId, userId: session.userId }, select: { id: true } })
  if (!plan) return Response.json({ error: 'Bloc introuvable' }, { status: 404 })

  const body = await request.json()

  const validation = validateTimeBlockPatch(body)
  if (!validation.valid) {
    return Response.json({ error: validation.errors.join(' — ') }, { status: 400 })
  }

  try {
    const block = await patchTimeBlock(planId, blockId, body)
    return Response.json({ data: block })
  } catch {
    return Response.json({ error: 'Bloc introuvable' }, { status: 404 })
  }
}
