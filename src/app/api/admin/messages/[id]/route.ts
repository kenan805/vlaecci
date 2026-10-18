import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM contact_messages WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin messages DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
