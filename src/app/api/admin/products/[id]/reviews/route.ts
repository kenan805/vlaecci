import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { mapReviewRow, recalcProductRating, REVIEW_COLUMNS, type ReviewRow } from '@/lib/reviews'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: productId } = await params
    const result = await query<ReviewRow>(
      `SELECT ${REVIEW_COLUMNS}
       FROM product_reviews r WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
      [productId]
    )

    const reviews = result.rows.map((r) => {
      const review = mapReviewRow(r)
      return { ...review, isActive: review.status === 'approved' }
    })

    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Admin reviews GET error:', err)
    return NextResponse.json({ reviews: [] })
  }
}

/** Admin-added reviews are published immediately. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: productId } = await params
    const body = await req.json()
    const { authorName, hairType, comment } = body
    const rating = Number(body.rating ?? 5)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Reytinq 1-5 arası olmalıdır' }, { status: 400 })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO product_reviews (id, product_id, author_name, hair_type, rating, comment, status, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 'approved', true)`,
      [
        id,
        productId,
        typeof authorName === 'string' && authorName.trim() ? authorName.trim() : null,
        typeof hairType === 'string' && hairType ? hairType : null,
        rating,
        typeof comment === 'string' && comment.trim() ? comment.trim() : null,
      ]
    )
    await recalcProductRating(productId)

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('Admin reviews POST error:', err)
    return NextResponse.json({ error: 'Rəy əlavə edilə bilmədi' }, { status: 500 })
  }
}
