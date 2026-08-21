import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/register']
const API_PUBLIC = ['/api/auth', '/api/health/import']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public pages, static assets and public API routes
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    API_PUBLIC.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Verify session from cookie
  const token = request.cookies.get('session')?.value
  const session = await decrypt(token)

  if (!session?.userId) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/agenda', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
