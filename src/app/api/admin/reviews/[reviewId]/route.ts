import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { deleteReviewImages, isReviewStatus, recalcProductRating, type ReviewStatus } from '@/lib/reviews'
import { sanitizeImageUrls } from '@/lib/parse-image-urls'

async function updateStatus(reviewId: string, status: ReviewStatus) {
  const result = await query<{ product_id: string }>(
    `UPDATE product_reviews SET status = $1, is_active = $2 WHERE id = $3 RETURNING product_id`,
    [status, status === 'approved', reviewId]
  )
  return result.rows[0]?.product_id ?? null
}

/** Approve / reject a review. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reviewId } = await params
    const { status } = await req.json()
    if (!isReviewStatus(status)) {
      return NextResponse.json({ error: 'Status düzgün deyil' }, { status: 400 })
    }
    const productId = await updateStatus(reviewId, status)
    if (!productId) return NextResponse.json({ error: 'Rəy tapılmadı' }, { status: 404 })
    await recalcProductRating(productId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin review PATCH error:', err)
    return NextResponse.json({ error: 'Status dəyişmədi' }, { status: 500 })
  }
}

/** Edit a review from the product reviews modal. `isActive` (optional) maps to approved / rejected. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { reviewId } = await params
    const body = await req.json()
    const { authorName, hairType, comment, isActive } = body
    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Reytinq 1-5 arası olmalıdır' }, { status: 400 })
    }
    const status: ReviewStatus | null =
      typeof isActive === 'boolean' ? (isActive ? 'approved' : 'rejected') : null

    const result = await query<{ product_id: string }>(
      `UPDATE product_reviews SET author_name = $1, hair_type = $2, rating = $3, comment = $4,
         status = COALESCE($5, status), is_active = COALESCE($5, status) = 'approved'
       WHERE id = $6 RETURNING product_id`,
      [
        typeof authorName === 'string' && authorName.trim() ? authorName.trim() : null,
        typeof hairType === 'string' && hairType ? hairType : null,
        rating,
        typeof comment === 'string' && comment.trim() ? comment.trim() : null,
        status,
        reviewId,
      ]
    )
    const productId = result.rows[0]?.product_id
    if (!productId) return NextResponse.json({ error: 'Rəy tapılmadı' }, { status: 404 })
    await recalcProductRating(productId)

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
    const result = await query<{ product_id: string; images: unknown }>(
      'DELETE FROM product_reviews WHERE id = $1 RETURNING product_id, images',
      [reviewId]
    )
    const row = result.rows[0]
    if (row) {
      await recalcProductRating(row.product_id)
      await deleteReviewImages(sanitizeImageUrls(row.images))
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin review DELETE error:', err)
    return NextResponse.json({ error: 'Silinmə uğursuz' }, { status: 500 })
  }
}
