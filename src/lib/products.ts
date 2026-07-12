import { query } from './db'
import { sanitizeImageUrls } from './parse-image-urls'
import { getHairTypeLabel, type HairType } from './constants'

export function parseImages(images: unknown): string[] {
  if (Array.isArray(images)) return sanitizeImageUrls(images)
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? sanitizeImageUrls(parsed) : []
    } catch {
      return []
    }
  }
  return []
}

export { parseImageUrls } from './parse-image-urls'

export interface ProductReview {
  id: string
  authorName: string
  hairType: HairType
  hairTypeLabel: string
  rating: number
  comment: string
  createdAt: string
}

export interface ProductDetail {
  id: string
  name: string
  slug: string
  description: string
  ingredients: string
  howToUse: string
  price: number
  images: string[]
  category: { name: string }
  reviews: ProductReview[]
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const result = await query<{
    id: string
    name: string
    slug: string
    description: string
    ingredients: string | null
    how_to_use: string | null
    price: string
    images: unknown
    category_name: string | null
  }>(
    `SELECT p.id, p.name, p.slug, p.description, p.ingredients, p.how_to_use,
            p.price, p.images, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND COALESCE(p.status, 'active') = 'active'
       AND COALESCE(c.is_active, true) = true`,
    [slug]
  )

  const row = result.rows[0]
  if (!row) return null

  const reviewsResult = await query<{
    id: string
    author_name: string
    hair_type: string
    rating: number
    comment: string
    created_at: string
  }>(
    `SELECT id, author_name, hair_type, rating, comment, created_at
     FROM product_reviews
     WHERE product_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [row.id]
  )

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    ingredients: row.ingredients || '',
    howToUse: row.how_to_use || '',
    price: Number(row.price),
    images: parseImages(row.images),
    category: { name: row.category_name || '' },
    reviews: reviewsResult.rows.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      hairType: r.hair_type as HairType,
      hairTypeLabel: getHairTypeLabel(r.hair_type),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
    })),
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  const result = await query<{ slug: string }>('SELECT slug FROM products ORDER BY created_at DESC')
  return result.rows.map((r) => r.slug)
}
