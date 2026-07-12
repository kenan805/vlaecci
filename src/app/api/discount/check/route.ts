import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

/** Validate a discount code WITHOUT consuming a use (cart preview). */
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false })
    }

    const result = await query<{
      percentage: number
      expires_at: string | null
      is_active: boolean
      max_uses: number | null
      usage_count: number
      limit_type: string
    }>(
      `SELECT percentage, expires_at, is_active, max_uses, usage_count, limit_type
       FROM discount_codes WHERE UPPER(code) = UPPER($1)`,
      [code.trim()]
    )

    const d = result.rows[0]
    if (!d || !d.is_active) return NextResponse.json({ valid: false })

    const lt = d.limit_type || 'none'
    if ((lt === 'date' || lt === 'both') && d.expires_at && new Date(d.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }
    if ((lt === 'count' || lt === 'both') && d.max_uses != null && d.usage_count >= d.max_uses) {
      return NextResponse.json({ valid: false, reason: 'limit_reached' })
    }

    return NextResponse.json({ valid: true, percentage: d.percentage })
  } catch (err) {
    console.error('Discount check error:', err)
    return NextResponse.json({ valid: false })
  }
}
