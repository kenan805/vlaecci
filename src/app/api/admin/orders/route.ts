import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

interface OrderItemRow {
  name: string
  price: number
  qty: number
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{
      id: string
      customer_name: string
      phone: string
      address: string | null
      note: string | null
      subtotal: string
      discount_code: string | null
      discount_amount: string | null
      total: string
      status: string
      created_at: string
      items: OrderItemRow[]
    }>(
      `SELECT o.id, o.customer_name, o.phone, o.address, o.note,
              o.subtotal, o.discount_code, o.discount_amount, o.total, o.status, o.created_at,
              COALESCE(
                json_agg(
                  json_build_object('name', oi.product_name, 'price', oi.price, 'qty', oi.qty)
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    )

    const orders = result.rows.map((o) => ({
      id: o.id,
      customerName: o.customer_name,
      phone: o.phone,
      address: o.address,
      note: o.note,
      subtotal: Number(o.subtotal),
      discountCode: o.discount_code,
      discountAmount: Number(o.discount_amount) || 0,
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at,
      items: (o.items || []).map((i) => ({ name: i.name, price: Number(i.price), qty: i.qty })),
    }))

    return NextResponse.json({ orders })
  } catch (err) {
    console.error('Admin orders GET error:', err)
    return NextResponse.json({ orders: [] })
  }
}
