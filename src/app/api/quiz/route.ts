import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { getRecommendedProducts } from '@/lib/quiz-recommendations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { hairLossLevel, hairType, scalpCondition, email } = body

    if (!hairLossLevel || !hairType || !scalpCondition) {
      return NextResponse.json({ error: 'Bütün suallara cavab verin' }, { status: 400 })
    }

    const id = randomUUID()
    await query(
      'INSERT INTO quiz_responses (id, hair_loss_level, hair_type, scalp_condition, email) VALUES ($1, $2, $3, $4, $5)',
      [id, hairLossLevel, hairType, scalpCondition, email || null]
    )

    const productsResult = await query<{
      id: string
      name: string
      slug: string
      price: string
      category_slug: string
    }>(
      `SELECT p.id, p.name, p.slug, p.price, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    )

    const recommendations = getRecommendedProducts(productsResult.rows, {
      hairLossLevel,
      hairType,
      scalpCondition,
    })

    return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('Quiz error:', err)
    return NextResponse.json({ error: 'Quiz saxlanıla bilmədi. Veritabanı bağlantısını yoxlayın.' }, { status: 500 })
  }
}
