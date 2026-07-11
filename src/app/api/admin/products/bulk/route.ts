import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { ids, action } = body as { ids: string[]; action: 'active' | 'deactive' | 'delete' }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Məhsul seçilməyib' }, { status: 400 })
    }

    if (action === 'delete') {
      await query('DELETE FROM products WHERE id = ANY($1::text[])', [ids])
    } else if (action === 'active') {
      await query(
        `UPDATE products SET status = 'active', updated_at = NOW() WHERE id = ANY($1::text[])`,
        [ids]
      )
    } else if (action === 'deactive') {
      await query(
        `UPDATE products SET status = 'deactive', updated_at = NOW() WHERE id = ANY($1::text[])`,
        [ids]
      )
    } else {
      return NextResponse.json({ error: 'Naməlum əməliyyat' }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: ids.length })
  } catch (err) {
    console.error('Admin products bulk error:', err)
    return NextResponse.json({ error: 'Əməliyyat uğursuz' }, { status: 500 })
  }
}
