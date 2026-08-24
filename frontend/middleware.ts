import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublic = createRouteMatcher(['/', '/login(.*)', '/signup(.*)', '/auth/(.*)'])
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
