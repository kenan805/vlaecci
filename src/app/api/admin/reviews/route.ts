import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { isReviewStatus, mapReviewRow, REVIEW_COLUMNS, type ReviewRow } from '@/lib/reviews'

export const dynamic = 'force-dynamic'

/** All product reviews (optionally filtered by ?status=) with per-status counts. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const status = req.nextUrl.searchParams.get('status')
    const filter = isReviewStatus(status) ? status : null

    const [list, counts] = await Promise.all([
      query<ReviewRow & { product_name: string | null; product_slug: string | null }>(
        `SELECT ${REVIEW_COLUMNS}, p.name AS product_name, p.slug AS product_slug
         FROM product_reviews r
         LEFT JOIN products p ON p.id = r.product_id
         ${filter ? 'WHERE r.status = $1' : ''}
         ORDER BY r.created_at DESC
         LIMIT 500`,
        filter ? [filter] : []
      ),
      query<{ status: string; count: number }>(
        `SELECT status, COUNT(*)::int AS count FROM product_reviews GROUP BY status`
      ),
    ])

    const reviews = list.rows.map((r) => ({
      ...mapReviewRow(r),
      product: { name: r.product_name || '—', slug: r.product_slug || '' },
    }))
    const byStatus = { pending: 0, approved: 0, rejected: 0 }
    for (const c of counts.rows) {
      if (isReviewStatus(c.status)) byStatus[c.status] = c.count
    }

    return NextResponse.json({ reviews, counts: byStatus })
  } catch (err) {
    console.error('Admin reviews list error:', err)
    return NextResponse.json({ reviews: [], counts: { pending: 0, approved: 0, rejected: 0 } })
  }
}
