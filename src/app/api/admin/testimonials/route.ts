import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { clampRating, listTestimonials } from '@/lib/home-content'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const testimonials = await listTestimonials(false)
    return NextResponse.json({ testimonials })
  } catch (err) {
    console.error('Admin testimonials error:', err)
    return NextResponse.json({ testimonials: [] })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, handle, text, rating, sortOrder, isActive } = body
    const cleanName = typeof name === 'string' ? name.trim() : ''
    const cleanText = typeof text === 'string' ? text.trim() : ''

    if (!cleanName || !cleanText) {
      return NextResponse.json({ error: 'Ad və rəy mətni mütləqdir' }, { status: 400 })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO testimonials (id, name, handle, text, rating, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        cleanName,
        typeof handle === 'string' ? handle.trim() : '',
        cleanText,
        clampRating(rating),
        Number.isFinite(Number(sortOrder)) ? Math.round(Number(sortOrder)) : 0,
        typeof isActive === 'boolean' ? isActive : true,
      ]
    )
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('Admin testimonials POST error:', err)
    return NextResponse.json({ error: 'Rəy əlavə edilə bilmədi' }, { status: 500 })
  }
}
