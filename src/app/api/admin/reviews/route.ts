import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { isReviewStatus, mapReviewRow, REVIEW_COLUMNS, REVIEW_FROM, type ReviewRow } from '@/lib/reviews'

export const dynamic = 'force-dynamic'

const PAGE_SIZES = [10, 20, 50]

/**
 * One page of product reviews, newest first. Query params: status, q (name / text / product),
 * page (1-based), pageSize (10 | 20 | 50). Also returns per-status counts for the filter tabs.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const params = req.nextUrl.searchParams
    const status = params.get('status')
    const search = (params.get('q') || '').trim().slice(0, 100)
    const requestedSize = Number(params.get('pageSize'))
    const pageSize = PAGE_SIZES.includes(requestedSize) ? requestedSize : PAGE_SIZES[0]
    const page = Math.max(1, Math.floor(Number(params.get('page')) || 1))

    const where: string[] = []
    const values: unknown[] = []
    if (isReviewStatus(status)) {
      values.push(status)
      where.push(`r.status = $${values.length}`)
    }
    if (search) {
      values.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`)
      const p = `$${values.length}`
      where.push(
        `(COALESCE(NULLIF(r.author_name, ''), 'Anonim') ILIKE ${p} OR r.comment ILIKE ${p} OR p.name ILIKE ${p})`
      )
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const [list, totalResult, counts] = await Promise.all([
      query<ReviewRow & { product_name: string | null; product_slug: string | null }>(
        `SELECT ${REVIEW_COLUMNS}, p.name AS product_name, p.slug AS product_slug
         FROM ${REVIEW_FROM}
         LEFT JOIN products p ON p.id = r.product_id
         ${whereSql}
         ORDER BY r.created_at DESC, r.id
         LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
        values
      ),
      query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM product_reviews r
         LEFT JOIN products p ON p.id = r.product_id
         ${whereSql}`,
        values
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

    return NextResponse.json({
      reviews,
      total: totalResult.rows[0]?.total ?? 0,
      page,
      pageSize,
      counts: byStatus,
    })
  } catch (err) {
    console.error('Admin reviews list error:', err)
    return NextResponse.json({
      reviews: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZES[0],
      counts: { pending: 0, approved: 0, rejected: 0 },
    })
  }
}
