import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{
      id: string
      hair_loss_level: string
      hair_type: string
      scalp_condition: string
      email: string | null
      created_at: string
    }>(
      'SELECT id, hair_loss_level, hair_type, scalp_condition, email, created_at FROM quiz_responses ORDER BY created_at DESC'
    )

    const responses = result.rows.map((r) => ({
      id: r.id,
      hairLossLevel: r.hair_loss_level,
      hairType: r.hair_type,
      scalpCondition: r.scalp_condition,
      email: r.email,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ responses })
  } catch (err) {
    console.error('Admin quiz responses error:', err)
    return NextResponse.json({ responses: [] })
  }
}
