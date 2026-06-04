import { patchTimeBlock, validateTimeBlockPatch } from '@/lib/planning'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ planId: string; blockId: string }> },
) {
  const { planId, blockId } = await params
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
