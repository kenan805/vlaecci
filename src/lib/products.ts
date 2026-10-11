import { randomUUID } from 'crypto'
import { query } from './db'
import { sanitizeImageUrls } from './parse-image-urls'
import { getHairTypeLabel, type HairType } from './constants'
import { isVariantUnit, type ProductVariant, type VariantUnit } from './variants'
import { listResults, type BeforeAfterResult } from './home-content'

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
  variants: ProductVariant[]
  variantImages: boolean
  /** Active before/after results linked to this product. */
  beforeAfter: BeforeAfterResult[]
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
    variant_images: boolean | null
    category_name: string | null
  }>(
    `SELECT p.id, p.name, p.slug, p.description, p.ingredients, p.how_to_use,
            p.price, p.images, p.variant_images, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.slug = $1 AND COALESCE(p.status, 'active') = 'active'
       AND COALESCE(c.is_active, true) = true`,
    [slug]
  )

  const row = result.rows[0]
  if (!row) return null

  const variants = (await loadVariants([row.id], true)).get(row.id) ?? []
  const beforeAfter = await listResults({ productId: row.id })

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
    variants,
    variantImages: row.variant_images ?? false,
    beforeAfter,
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

/* ------------------------------------------------------------------ */
/* Size / volume variants                                             */
/* ------------------------------------------------------------------ */

interface VariantRow {
  id: string
  product_id: string
  amount: string
  unit: string
  label: string | null
  price: string
  images: unknown
  sort_order: number | null
  is_active: boolean | null
}

/** Variants grouped by product id, ordered by sort order then size. */
export async function loadVariants(
  productIds: string[],
  onlyActive: boolean
): Promise<Map<string, ProductVariant[]>> {
  const map = new Map<string, ProductVariant[]>()
  if (productIds.length === 0) return map
  const result = await query<VariantRow>(
    `SELECT id, product_id, amount, unit, label, price, images, sort_order, is_active
     FROM product_variants
     WHERE product_id = ANY($1::text[])
       ${onlyActive ? 'AND COALESCE(is_active, true) = true' : ''}
     ORDER BY sort_order ASC, amount ASC`,
    [productIds]
  )
  for (const r of result.rows) {
    const list = map.get(r.product_id) ?? []
    list.push({
      id: r.id,
      amount: Number(r.amount),
      unit: (isVariantUnit(r.unit) ? r.unit : 'ml') as VariantUnit,
      label: r.label || '',
      price: Number(r.price),
      images: parseImages(r.images),
      sortOrder: r.sort_order ?? 0,
      isActive: r.is_active ?? true,
    })
    map.set(r.product_id, list)
  }
  return map
}

export interface VariantInput {
  id?: string
  amount: number
  unit: VariantUnit
  label: string
  price: number
  images: string[]
  isActive: boolean
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Validates the variants array sent by the admin form. Returns an error message on bad input. */
export function parseVariantsInput(raw: unknown): { variants: VariantInput[] } | { error: string } {
  if (raw == null) return { variants: [] }
  if (!Array.isArray(raw)) return { error: 'Variantlar düzgün deyil' }
  const variants: VariantInput[] = []
  for (const item of raw) {
    const v = (item ?? {}) as Record<string, unknown>
    const amount = round2(Number(v.amount))
    const price = round2(Number(v.price))
    if (!Number.isFinite(amount) || amount <= 0) return { error: 'Hər variantın həcmi 0-dan böyük olmalıdır' }
    if (!isVariantUnit(v.unit)) return { error: 'Variant vahidi düzgün deyil' }
    if (!Number.isFinite(price) || price < 0) return { error: 'Hər variantın qiyməti düzgün olmalıdır' }
    variants.push({
      id: typeof v.id === 'string' && v.id ? v.id : undefined,
      amount,
      unit: v.unit,
      label: typeof v.label === 'string' ? v.label.trim().slice(0, 60) : '',
      price,
      images: sanitizeImageUrls(v.images),
      isActive: typeof v.isActive === 'boolean' ? v.isActive : true,
    })
  }
  const keys = new Set(variants.map((v) => `${v.amount}|${v.unit}|${v.label.toLowerCase()}`))
  if (keys.size !== variants.length) return { error: 'Eyni həcmli variant iki dəfə əlavə edilib' }
  return { variants }
}

/**
 * Replaces a product's variants with the given list (keeps ids of existing ones so past orders
 * still reference them) and syncs products.price to the lowest active variant price.
 */
export async function saveVariants(productId: string, variants: VariantInput[]): Promise<void> {
  const existing = await query<{ id: string }>('SELECT id FROM product_variants WHERE product_id = $1', [productId])
  const existingIds = new Set(existing.rows.map((r) => r.id))
  const keepIds: string[] = []

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]
    const params = [v.amount, v.unit, v.label, v.price, JSON.stringify(v.images), i, v.isActive]
    if (v.id && existingIds.has(v.id)) {
      await query(
        `UPDATE product_variants SET amount = $1, unit = $2, label = $3, price = $4, images = $5,
         sort_order = $6, is_active = $7 WHERE id = $8 AND product_id = $9`,
        [...params, v.id, productId]
      )
      keepIds.push(v.id)
    } else {
      const id = randomUUID()
      await query(
        `INSERT INTO product_variants (id, amount, unit, label, price, images, sort_order, is_active, product_id)
         VALUES ($9, $1, $2, $3, $4, $5, $6, $7, $8)`,
        [...params, productId, id]
      )
      keepIds.push(id)
    }
  }

  await query('DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::text[]))', [
    productId,
    keepIds,
  ])

  const active = variants.filter((v) => v.isActive)
  if (active.length > 0) {
    const min = Math.min(...active.map((v) => v.price))
    await query('UPDATE products SET price = $1 WHERE id = $2', [min, productId])
  }
}
