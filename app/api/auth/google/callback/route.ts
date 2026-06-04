import { google } from 'googleapis'
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

  const oauth2Client = getOAuthClient()
  const { tokens } = await oauth2Client.getToken(code)

  const user = await prisma.user.findFirst({ select: { id: true } })
  if (!user) {
    return Response.json({ error: 'Aucun étudiant trouvé' }, { status: 404 })
  }

  await prisma.oAuthToken.upsert({
    where: { userId_provider: { userId: user.id, provider: 'google' } },
    create: {
      userId:       user.id,
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
