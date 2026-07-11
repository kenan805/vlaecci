import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params

    const stats = await query<{ total_views: number; unique_views: number }>(
      'SELECT COALESCE(total_views, 0) AS total_views, COALESCE(unique_views, 0) AS unique_views FROM products WHERE id = $1',
      [id]
    )

    const rows = await query<{
      ip_address: string
      country: string | null
      last_viewed: string
      view_count: string
    }>(
      `SELECT ip_address, country,
              MAX(viewed_at) AS last_viewed,
              COUNT(*)::text AS view_count
       FROM product_view_events
       WHERE product_id = $1
       GROUP BY ip_address, country
       ORDER BY MAX(viewed_at) DESC
       LIMIT 200`,
      [id]
    )

    return NextResponse.json({
      totalViews: stats.rows[0]?.total_views ?? 0,
      uniqueViews: stats.rows[0]?.unique_views ?? 0,
      visitors: rows.rows.map((r) => ({
        ip: r.ip_address,
        country: r.country || 'Naməlum',
        lastViewed: r.last_viewed,
        viewCount: Number(r.view_count),
      })),
    })
  } catch (err) {
    console.error('Admin views GET error:', err)
    return NextResponse.json({ totalViews: 0, uniqueViews: 0, visitors: [] })
  }
}
