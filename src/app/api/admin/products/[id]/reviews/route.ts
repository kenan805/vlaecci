import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: productId } = await params
    const result = await query<{
      id: string
      author_name: string
      hair_type: string
      rating: number
      comment: string
      is_active: boolean
      created_at: string
    }>(
      `SELECT id, author_name, hair_type, rating, comment, is_active, created_at
       FROM product_reviews WHERE product_id = $1 ORDER BY created_at DESC`,
      [productId]
    )

    const reviews = result.rows.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      hairType: r.hair_type,
      rating: r.rating,
      comment: r.comment,
      isActive: r.is_active,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ reviews })
  } catch (err) {
    console.error('Admin reviews GET error:', err)
    return NextResponse.json({ reviews: [] })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: productId } = await params
    const body = await req.json()
    const { authorName, hairType, rating, comment } = body

    if (!authorName || !hairType || !comment) {
      return NextResponse.json({ error: 'Mütləq sahələr doldurulmalıdır' }, { status: 400 })
    }

    const id = randomUUID()
    await query(
      `INSERT INTO product_reviews (id, product_id, author_name, hair_type, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, productId, authorName, hairType, rating || 5, comment]
    )

    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    console.error('Admin reviews POST error:', err)
    return NextResponse.json({ error: 'Rəy əlavə edilə bilmədi' }, { status: 500 })
  }
}
