import { google } from 'googleapis'
import { planBlockToGCalEvent } from '@/lib/gcal'
import { getDailyPlan } from '@/lib/planning'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getOptionalSession()
  if (!session) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { userId } = session

  const body    = await request.json().catch(() => ({}))
  const dateStr = typeof body.date === 'string' ? body.date : new Date().toISOString().slice(0, 10)

  const token = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: 'google' } },
  })
  if (!token) {
    return Response.json({ error: 'Google Calendar non connecté', code: 'NOT_CONNECTED' }, { status: 401 })
  }

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const plan = await getDailyPlan(userId, date)
  if (!plan || plan.timeBlocks.length === 0) {
    return Response.json({ error: 'Aucun planning pour cette date' }, { status: 404 })
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  oauth2Client.setCredentials({
    access_token:  token.accessToken,
    refresh_token: token.refreshToken ?? undefined,
    expiry_date:   token.expiresAt?.getTime(),
  })

  oauth2Client.on('tokens', async (tokens) => {
    await prisma.oAuthToken.update({
      where: { userId_provider: { userId, provider: 'google' } },
      data: {
        accessToken: tokens.access_token!,
        expiresAt:   tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    })
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const created: string[] = []
  for (const block of plan.timeBlocks) {
    const event = planBlockToGCalEvent(block, date)
    const res   = await calendar.events.insert({ calendarId: 'primary', requestBody: event })
    if (res.data.id) created.push(res.data.id)
  }

  return Response.json({ data: { pushed: created.length, date: dateStr } })
}
