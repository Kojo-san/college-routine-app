import 'server-only'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? 'dev-secret-change-in-production-min-32-chars!!'
)

const COOKIE_NAME = 'session'
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

type SessionPayload = { userId: string; expiresAt: Date }

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(payload.expiresAt.getTime() / 1000))
    .sign(SECRET)
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] })
    return { userId: payload.userId as string, expiresAt: new Date((payload.exp ?? 0) * 1000) }
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt({ userId, expiresAt })
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export const verifySession = cache(async (): Promise<{ userId: string }> => {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  const session = await decrypt(token)
  if (!session?.userId) redirect('/login')
  return { userId: session.userId }
})

export async function getOptionalSession(): Promise<{ userId: string } | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  const session = await decrypt(token)
  if (!session?.userId) return null
  return { userId: session.userId }
}
