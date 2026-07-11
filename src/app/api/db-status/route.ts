import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getRuntimeEnv } from '@/lib/app-env'

export const dynamic = 'force-dynamic'

function resolveConnectionString(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  )
}

function getDbHost(connectionString: string): string {
  if (!connectionString) return 'not-set'
  try {
    const url = new URL(connectionString.replace(/^postgresql:/, 'postgres:'))
    return url.hostname
  } catch {
    return 'parse-error'
  }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-setup-secret')
  const expected = process.env.SETUP_SECRET || process.env.JWT_SECRET

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connectionString = resolveConnectionString()
  const productCount = await query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM products'
  )
  const recentProducts = await query<{ name: string }>(
    'SELECT name FROM products ORDER BY created_at DESC LIMIT 5'
  )

  return NextResponse.json({
    vercelEnv: getRuntimeEnv(),
    vercelUrl: process.env.VERCEL_URL || null,
    dbHost: getDbHost(connectionString),
    neonProjectId: process.env.NEON_PROJECT_ID || null,
    productCount: Number(productCount.rows[0]?.count || 0),
    recentProducts: recentProducts.rows.map((row) => row.name),
  })
}
