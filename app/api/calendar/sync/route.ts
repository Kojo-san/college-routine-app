import { google } from 'googleapis'
import { parseGCalEvent } from '@/lib/gcal'
import prisma from '@/lib/prisma'

export async function GET() {
  const user = await prisma.user.findFirst({ select: { id: true } })
  if (!user) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  const token = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId: user.id, provider: 'google' } },
  })
  if (!token) {
    return Response.json({ error: 'Google Calendar non connecté', code: 'NOT_CONNECTED' }, { status: 401 })
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

  // Auto-refresh — save new access token if refreshed
  oauth2Client.on('tokens', async (tokens) => {
    await prisma.oAuthToken.update({
      where: { userId_provider: { userId: user.id, provider: 'google' } },
      data: {
        accessToken: tokens.access_token!,
        expiresAt:   tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    })
  })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const now   = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - start.getDay() + 1) // Monday

  const end = new Date(start)
  end.setDate(start.getDate() + 7) // Sunday +1

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin:    start.toISOString(),
    timeMax:    end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  })

  const events = (response.data.items ?? [])
    .map((item) => parseGCalEvent({
      id: item.id ?? '',
      summary: item.summary ?? '',
      start: { dateTime: item.start?.dateTime ?? undefined, date: item.start?.date ?? undefined },
      end:   { dateTime: item.end?.dateTime ?? undefined,   date: item.end?.date ?? undefined },
    }))
    .filter((b): b is NonNullable<ReturnType<typeof parseGCalEvent>> => b !== null)

  return Response.json({ data: events })
}
