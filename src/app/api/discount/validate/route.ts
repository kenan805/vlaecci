import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json()
    if (!code) {
      return NextResponse.json({ valid: false })
    }

    const result = await query<{
      id: string
      percentage: number
      expires_at: string | null
      is_active: boolean
      max_uses: number | null
      usage_count: number
      limit_type: string
    }>(
      `SELECT id, percentage, expires_at, is_active, max_uses, usage_count, limit_type
       FROM discount_codes WHERE UPPER(code) = UPPER($1)`,
      [code.trim()]
    )

    const discount = result.rows[0]
    if (!discount || !discount.is_active) {
      return NextResponse.json({ valid: false })
    }

    const lt = discount.limit_type || 'none'

    if ((lt === 'date' || lt === 'both') && discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    if ((lt === 'count' || lt === 'both') && discount.max_uses != null && discount.usage_count >= discount.max_uses) {
      return NextResponse.json({ valid: false, reason: 'limit_reached' })
    }

    await query('UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = $1', [discount.id])

    return NextResponse.json({ valid: true, percentage: discount.percentage })
  } catch (err) {
    console.error('Discount validate error:', err)
    return NextResponse.json({ valid: false })
  }
}
