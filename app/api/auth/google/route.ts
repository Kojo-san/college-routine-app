import { google } from 'googleapis'

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  )
}

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json(
      { error: 'Google OAuth non configuré — ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env' },
      { status: 503 },
    )
  }

  const oauth2Client = getOAuthClient()
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  })

  return Response.redirect(url)
}
