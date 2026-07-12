import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    if (typeof body?.status !== 'string' || !STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Status düzgün deyil' }, { status: 400 })
    }
    await query('UPDATE orders SET status = $1 WHERE id = $2', [body.status, id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin order PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM orders WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin order DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
