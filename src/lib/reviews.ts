import { createHash, randomUUID } from 'crypto'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { del } from '@vercel/blob'
import { query } from './db'
import { uploadProductImage } from './blob-upload'
import { getHairTypeLabel } from './constants'
import { sanitizeImageUrls } from './parse-image-urls'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected']

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === 'string' && (REVIEW_STATUSES as string[]).includes(value)
}

export const REVIEW_LIMITS = {
  maxImages: 5,
  maxImageBytes: 4 * 1024 * 1024,
  maxCommentLength: 2000,
  maxNameLength: 60,
  /** Reviews one visitor (IP) may submit per hour, across all products. */
  perIpPerHour: 5,
  /** Reviews one visitor (IP) may submit for the same product per day. */
  perIpPerProductPerDay: 1,
}

/* ------------------------------------------------------------------ */
/* Rating summary                                                     */
/* ------------------------------------------------------------------ */

/** Recomputes the cached average/count of approved reviews on the product row. */
export async function recalcProductRating(productId: string | null | undefined): Promise<void> {
  if (!productId) return
  await query(
    `UPDATE products SET
       rating_count = s.cnt,
       rating_avg = s.avg
     FROM (
       SELECT COUNT(*)::int AS cnt, COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS avg
       FROM product_reviews
       WHERE product_id = $1 AND status = 'approved'
     ) s
     WHERE products.id = $1`,
    [productId]
  )
}

/* ------------------------------------------------------------------ */
/* Public review submission                                           */
/* ------------------------------------------------------------------ */

export interface ReviewInput {
  rating: number
  comment: string
  authorName: string
}

/** Validates the text fields of a submitted review. Returns an error message on bad input. */
export function parseReviewInput(raw: {
  rating: unknown
  comment: unknown
  authorName: unknown
}): { input: ReviewInput } | { error: string } {
  const rating = Number(raw.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Zəhmət olmasa 1-dən 5-ə qədər ulduz seçin' }
  }
  const comment = typeof raw.comment === 'string' ? raw.comment.trim() : ''
  if (comment.length > REVIEW_LIMITS.maxCommentLength) {
    return { error: `Rəy mətni ən çox ${REVIEW_LIMITS.maxCommentLength} simvol ola bilər` }
  }
  const authorName = typeof raw.authorName === 'string' ? raw.authorName.trim().replace(/\s+/g, ' ') : ''
  if (authorName.length > REVIEW_LIMITS.maxNameLength) {
    return { error: `Ad ən çox ${REVIEW_LIMITS.maxNameLength} simvol ola bilər` }
  }
  return { input: { rating, comment, authorName } }
}

type ImageKind = { ext: 'jpg' | 'png' | 'webp'; contentType: string }

/** Detects the real image type from the file's magic bytes (the browser-sent MIME type is not trusted). */
export function sniffImageType(buf: Buffer): ImageKind | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', contentType: 'image/jpeg' }
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: 'png', contentType: 'image/png' }
  }
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp', contentType: 'image/webp' }
  }
  return null
}

export interface ValidatedImage {
  buffer: Buffer
  kind: ImageKind
}

/** Checks count, size and real type of the uploaded files. */
export async function validateReviewImages(files: File[]): Promise<{ images: ValidatedImage[] } | { error: string }> {
  if (files.length > REVIEW_LIMITS.maxImages) {
    return { error: `Ən çox ${REVIEW_LIMITS.maxImages} şəkil yükləyə bilərsiniz` }
  }
  const images: ValidatedImage[] = []
  for (const file of files) {
    if (file.size === 0) continue
    if (file.size > REVIEW_LIMITS.maxImageBytes) {
      return { error: `Hər şəkil ən çox ${REVIEW_LIMITS.maxImageBytes / 1024 / 1024}MB ola bilər` }
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const kind = sniffImageType(buffer)
    if (!kind) return { error: 'Yalnız JPG, PNG və WEBP şəkillər qəbul edilir' }
    images.push({ buffer, kind })
  }
  return { images }
}

function blobStorageEnabled() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.BLOB_READ_WRITE_TOKEN)
}

/** Stores the images under random names; the file extension comes from the sniffed type only. */
export async function storeReviewImages(images: ValidatedImage[]): Promise<string[]> {
  const urls: string[] = []
  for (const { buffer, kind } of images) {
    const name = `${randomUUID()}.${kind.ext}`
    if (blobStorageEnabled()) {
      urls.push(await uploadProductImage(buffer, `reviews/${name}`, kind.contentType))
    } else {
      const dir = path.join(process.cwd(), 'public', 'uploads', 'reviews')
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, name), buffer)
      urls.push(`/uploads/reviews/${name}`)
    }
  }
  return urls
}

/** Best-effort removal of review images (only files this module stored). */
export async function deleteReviewImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      const blobMatch = url.match(/^\/api\/media\/(reviews\/[\w-]+\.(?:jpg|png|webp))$/)
      const localMatch = url.match(/^\/uploads\/reviews\/([\w-]+\.(?:jpg|png|webp))$/)
      if (blobMatch) {
        await del(blobMatch[1])
      } else if (localMatch) {
        await unlink(path.join(process.cwd(), 'public', 'uploads', 'reviews', localMatch[1]))
      }
    } catch (err) {
      console.error('Review image delete error:', err)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Spam protection                                                    */
/* ------------------------------------------------------------------ */

export function hashIp(ip: string): string {
  const salt = process.env.JWT_SECRET || 'vlaecci-dev-secret-change-me'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

/** Returns an error message when this visitor has submitted too many reviews recently. */
export async function checkReviewRateLimit(ipHash: string, productId: string): Promise<string | null> {
  const result = await query<{ last_hour: number; product_day: number }>(
    `SELECT
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')::int AS last_hour,
       COUNT(*) FILTER (WHERE product_id = $2 AND created_at > NOW() - INTERVAL '1 day')::int AS product_day
     FROM product_reviews
     WHERE ip_hash = $1 AND created_at > NOW() - INTERVAL '1 day'`,
    [ipHash, productId]
  )
  const row = result.rows[0]
  if (row && row.product_day >= REVIEW_LIMITS.perIpPerProductPerDay) {
    return 'Bu məhsula artıq rəy göndərmisiniz. Zəhmət olmasa sabah yenidən cəhd edin.'
  }
  if (row && row.last_hour >= REVIEW_LIMITS.perIpPerHour) {
    return 'Çox sayda rəy göndərilib. Zəhmət olmasa bir az sonra yenidən cəhd edin.'
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                        */
/* ------------------------------------------------------------------ */

export interface ReviewRow {
  id: string
  product_id: string
  author_name: string | null
  hair_type: string | null
  rating: number
  comment: string | null
  images: unknown
  status: string | null
  created_at: string
}

export const REVIEW_COLUMNS =
  'r.id, r.product_id, r.author_name, r.hair_type, r.rating, r.comment, r.images, r.status, r.created_at'

export function mapReviewRow(r: ReviewRow) {
  return {
    id: r.id,
    productId: r.product_id,
    authorName: r.author_name || '',
    hairType: r.hair_type || '',
    hairTypeLabel: r.hair_type ? getHairTypeLabel(r.hair_type) : '',
    rating: r.rating,
    comment: r.comment || '',
    images: sanitizeImageUrls(r.images),
    status: (isReviewStatus(r.status) ? r.status : 'approved') as ReviewStatus,
    createdAt: r.created_at,
  }
}
