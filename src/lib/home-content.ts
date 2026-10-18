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

export async function listResults(onlyActive: boolean): Promise<BeforeAfterResult[]> {
  const result = await query<ResultRow>(
    `SELECT id, before_image, after_image, title, description, sort_order, is_active
     FROM before_after_results
     ${onlyActive ? 'WHERE COALESCE(is_active, true) = true' : ''}
     ORDER BY sort_order ASC, created_at ASC`
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
