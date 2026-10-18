import { query } from './db'
import { isValidImageUrl } from './parse-image-urls'

export interface BeforeAfterResult {
  id: string
  beforeImage: string
  afterImage: string
  title: string
  description: string
  sortOrder: number
  isActive: boolean
  /** Products whose detail pages show this result. */
  products: { id: string; name: string }[]
  showOnHome: boolean
}

export interface Testimonial {
  id: string
  name: string
  handle: string
  text: string
  rating: number
  sortOrder: number
  isActive: boolean
}

interface ResultRow {
  id: string
  before_image: string
  after_image: string
  title: string | null
  description: string | null
  sort_order: number | null
  is_active: boolean | null
  products: { id: string; name: string }[] | null
  show_on_home: boolean | null
}

interface TestimonialRow {
  id: string
  name: string
  handle: string | null
  text: string
  rating: number | null
  sort_order: number | null
  is_active: boolean | null
}

function mapResult(r: ResultRow): BeforeAfterResult {
  return {
    id: r.id,
    beforeImage: r.before_image,
    afterImage: r.after_image,
    title: r.title || '',
    description: r.description || '',
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active ?? true,
    products: r.products ?? [],
    showOnHome: r.show_on_home ?? true,
  }
}

function mapTestimonial(t: TestimonialRow): Testimonial {
  return {
    id: t.id,
    name: t.name,
    handle: t.handle || '',
    text: t.text,
    rating: clampRating(t.rating),
    sortOrder: t.sort_order ?? 0,
    isActive: t.is_active ?? true,
  }
}

export function clampRating(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 5
  return Math.min(5, Math.max(1, n))
}

export function isAllowedImage(url: unknown): url is string {
  return typeof url === 'string' && url.trim() !== '' && !url.startsWith('data:') && isValidImageUrl(url.trim())
}

/**
 * Before/after results. `home` → active results marked for the homepage; `productId` → active
 * results linked to that product; neither → every result (admin).
 */
export async function listResults(
  filter: { home?: boolean; productId?: string } = {}
): Promise<BeforeAfterResult[]> {
  const where: string[] = []
  const params: unknown[] = []
  if (filter.home || filter.productId) where.push('COALESCE(r.is_active, true) = true')
  if (filter.home) where.push('COALESCE(r.show_on_home, true) = true')
  if (filter.productId) {
    params.push(filter.productId)
    where.push(
      `EXISTS (SELECT 1 FROM before_after_products bp WHERE bp.result_id = r.id AND bp.product_id = $${params.length})`
    )
  }
  const result = await query<ResultRow>(
    `SELECT r.id, r.before_image, r.after_image, r.title, r.description, r.sort_order, r.is_active,
            r.show_on_home,
            (SELECT COALESCE(json_agg(json_build_object('id', p.id, 'name', p.name) ORDER BY p.name), '[]')
               FROM before_after_products bp
               JOIN products p ON p.id = bp.product_id
              WHERE bp.result_id = r.id) AS products
     FROM before_after_results r
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY r.sort_order ASC, r.created_at ASC`,
    params
  )
  return result.rows.map(mapResult)
}

/** Normalizes the productIds sent by the admin form. Returns null when the field was not sent. */
export function parseProductIds(raw: unknown): string[] | null {
  if (raw === undefined) return null
  if (!Array.isArray(raw)) return []
  return Array.from(new Set(raw.filter((id): id is string => typeof id === 'string' && id !== '')))
}

/** Replaces the set of products a result is linked to (unknown product ids are ignored). */
export async function setResultProducts(resultId: string, productIds: string[]): Promise<void> {
  await query('DELETE FROM before_after_products WHERE result_id = $1', [resultId])
  if (productIds.length === 0) return
  await query(
    `INSERT INTO before_after_products (result_id, product_id)
     SELECT $1, id FROM products WHERE id = ANY($2::text[])
     ON CONFLICT DO NOTHING`,
    [resultId, productIds]
  )
}

export async function listTestimonials(onlyActive: boolean): Promise<Testimonial[]> {
  const result = await query<TestimonialRow>(
    `SELECT id, name, handle, text, rating, sort_order, is_active
     FROM testimonials
     ${onlyActive ? 'WHERE COALESCE(is_active, true) = true' : ''}
     ORDER BY sort_order ASC, created_at ASC`
  )
  return result.rows.map(mapTestimonial)
}
