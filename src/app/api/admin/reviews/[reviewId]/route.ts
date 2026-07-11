import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reviewId } = await params
    const body = await req.json()
    const { authorName, hairType, rating, comment, isActive } = body

    await query(
      `UPDATE product_reviews SET author_name = $1, hair_type = $2, rating = $3, comment = $4, is_active = $5
       WHERE id = $6`,
      [authorName, hairType, rating, comment, isActive ?? true, reviewId]
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin review PUT error:', err)
    return NextResponse.json({ error: 'Yeniləmə uğursuz' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reviewId } = await params
    await query('DELETE FROM product_reviews WHERE id = $1', [reviewId])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin review DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
