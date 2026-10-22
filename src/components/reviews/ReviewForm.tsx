'use client'

import { useEffect, useRef, useState } from 'react'
import { Star, ImagePlus, X, CheckCircle2, PenLine } from 'lucide-react'
import { buildApiUrl } from '@/lib/api'
import { compressImageFile } from '@/lib/compress-image'
import type { ProductRating, ProductReview } from '@/lib/products'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES = 5
const MAX_IMAGE_MB = 4
const MAX_COMMENT = 2000
const MAX_NAME = 60
const RATING_LABELS = ['', 'Çox pis', 'Pis', 'Orta', 'Yaxşı', 'Əla']

interface Picked {
  file: File
  preview: string
}

export function ReviewForm({
  productSlug,
  onPublished,
}: {
  productSlug: string
  /** Called when a star-only review went live immediately. */
  onPublished?: (review: ProductReview, rating: ProductRating) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [website, setWebsite] = useState('')
  const [picked, setPicked] = useState<Picked[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<'pending' | 'approved' | null>(null)

  const pickedRef = useRef(picked)
  pickedRef.current = picked
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  const onFiles = (list: FileList | null) => {
    if (!list) return
    setError('')
    const next: Picked[] = []
    for (const file of Array.from(list)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Yalnız JPG, PNG və WEBP şəkillər qəbul edilir')
        continue
      }
      next.push({ file, preview: URL.createObjectURL(file) })
    }
    setPicked((cur) => {
      const merged = [...cur, ...next]
      if (merged.length > MAX_IMAGES) {
        merged.slice(MAX_IMAGES).forEach((p) => URL.revokeObjectURL(p.preview))
        setError(`Ən çox ${MAX_IMAGES} şəkil yükləyə bilərsiniz`)
      }
      return merged.slice(0, MAX_IMAGES)
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeImage = (index: number) => {
    setPicked((cur) => {
      URL.revokeObjectURL(cur[index].preview)
      return cur.filter((_, i) => i !== index)
    })
  }

  const reset = () => {
    picked.forEach((p) => URL.revokeObjectURL(p.preview))
    setRating(0)
    setComment('')
    setAuthorName('')
    setPicked([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (rating < 1) {
      setError('Zəhmət olmasa ulduzla qiymət verin')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.set('rating', String(rating))
      form.set('comment', comment.trim())
      form.set('authorName', authorName.trim())
      form.set('website', website)
      for (const p of picked) {
        // Shrink large photos before upload so requests stay small (re-encoded as JPEG).
        const file =
          p.file.size > 1024 * 1024 ? await compressImageFile(p.file, 1600, 0.85).catch(() => p.file) : p.file
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
          throw new Error(`Hər şəkil ən çox ${MAX_IMAGE_MB}MB ola bilər`)
        }
        form.append('images', file)
      }

      const res = await fetch(buildApiUrl(`/products/${productSlug}/reviews`), { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Rəy göndərilə bilmədi')

      const status = data.status === 'approved' ? 'approved' : 'pending'
      setResult(status)
      reset()
      if (status === 'approved' && data.review && data.rating) onPublished?.(data.review, data.rating)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rəy göndərilə bilmədi')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-accent-sage/40 bg-accent-sage/10 p-5 flex items-start gap-3">
        <CheckCircle2 size={22} className="shrink-0 text-accent-sage mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-brown-300">
            {result === 'approved' ? 'Qiymətiniz qəbul olundu. Təşəkkür edirik!' : 'Rəyiniz göndərildi. Təşəkkür edirik!'}
          </p>
          {result === 'pending' && (
            <p className="text-sm text-brown-100/90 mt-1">Rəyiniz admin təsdiqindən sonra saytda görünəcək.</p>
          )}
          <button
            type="button"
            onClick={() => {
              setResult(null)
              setOpen(true)
            }}
            className="mt-3 text-sm text-accent-rose hover:underline"
          >
            Yeni rəy yaz
          </button>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-controls="review-form"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brown-300 text-cream-50 font-medium hover:bg-brown-400 transition-colors"
      >
        <PenLine size={18} />
        Rəy yaz
      </button>
    )
  }

  const shown = hover || rating

  return (
    <form
      id="review-form"
      onSubmit={handleSubmit}
      className="relative rounded-2xl border border-sand-200/60 bg-cream-100 p-5 space-y-4"
      noValidate
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-medium text-brown-300">Rəy yaz</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError('')
          }}
          className="p-1.5 rounded-lg text-brown-100 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
          aria-label="Formu bağla"
          title="Bağla"
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-brown-200 mb-1.5">
          Qiymətiniz <span className="text-accent-rose">*</span>
        </p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1" role="radiogroup" aria-label="Ulduzla qiymət" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ulduz`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brown-300/40"
              >
                <Star
                  size={28}
                  strokeWidth={1.5}
                  className={n <= shown ? 'fill-amber-400 text-amber-400' : 'text-amber-400/70'}
                />
              </button>
            ))}
          </div>
          {shown > 0 && <span className="text-sm text-brown-100">{RATING_LABELS[shown]}</span>}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-brown-200 mb-1.5">
          Rəyiniz <span className="font-normal text-brown-100/60">(istəyə bağlı)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={MAX_COMMENT}
          rows={4}
          placeholder="Məhsul haqqında təcrübənizi bölüşün..."
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20"
        />
      </div>

      <div>
        <label htmlFor="review-name" className="block text-sm font-medium text-brown-200 mb-1.5">
          Adınız <span className="font-normal text-brown-100/60">(istəyə bağlı — yazılmasa “Anonim” göstəriləcək)</span>
        </label>
        <input
          id="review-name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={MAX_NAME}
          autoComplete="given-name"
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 text-brown-300 focus:outline-none focus:ring-2 focus:ring-brown-300/20"
        />
      </div>

      {/* Honeypot — hidden from people, bots tend to fill it */}
      <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
        <label htmlFor="review-website">Website</label>
        <input
          id="review-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-brown-200 mb-1.5">
          Şəkillər{' '}
          <span className="font-normal text-brown-100/60">
            (istəyə bağlı — JPG, PNG, WEBP, ən çox {MAX_IMAGES} şəkil)
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {picked.map((p, i) => (
            <div key={p.preview} className="relative w-20 h-20 rounded-lg overflow-hidden border border-sand-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Şəkli sil"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {picked.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-sand-300 text-brown-100/70 hover:border-brown-300/40 hover:text-brown-300 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors"
            >
              <ImagePlus size={20} />
              Əlavə et
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {(comment.trim() || picked.length > 0) && (
        <p className="text-xs text-brown-100/70">Mətn və ya şəkil olan rəylər admin təsdiqindən sonra dərc olunur.</p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-brown-300 text-cream-50 font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Göndərilir...' : 'Rəyi göndər'}
      </button>
    </form>
  )
}
