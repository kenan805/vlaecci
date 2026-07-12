import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { name, slug, isActive } = body

    const sets: string[] = []
    const values: unknown[] = []

    if (typeof name === 'string') {
      if (!name) return NextResponse.json({ error: 'Ad mütləqdir' }, { status: 400 })
      sets.push(`name = $${sets.length + 1}`)
      values.push(name)
    }
    if (typeof slug === 'string') {
      sets.push(`slug = $${sets.length + 1}`)
      values.push(slug)
    }
    if (typeof isActive === 'boolean') {
      sets.push(`is_active = $${sets.length + 1}`)
      values.push(isActive)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Yeniləmə üçün məlumat yoxdur' }, { status: 400 })
    }

    values.push(id)
    await query(`UPDATE categories SET ${sets.join(', ')} WHERE id = $${values.length}`, values)
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
