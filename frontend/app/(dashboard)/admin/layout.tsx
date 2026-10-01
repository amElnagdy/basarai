import { notFound } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

// Server-side operator gate. The backend `/admin/*` 403 is the real security
// control; this hides the Admin UI from non-operators without leaking the
// allow-list. notFound() is a Server Component API, so this layout is a Server
// Component that resolves is_admin from `/me` before rendering any admin view.
//
// This runs in Node (not the browser), so it must call the backend at an
// absolute, server-reachable URL — the public `NEXT_PUBLIC_API_URL` is the
// relative `/api` path that only resolves in the browser via the next.config
// rewrite. We hit the same internal address that rewrite targets.
const BACKEND_INTERNAL_URL = (
  process.env.BACKEND_INTERNAL_URL ??
  process.env.NEXT_SERVER_API_URL ??
  'http://127.0.0.1:8000'
).replace(/\/+$/, '')

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, getToken } = await auth()
  if (!userId) {
    notFound()
  }
  const token = await getToken()
  if (!token) {
    notFound()
  }

  const response = await fetch(`${BACKEND_INTERNAL_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const profile = response.ok ? await response.json() : null

  if (!profile?.is_admin) {
    notFound()
  }

  return <>{children}</>
}
