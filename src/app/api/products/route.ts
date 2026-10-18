import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { loadVariants, parseImages } from '@/lib/products'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const result = await query<{
      id: string
      name: string
      slug: string
      description: string
      price: string
      images: string[]
      variant_images: boolean | null
      category_name: string
    }>(
      `SELECT p.id, p.name, p.slug, p.description, p.price, p.images, p.variant_images, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE COALESCE(p.status, 'active') = 'active'
         AND COALESCE(c.is_active, true) = true
       ORDER BY p.created_at DESC`
    )

    const variantsByProduct = await loadVariants(
      result.rows.map((p) => p.id),
      true
    )

    const products = result.rows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      images: parseImages(p.images),
      variants: variantsByProduct.get(p.id) ?? [],
      variantImages: p.variant_images ?? false,
      category: { name: p.category_name },
    }))

    return NextResponse.json({ products })
  } catch (err) {
    console.error('Products error:', err)
    return NextResponse.json({ products: [] })
  }
}
