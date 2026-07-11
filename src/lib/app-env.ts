export type RuntimeEnv = 'production' | 'preview' | 'development' | 'local'

export function getRuntimeEnv(): RuntimeEnv {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === 'production') return 'production'
  if (vercelEnv === 'preview') return 'preview'
  if (vercelEnv === 'development') return 'development'
  return 'local'
}

export function getDatabaseEnvLabel(): string {
  const env = getRuntimeEnv()
  const labels: Record<RuntimeEnv, string> = {
    production: 'production (vlaecci.com)',
    preview: 'preview / dev (Vercel)',
    development: 'development (Vercel CLI)',
    local: 'local (kompüter)',
  }
  return labels[env]
}
