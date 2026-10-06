import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { isAllowedImage } from '@/lib/home-content'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const { beforeImage, afterImage, title, description, sortOrder, isActive } = body

    const sets: string[] = []
    const values: unknown[] = []

    if (beforeImage !== undefined) {
      if (!isAllowedImage(beforeImage)) {
        return NextResponse.json({ error: 'Əvvəl şəkli düzgün deyil' }, { status: 400 })
      }
      sets.push(`before_image = $${sets.length + 1}`)
      values.push(beforeImage.trim())
    }
    if (afterImage !== undefined) {
      if (!isAllowedImage(afterImage)) {
        return NextResponse.json({ error: 'Sonra şəkli düzgün deyil' }, { status: 400 })
      }
      sets.push(`after_image = $${sets.length + 1}`)
      values.push(afterImage.trim())
    }
    if (typeof title === 'string') {
      sets.push(`title = $${sets.length + 1}`)
      values.push(title.trim())
    }
    if (typeof description === 'string') {
      sets.push(`description = $${sets.length + 1}`)
      values.push(description.trim())
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
    await query(`UPDATE before_after_results SET ${sets.join(', ')} WHERE id = $${values.length}`, values)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin results PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await query('DELETE FROM before_after_results WHERE id = $1', [id])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin results DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
