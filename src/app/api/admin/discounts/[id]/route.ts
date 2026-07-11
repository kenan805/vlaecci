import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

type LimitType = 'none' | 'date' | 'count' | 'both'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await query<{
      code: string
      percentage: number
      is_active: boolean
      limit_type: string | null
      expires_at: string | null
      max_uses: number | null
    }>(
      `SELECT code, percentage, is_active,
              COALESCE(limit_type, 'none') AS limit_type, expires_at, max_uses
       FROM discount_codes WHERE id = $1`,
      [id]
    )

    const row = existing.rows[0]
    if (!row) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })

    const code = body.code != null ? String(body.code).toUpperCase().trim() : row.code
    const percentage = body.percentage != null ? Number(body.percentage) : row.percentage
    const isActive = body.isActive != null ? Boolean(body.isActive) : row.is_active
    const lt: LimitType = body.limitType != null ? body.limitType : (row.limit_type as LimitType) || 'none'

    let expires: string | null = row.expires_at
    let max: number | null = row.max_uses

    if (body.limitType != null) {
      expires = null
      max = null
      if (lt === 'date' || lt === 'both') {
        if (!body.expiresAt) return NextResponse.json({ error: 'Bitmə tarixi seçin' }, { status: 400 })
        expires = body.expiresAt
      }
      if (lt === 'count' || lt === 'both') {
        if (!body.maxUses || Number(body.maxUses) < 1) {
          return NextResponse.json({ error: 'İstifadə sayı limiti daxil edin' }, { status: 400 })
        }
        max = Number(body.maxUses)
      }
    }

    if (Number.isNaN(percentage)) {
      return NextResponse.json({ error: 'Faiz düzgün deyil' }, { status: 400 })
    }

    await query(
      `UPDATE discount_codes SET code = $1, percentage = $2, is_active = $3,
       limit_type = $4, expires_at = $5, max_uses = $6 WHERE id = $7`,
      [code, percentage, isActive, lt, expires, max, id]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin discount PUT error:', err)
    const msg = err instanceof Error && err.message.includes('unique') ? 'Bu kod artıq mövcuddur' : 'Yeniləmə uğursuz'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM discount_codes WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin discount DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
