import { google } from 'googleapis'
import { getOptionalSession } from '@/lib/session'
import prisma from '@/lib/prisma'

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/planning?gcal_error=access_denied`,
    )
  }

  const session = await getOptionalSession()
  if (!session) {
    return Response.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login`,
    )
  }
  const { userId } = session

  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)

  await prisma.oAuthToken.upsert({
    where:  { userId_provider: { userId, provider: 'google' } },
    create: {
      userId,
      provider:     'google',
      accessToken:  tokens.access_token!,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt:    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope:        tokens.scope ?? null,
    },
    update: {
      accessToken:  tokens.access_token!,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt:    tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scope:        tokens.scope ?? null,
    },
  })

  return Response.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/planning?gcal_connected=1`,
  )
}
