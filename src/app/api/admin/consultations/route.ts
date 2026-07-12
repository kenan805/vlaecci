import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{
      id: string
      name: string
      phone: string
      hair_issue: string
      notes: string | null
      status: string
      created_at: string
    }>('SELECT id, name, phone, hair_issue, notes, status, created_at FROM consultations ORDER BY created_at DESC')

    const requests = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      hairIssue: r.hair_issue,
      notes: r.notes,
      status: r.status,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ requests })
  } catch (err) {
    console.error('Admin consultations error:', err)
    return NextResponse.json({ requests: [] })
  }
}
