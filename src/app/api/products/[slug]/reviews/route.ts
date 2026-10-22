import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { toRating, type ProductReview } from '@/lib/products'
import {
  checkReviewRateLimit,
  hashIp,
  parseReviewInput,
  recalcProductRating,
  storeReviewImages,
  validateReviewImages,
} from '@/lib/reviews'

export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

/**
 * Public: submit a review (multipart form). Star-only reviews are approved immediately;
 * reviews with text or photos wait for admin approval.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    let form: FormData
    try {
      form = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Form düzgün göndərilməyib' }, { status: 400 })
    }

    // Honeypot: real visitors never see or fill this field. Pretend success so bots don't adapt.
    const honeypot = form.get('website')
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return NextResponse.json({ status: 'pending' }, { status: 201 })
    }

    const parsed = parseReviewInput({
      rating: form.get('rating'),
      comment: form.get('comment'),
      authorName: form.get('authorName'),
    })
    if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { rating, comment, authorName } = parsed.input

    const product = await query<{ id: string }>(
      `SELECT id FROM products WHERE slug = $1 AND COALESCE(status, 'active') = 'active'`,
      [slug]
    )
    const productId = product.rows[0]?.id
    if (!productId) return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })

    const ipHash = hashIp(getClientIp(req))
    const limited = await checkReviewRateLimit(ipHash, productId)
    if (limited) return NextResponse.json({ error: limited }, { status: 429 })

    const files = form.getAll('images').filter((f): f is File => typeof f !== 'string')
    const validated = await validateReviewImages(files)
    if ('error' in validated) return NextResponse.json({ error: validated.error }, { status: 400 })

    const images = await storeReviewImages(validated.images)
    const status = comment || images.length > 0 ? 'pending' : 'approved'

    const id = randomUUID()
    const created = await query<{ created_at: string }>(
      `INSERT INTO product_reviews
         (id, product_id, author_name, hair_type, rating, comment, images, status, is_active, ip_hash)
       VALUES ($1, $2, $3, NULL, $4, $5, $6, $7, $8, $9)
       RETURNING created_at`,
      [
        id,
        productId,
        authorName || null,
        rating,
        comment || null,
        JSON.stringify(images),
        status,
        status === 'approved',
        ipHash,
      ]
    )

    if (status !== 'approved') return NextResponse.json({ status }, { status: 201 })

    // Star-only review is live right away: return it with the new summary so the page can update in place.
    await recalcProductRating(productId)
    const summary = await query<{ rating_avg: string | null; rating_count: number | null }>(
      'SELECT rating_avg, rating_count FROM products WHERE id = $1',
      [productId]
    )
    const review: ProductReview = {
      id,
      authorName,
      hairType: '',
      hairTypeLabel: '',
      rating,
      comment: '',
      images: [],
      createdAt: created.rows[0].created_at,
    }
    return NextResponse.json(
      {
        status,
        review,
        rating: toRating(summary.rows[0]?.rating_avg ?? null, summary.rows[0]?.rating_count ?? null),
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Review submit error:', err)
    return NextResponse.json({ error: 'Rəy göndərilə bilmədi. Zəhmət olmasa yenidən cəhd edin.' }, { status: 500 })
  }
}
