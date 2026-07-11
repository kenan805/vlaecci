function getClientApiBaseUrl() {
  const configured = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')
  if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/i.test(configured)) {
    return '/api'
  }
  return configured
}

function getServerApiBaseUrl() {
  if (process.env.API_URL_INTERNAL) {
    return process.env.API_URL_INTERNAL.replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`
  }
  const port = process.env.PORT || '3000'
  return `http://localhost:${port}/api`
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getClientApiBaseUrl()}${normalizedPath}`
}

export function buildServerApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getServerApiBaseUrl()}${normalizedPath}`
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(buildApiUrl(path), {
    ...init,
    credentials: init?.credentials ?? 'include',
  })
}

export function serverApiFetch(path: string, init?: RequestInit) {
  return fetch(buildServerApiUrl(path), {
    ...init,
    cache: init?.cache ?? 'no-store',
  })
}
