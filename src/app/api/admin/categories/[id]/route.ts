import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug } = body
    if (!name) return NextResponse.json({ error: 'Ad mütləqdir' }, { status: 400 })

    await query('UPDATE categories SET name = $1, slug = $2 WHERE id = $3', [name, slug, id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin categories PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const used = await query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id])
    if (used.rows.length > 0) {
      return NextResponse.json({ error: 'Bu kateqoriyada məhsul var, silinə bilməz' }, { status: 400 })
    }
    await query('DELETE FROM categories WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin categories DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
