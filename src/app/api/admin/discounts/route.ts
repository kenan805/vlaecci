import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

type LimitType = 'none' | 'date' | 'count' | 'both'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{
      id: string
      code: string
      percentage: number
      expires_at: string | null
      is_active: boolean
      max_uses: number | null
      usage_count: number | null
      limit_type: string | null
    }>(
      `SELECT id, code, percentage, expires_at, is_active,
              max_uses, COALESCE(usage_count, 0) AS usage_count,
              COALESCE(limit_type, 'none') AS limit_type
       FROM discount_codes ORDER BY created_at DESC`
    )

    const codes = result.rows.map((r) => ({
      id: r.id,
      code: r.code,
      percentage: r.percentage,
      expiresAt: r.expires_at,
      isActive: r.is_active,
      maxUses: r.max_uses,
      usageCount: r.usage_count ?? 0,
      limitType: (r.limit_type || 'none') as LimitType,
    }))

    return NextResponse.json({ codes })
  } catch (err) {
    console.error('Admin discounts error:', err)
    return NextResponse.json({ codes: [], error: 'Endirim kodları yüklənə bilmədi' })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { code, percentage, limitType, expiresAt, maxUses } = body as {
      code: string
      percentage: number
      limitType?: LimitType
      expiresAt?: string | null
      maxUses?: number | null
    }

    if (!code || percentage == null || Number.isNaN(Number(percentage))) {
      return NextResponse.json({ error: 'Kod və faiz tələb olunur' }, { status: 400 })
    }

    const lt: LimitType = limitType || 'none'
    let expires: string | null = null
    let max: number | null = null
    if (lt === 'date' || lt === 'both') {
      if (!expiresAt) return NextResponse.json({ error: 'Bitmə tarixi seçin' }, { status: 400 })
      expires = expiresAt
    }
    if (lt === 'count' || lt === 'both') {
      if (!maxUses || maxUses < 1) return NextResponse.json({ error: 'İstifadə sayı limiti daxil edin' }, { status: 400 })
      max = Number(maxUses)
    }

    const id = randomUUID()
    await query(
      `INSERT INTO discount_codes (id, code, percentage, is_active, limit_type, expires_at, max_uses, usage_count)
       VALUES ($1, $2, $3, true, $4, $5, $6, 0)`,
      [id, code.toUpperCase().trim(), Number(percentage), lt, expires, max]
    )

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('Admin discounts POST error:', err)
    const msg = err instanceof Error && err.message.includes('unique') ? 'Bu kod artıq mövcuddur' : 'Kod yaradıla bilmədi'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
