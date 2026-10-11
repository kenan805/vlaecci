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
  /** Product this result belongs to (shown on its detail page), if any. */
  productId: string | null
  productName: string | null
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
  product_id: string | null
  product_name: string | null
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
    productId: r.product_id,
    productName: r.product_name,
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
    where.push(`r.product_id = $${params.length}`)
  }
  const result = await query<ResultRow>(
    `SELECT r.id, r.before_image, r.after_image, r.title, r.description, r.sort_order, r.is_active,
            r.product_id, p.name AS product_name, r.show_on_home
     FROM before_after_results r
     LEFT JOIN products p ON p.id = r.product_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY r.sort_order ASC, r.created_at ASC`,
    params
  )
  return result.rows.map(mapResult)
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
