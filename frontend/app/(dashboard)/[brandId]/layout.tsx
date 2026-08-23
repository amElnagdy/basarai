import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { Brand } from '@/types'

async function getServerApiUrl(path: string) {
  const serverBase = process.env.NEXT_SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL

  if (!serverBase) {
    throw new Error('API base URL is not configured')
  }

  if (serverBase.startsWith('http://') || serverBase.startsWith('https://')) {
    const base = new URL(serverBase)
    const basePathname = base.pathname.replace(/\/+$/, '')
    const nextPathname = path.replace(/^\/+/, '')

    base.pathname = [basePathname, nextPathname].filter(Boolean).join('/') || '/'
    return base.toString()
  }

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') || 'http'

  if (!host) {
    throw new Error('Request host is unavailable for server-side API call')
  }

  const normalizedBase = serverBase.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')

  return new URL(`${normalizedBase}/${normalizedPath}`, `${protocol}://${host}`).toString()
}

async function ensureBrandAccess(brandId: string) {
  const { userId, getToken } = await auth()
  if (!userId) {
    redirect('/login')
  }
  const token = await getToken()
  if (!token) {
    redirect('/login')
  }

  const apiUrl = await getServerApiUrl(`/brands/${brandId}`)

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  if (response.status === 404) {
    notFound()
  }

  if (response.status === 401) {
    redirect('/login')
  }

  if (!response.ok) {
    throw new Error('Failed to load brand')
  }

  const payload: unknown = await response.json()
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid brand payload: expected object')
  }
  const brand = payload as Partial<Brand>
  if (
    !brand.kit_status ||
    !['not_started', 'in_progress', 'complete'].includes(brand.kit_status)
  ) {
    throw new Error('Invalid brand payload: missing or invalid kit_status')
  }
  return brand as Brand
}

export default async function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { brandId: string }
}) {
  await ensureBrandAccess(params.brandId)
  return <>{children}</>
}
