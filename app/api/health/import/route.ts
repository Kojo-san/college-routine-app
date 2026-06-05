import { parseAppleHealthExport, recordToHealthInput } from '@/lib/applehealth'
import { upsertSleepData, upsertActivityData, upsertHeartRateData } from '@/lib/health'
import { getOptionalSession } from '@/lib/session'

// TODO (Phase D): also accept X-API-Key header for iOS app access without session cookie

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

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

  let imported = 0
  for (const record of records) {
    const input  = recordToHealthInput(record)
    const date   = new Date(input.date)
    date.setUTCHours(0, 0, 0, 0)

    if (input.sleep)     await upsertSleepData(userId, date, input.sleep)
    if (input.activity)  await upsertActivityData(userId, date, input.activity)
    if (input.heartRate) await upsertHeartRateData(userId, date, input.heartRate)

    imported++
  }

  return Response.json({ data: { imported } })
}
