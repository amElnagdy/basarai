import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// /api/* is proxied to FastAPI, which verifies the bearer token itself. Leaving
// it public means an expired session gets the backend's 401 JSON (which
// lib/api.ts handles) instead of a 307 to the login page's HTML.
const isPublic = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/auth/(.*)',
  '/api/(.*)',
])
const isAuthPage = createRouteMatcher(['/login(.*)', '/signup(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  if (userId && isAuthPage(req)) return NextResponse.redirect(new URL('/brands', req.url))
  if (!isPublic(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
