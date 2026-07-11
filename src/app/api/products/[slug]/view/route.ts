import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

function getCountry(req: NextRequest): string | null {
  return req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null
}

/** Public: track a product page view by slug */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const ip = getClientIp(req)
    const country = getCountry(req)

    const exists = await query<{ id: string }>(
      `SELECT id FROM products WHERE slug = $1 AND COALESCE(status, 'active') = 'active'`,
      [slug]
    )
    const productId = exists.rows[0]?.id
    if (!productId) {
      return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })
    }

    await query(
      'INSERT INTO product_view_events (id, product_id, ip_address, country) VALUES ($1, $2, $3, $4)',
      [randomUUID(), productId, ip, country]
    )

    await query('UPDATE products SET total_views = COALESCE(total_views, 0) + 1 WHERE id = $1', [productId])

    const uniqueToday = await query(
      `SELECT id FROM product_view_events
       WHERE product_id = $1 AND ip_address = $2
         AND (viewed_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date
       LIMIT 2`,
      [productId, ip]
    )

    if (uniqueToday.rows.length === 1) {
      await query('UPDATE products SET unique_views = COALESCE(unique_views, 0) + 1 WHERE id = $1', [productId])
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Track view error:', err)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
