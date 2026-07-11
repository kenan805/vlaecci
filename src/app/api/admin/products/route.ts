import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { query } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-guard'
import { sanitizeImageUrls } from '@/lib/parse-image-urls'

export type ProductStatus = 'draft' | 'active' | 'deactive'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await query<{
      id: string
      name: string
      slug: string
      description: string
      ingredients: string | null
      how_to_use: string | null
      price: string
      images: string[]
      category_id: string
      category_name: string
      status: string
      created_at: string
      updated_at: string | null
      total_views: number | null
      unique_views: number | null
      review_count: string
    }>(
      `SELECT p.id, p.name, p.slug, p.description, p.ingredients, p.how_to_use,
              p.price, p.images, p.category_id, c.name AS category_name,
              COALESCE(p.status, 'active') AS status,
              p.created_at, p.updated_at,
              COALESCE(p.total_views, 0) AS total_views,
              COALESCE(p.unique_views, 0) AS unique_views,
              (SELECT COUNT(*)::text FROM product_reviews r WHERE r.product_id = p.id) AS review_count
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    )

    const products = result.rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      ingredients: p.ingredients || '',
      howToUse: p.how_to_use || '',
      price: Number(p.price),
      images: sanitizeImageUrls(
        Array.isArray(p.images) ? p.images : JSON.parse((p.images as unknown as string) || '[]')
      ),
      categoryId: p.category_id,
      category: { name: p.category_name },
      status: (p.status || 'active') as ProductStatus,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      totalViews: p.total_views ?? 0,
      uniqueViews: p.unique_views ?? 0,
      reviewCount: Number(p.review_count) || 0,
    }))

    return NextResponse.json({ products })
  } catch (err) {
    console.error('Admin products GET error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, slug, description, ingredients, howToUse, price, images, categoryId, status } = body

    if (!name || !description || price == null || !categoryId) {
      return NextResponse.json({ error: 'Məcburi sahələr doldurulmalıdır' }, { status: 400 })
    }

    const rounded = Math.round(Number(price) * 100) / 100
    if (Number.isNaN(rounded)) {
      return NextResponse.json({ error: 'Qiymət düzgün deyil' }, { status: 400 })
    }

    const id = randomUUID()
    const productSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const productStatus: ProductStatus =
      status === 'draft' || status === 'deactive' || status === 'active' ? status : 'active'

    await query(
      `INSERT INTO products (id, name, slug, description, ingredients, how_to_use, price, images, category_id, status, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [
        id,
        name,
        productSlug,
        description,
        ingredients || '',
        howToUse || '',
        rounded,
        JSON.stringify(sanitizeImageUrls(images)),
        categoryId,
        productStatus,
      ]
    )

    return NextResponse.json({ id, slug: productSlug }, { status: 201 })
  } catch (err) {
    console.error('Admin products POST error:', err)
    return NextResponse.json({ error: 'Məhsul əlavə edilə bilmədi' }, { status: 500 })
  }
}
