declare global {
  interface Window {
    Clerk?: {
      loaded?: boolean
      session?: { getToken: () => Promise<string | null> } | null
      signOut: (opts?: { redirectUrl?: string }) => Promise<unknown>
    }
  }
}

// ClerkProvider can render children before ClerkJS finishes initializing
// window.Clerk. Wait for it (bounded) so cold-load requests from effects
// don't go out unauthenticated and 401.
async function waitForClerk(timeoutMs = 5000): Promise<void> {
  if (typeof window === 'undefined') return
  const start = Date.now()
  while (!window.Clerk?.loaded && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

export class ApiError extends Error {
  code: string
  requestId?: string

  constructor(message: string, code: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.requestId = requestId
  }
}

function parseErrorPayload(
  payload: unknown,
): { code: string; message: string; requestId?: string } | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const errorPayload = payload as {
    error?: { code?: unknown; message?: unknown; request_id?: unknown }
    detail?: unknown
  }

  if (errorPayload.error && typeof errorPayload.error.message === 'string') {
    return {
      code:
        typeof errorPayload.error.code === 'string'
          ? errorPayload.error.code
          : 'UNKNOWN',
      message: errorPayload.error.message,
      requestId:
        typeof errorPayload.error.request_id === 'string'
          ? errorPayload.error.request_id
          : undefined,
    }
  }

  if (typeof errorPayload.detail === 'string') {
    return { code: 'VALIDATION_ERROR', message: errorPayload.detail }
  }

  if (Array.isArray(errorPayload.detail)) {
    const firstMessage = errorPayload.detail.find(
      (item): item is { msg?: string } =>
        Boolean(item) && typeof item === 'object' && 'msg' in item
    )
    if (typeof firstMessage?.msg === 'string') {
      return { code: 'VALIDATION_ERROR', message: firstMessage.msg }
    }
  }

  return null
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  await waitForClerk()
  const token =
    typeof window !== 'undefined' ? await window.Clerk?.session?.getToken() : null
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      if (window.Clerk?.loaded) {
        await window.Clerk.signOut({ redirectUrl: '/login' })
      } else {
        window.location.href = '/login'
      }
    }
    throw new ApiError('Unauthorized', 'UNAUTHORIZED')
  }

  if (!response.ok) {
    let message = response.statusText || 'API request failed'
    let code = 'UNKNOWN'
    let requestId: string | undefined
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        const text = await response.text()
        const parsed = parseErrorPayload(JSON.parse(text))
        if (parsed) {
          message = parsed.message
          code = parsed.code
          requestId = parsed.requestId
        }
      } catch {
        // JSON parse failed, use default message
      }
    }
    throw new ApiError(message, code, requestId)
  }

  if (
    response.status === 204 ||
    response.headers.get('content-length') === '0' ||
    !response.headers.get('content-type')?.includes('application/json')
  ) {
    return null as T
  }

  return response.json()
}
