import { parseAppleHealthExport, recordToHealthInput } from '@/lib/applehealth'
import { upsertSleepData, upsertActivityData, upsertHeartRateData } from '@/lib/health'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return Response.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  let records: ReturnType<typeof parseAppleHealthExport>
  try {
    records = parseAppleHealthExport(body)
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 })
  }

  if (records.length === 0) {
    return Response.json({ data: { imported: 0 } })
  }

  const user = await prisma.user.findFirst({ select: { id: true } })
  if (!user) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  let imported = 0
  for (const record of records) {
    const input  = recordToHealthInput(record)
    const date   = new Date(input.date)
    date.setUTCHours(0, 0, 0, 0)

    if (input.sleep)    await upsertSleepData(user.id, date, input.sleep)
    if (input.activity) await upsertActivityData(user.id, date, input.activity)
    if (input.heartRate) await upsertHeartRateData(user.id, date, input.heartRate)

    imported++
  }

  return Response.json({ data: { imported } })
}
