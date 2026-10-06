import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { clampRating } from '@/lib/home-content'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { name, handle, text, rating, sortOrder, isActive } = body

    const sets: string[] = []
    const values: unknown[] = []

    if (typeof name === 'string') {
      if (!name.trim()) return NextResponse.json({ error: 'Ad mütləqdir' }, { status: 400 })
      sets.push(`name = $${sets.length + 1}`)
      values.push(name.trim())
    }
    if (typeof handle === 'string') {
      sets.push(`handle = $${sets.length + 1}`)
      values.push(handle.trim())
    }
    if (typeof text === 'string') {
      if (!text.trim()) return NextResponse.json({ error: 'Rəy mətni mütləqdir' }, { status: 400 })
      sets.push(`text = $${sets.length + 1}`)
      values.push(text.trim())
    }
    if (rating !== undefined) {
      sets.push(`rating = $${sets.length + 1}`)
      values.push(clampRating(rating))
    }
    if (sortOrder !== undefined && Number.isFinite(Number(sortOrder))) {
      sets.push(`sort_order = $${sets.length + 1}`)
      values.push(Math.round(Number(sortOrder)))
    }
    if (typeof isActive === 'boolean') {
      sets.push(`is_active = $${sets.length + 1}`)
      values.push(isActive)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'Yeniləmə üçün məlumat yoxdur' }, { status: 400 })
    }

    values.push(id)
    await query(`UPDATE testimonials SET ${sets.join(', ')} WHERE id = $${values.length}`, values)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin testimonials PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM testimonials WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin testimonials DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
