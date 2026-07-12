import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

type ProductStatus = 'active' | 'draft' | 'deactive'

interface StatsTotals {
  products: number
  activeProducts: number
  totalViews: number
  uniqueViews: number
  reviews: number
  consultations: number
  pendingConsultations: number
  quizResponses: number
  analysisSessions: number
  contactMessages: number
  discountCodes: number
  discountUsage: number
}

interface StatusSlice {
  status: ProductStatus
  count: number
}

interface TopProduct {
  name: string
  views: number
  uniqueViews: number
}

interface DayPoint {
  day: string
  count: number
}

interface CountrySlice {
  country: string
  count: number
}

interface RecentConsultation {
  name: string
  status: string
  createdAt: string
}

interface StatsResponse {
  totals: StatsTotals
  statusDistribution: StatusSlice[]
  topProducts: TopProduct[]
  viewsByDay: DayPoint[]
  topCountries: CountrySlice[]
  recentConsultations: RecentConsultation[]
}

const EMPTY_STATS: StatsResponse = {
  totals: {
    products: 0,
    activeProducts: 0,
    totalViews: 0,
    uniqueViews: 0,
    reviews: 0,
    consultations: 0,
    pendingConsultations: 0,
    quizResponses: 0,
    analysisSessions: 0,
    contactMessages: 0,
    discountCodes: 0,
    discountUsage: 0,
  },
  statusDistribution: [
    { status: 'active', count: 0 },
    { status: 'draft', count: 0 },
    { status: 'deactive', count: 0 },
  ],
  topProducts: [],
  viewsByDay: [],
  topCountries: [],
  recentConsultations: [],
}

/** Build the last 14 calendar days (UTC) as 'YYYY-MM-DD' keys, oldest first. */
function buildDayWindow(): string[] {
  const keys: string[] = []
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [
      productsAgg,
      statusAgg,
      reviewsAgg,
      consultationsAgg,
      quizAgg,
      analysisAgg,
      contactAgg,
      discountAgg,
      topProductsRows,
      viewsRows,
      countriesRows,
      recentRows,
    ] = await Promise.all([
      query<{
        products: number
        active_products: number
        total_views: number
        unique_views: number
      }>(
        `SELECT
           COUNT(*)::int AS products,
           COUNT(*) FILTER (WHERE COALESCE(status, 'active') = 'active')::int AS active_products,
           COALESCE(SUM(total_views), 0)::int AS total_views,
           COALESCE(SUM(unique_views), 0)::int AS unique_views
         FROM products`
      ),
      query<{ status: string; count: number }>(
        `SELECT COALESCE(status, 'active') AS status, COUNT(*)::int AS count
         FROM products
         GROUP BY COALESCE(status, 'active')`
      ),
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM product_reviews`),
      query<{ total: number; pending: number }>(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE COALESCE(status, 'pending') = 'pending')::int AS pending
         FROM consultations`
      ),
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM quiz_responses`),
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM analysis_sessions`),
      query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM contact_messages`),
      query<{ count: number; usage: number }>(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(usage_count), 0)::int AS usage
         FROM discount_codes`
      ),
      query<{ name: string; views: number; unique_views: number }>(
        `SELECT name,
                COALESCE(total_views, 0)::int AS views,
                COALESCE(unique_views, 0)::int AS unique_views
         FROM products
         ORDER BY COALESCE(total_views, 0) DESC, name ASC
         LIMIT 6`
      ),
      query<{ day: string; count: number }>(
        `SELECT to_char(viewed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
                COUNT(*)::int AS count
         FROM product_view_events
         WHERE viewed_at >= NOW() - INTERVAL '14 days'
         GROUP BY 1
         ORDER BY 1`
      ),
      query<{ country: string; count: number }>(
        `SELECT country, COUNT(*)::int AS count
         FROM product_view_events
         WHERE country IS NOT NULL AND btrim(country) <> ''
         GROUP BY country
         ORDER BY count DESC
         LIMIT 5`
      ),
      query<{ name: string; status: string; created_at: string }>(
        `SELECT name, COALESCE(status, 'pending') AS status, created_at
         FROM consultations
         ORDER BY created_at DESC
         LIMIT 5`
      ),
    ])

    const p = productsAgg.rows[0]
    const c = consultationsAgg.rows[0]
    const d = discountAgg.rows[0]

    const totals: StatsTotals = {
      products: Number(p?.products ?? 0),
      activeProducts: Number(p?.active_products ?? 0),
      totalViews: Number(p?.total_views ?? 0),
      uniqueViews: Number(p?.unique_views ?? 0),
      reviews: Number(reviewsAgg.rows[0]?.count ?? 0),
      consultations: Number(c?.total ?? 0),
      pendingConsultations: Number(c?.pending ?? 0),
      quizResponses: Number(quizAgg.rows[0]?.count ?? 0),
      analysisSessions: Number(analysisAgg.rows[0]?.count ?? 0),
      contactMessages: Number(contactAgg.rows[0]?.count ?? 0),
      discountCodes: Number(d?.count ?? 0),
      discountUsage: Number(d?.usage ?? 0),
    }

    const statusCounts = new Map<string, number>()
    for (const row of statusAgg.rows) statusCounts.set(row.status, Number(row.count))
    const statusDistribution: StatusSlice[] = (['active', 'draft', 'deactive'] as ProductStatus[]).map(
      (status) => ({ status, count: statusCounts.get(status) ?? 0 })
    )

    const topProducts: TopProduct[] = topProductsRows.rows.map((row) => ({
      name: row.name,
      views: Number(row.views),
      uniqueViews: Number(row.unique_views),
    }))

    const viewsMap = new Map<string, number>()
    for (const row of viewsRows.rows) viewsMap.set(row.day, Number(row.count))
    const viewsByDay: DayPoint[] = buildDayWindow().map((day) => ({
      day,
      count: viewsMap.get(day) ?? 0,
    }))

    const topCountries: CountrySlice[] = countriesRows.rows.map((row) => ({
      country: row.country,
      count: Number(row.count),
    }))

    const recentConsultations: RecentConsultation[] = recentRows.rows.map((row) => ({
      name: row.name,
      status: row.status,
      createdAt: row.created_at,
    }))

    const payload: StatsResponse = {
      totals,
      statusDistribution,
      topProducts,
      viewsByDay,
      topCountries,
      recentConsultations,
    }

    return NextResponse.json(payload)
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json(EMPTY_STATS)
  }
}
