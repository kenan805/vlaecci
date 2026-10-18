import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { formatAzPhone, isValidAzPhone } from '@/lib/phone'

interface IncomingItem {
  productId: string
  qty: number
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = typeof body?.customer?.name === 'string' ? body.customer.name.trim() : ''
    const rawPhone = typeof body?.customer?.phone === 'string' ? body.customer.phone.trim() : ''
    const phone = rawPhone ? formatAzPhone(rawPhone) : ''
    const address = typeof body?.customer?.address === 'string' ? body.customer.address.trim() : ''
    const note = typeof body?.customer?.note === 'string' ? body.customer.note.trim() : ''
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    const rawItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : []

    if (!name || !phone) {
      return NextResponse.json({ error: 'Ad və telefon mütləqdir' }, { status: 400 })
    }
    if (!isValidAzPhone(phone)) {
      return NextResponse.json({ error: 'Telefon nömrəsi düzgün deyil' }, { status: 400 })
    }

    // Aggregate requested quantities per product
    const qtyByProduct = new Map<string, number>()
    for (const it of rawItems) {
      if (!it || typeof it.productId !== 'string') continue
      const qty = Math.max(1, Math.floor(Number(it.qty) || 1))
      qtyByProduct.set(it.productId, (qtyByProduct.get(it.productId) || 0) + qty)
    }
    if (qtyByProduct.size === 0) {
      return NextResponse.json({ error: 'Səbət boşdur' }, { status: 400 })
    }

    // Authoritative prices from the DB (only active products in active categories)
    const ids = Array.from(qtyByProduct.keys())
    const productsResult = await query<{ id: string; name: string; price: string }>(
      `SELECT p.id, p.name, p.price
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ANY($1::text[])
         AND COALESCE(p.status, 'active') = 'active'
         AND COALESCE(c.is_active, true) = true`,
      [ids]
    )

    const lineItems = productsResult.rows.map((p) => {
      const qty = qtyByProduct.get(p.id) || 1
      const price = Number(p.price)
      return { productId: p.id, name: p.name, price, qty, lineTotal: round(price * qty) }
    })

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'Məhsullar mövcud deyil' }, { status: 400 })
    }

    const subtotal = round(lineItems.reduce((s, i) => s + i.lineTotal, 0))

    // Discount (validate here; increment usage only after order is created)
    let discountPercentage = 0
    let discountAmount = 0
    let appliedCode: string | null = null
    let discountId: string | null = null
    if (code) {
      const dRes = await query<{
        id: string
        percentage: number
        expires_at: string | null
        is_active: boolean
        max_uses: number | null
        usage_count: number
        limit_type: string
      }>(
        `SELECT id, percentage, expires_at, is_active, max_uses, usage_count, limit_type
         FROM discount_codes WHERE UPPER(code) = UPPER($1)`,
        [code]
      )
      const d = dRes.rows[0]
      const lt = d?.limit_type || 'none'
      const expired = (lt === 'date' || lt === 'both') && d?.expires_at ? new Date(d.expires_at) < new Date() : false
      const limitReached =
        (lt === 'count' || lt === 'both') && d?.max_uses != null ? d.usage_count >= d.max_uses : false
      if (d && d.is_active && !expired && !limitReached) {
        discountPercentage = d.percentage
        discountAmount = round((subtotal * d.percentage) / 100)
        appliedCode = code.toUpperCase()
        discountId = d.id
      }
    }

    const total = round(subtotal - discountAmount)

    const orderId = randomUUID()
    await query(
      `INSERT INTO orders (id, customer_name, phone, address, note, subtotal, discount_code, discount_amount, total, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [orderId, name, phone, address || null, note || null, subtotal, appliedCode, discountAmount, total]
    )

    for (const li of lineItems) {
      await query(
        `INSERT INTO order_items (id, order_id, product_id, product_name, price, qty)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [randomUUID(), orderId, li.productId, li.name, li.price, li.qty]
      )
    }

    if (discountId) {
      await query('UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = $1', [discountId])
    }

    return NextResponse.json({
      orderId,
      subtotal,
      discountPercentage,
      discountAmount,
      total,
      items: lineItems.map((i) => ({ name: i.name, price: i.price, qty: i.qty })),
    })
  } catch (err) {
    console.error('Order create error:', err)
    return NextResponse.json({ error: 'Sifariş yaradıla bilmədi' }, { status: 500 })
  }
}
