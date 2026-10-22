'use client'

import { useEffect, useRef, useState } from 'react'
import { Star, ImagePlus, X, CheckCircle2, Clock } from 'lucide-react'
import { buildApiUrl } from '@/lib/api'
import { compressImageFile } from '@/lib/compress-image'
import type { ProductRating, ProductReview } from '@/lib/products'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGES = 5
const MAX_IMAGE_MB = 4
const MAX_COMMENT = 2000
const MAX_NAME = 60
const MAX_HAIR_TYPE = 40
const RATING_LABELS = ['', 'Çox pis', 'Pis', 'Orta', 'Yaxşı', 'Əla']
const CUSTOM_HAIR_TYPE = '__custom'

const inputClass =
  'w-full h-12 px-4 rounded-xl border border-sand-200 bg-cream-50 text-[15px] text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:border-brown-300/40 focus:ring-4 focus:ring-brown-300/10 transition'

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B5344' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
}

interface Picked {
  file: File
  preview: string
}

function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3 mb-2 text-sm font-medium text-brown-300">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-brown-100/60">{hint}</span>}
    </label>
  )
}

export function ReviewForm({
  productSlug,
  hairTypes,
  onClose,
  onPublished,
}: {
  productSlug: string
  hairTypes: { id: string; label: string }[]
  onClose: () => void
  /** Called when a star-only review went live immediately. */
  onPublished?: (review: ProductReview, rating: ProductRating) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [hairType, setHairType] = useState('')
  const [hairTypeCustom, setHairTypeCustom] = useState('')
  const [website, setWebsite] = useState('')
  const [picked, setPicked] = useState<Picked[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<'pending' | 'approved' | null>(null)

  const pickedRef = useRef(picked)
  pickedRef.current = picked
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  // Bring the form into view when it opens (the button that opens it sits in the section header).
  useEffect(() => {
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [result])

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
    const merged = [...picked, ...next]
    if (merged.length > MAX_IMAGES) {
      merged.slice(MAX_IMAGES).forEach((p) => URL.revokeObjectURL(p.preview))
      setError(`Ən çox ${MAX_IMAGES} şəkil yükləyə bilərsiniz`)
    }
    setPicked(merged.slice(0, MAX_IMAGES))
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(picked[index].preview)
    setPicked(picked.filter((_, i) => i !== index))
  }

  const customHairType = hairType === CUSTOM_HAIR_TYPE
  const needsApproval = comment.trim() !== '' || picked.length > 0 || (customHairType && hairTypeCustom.trim() !== '')

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
      if (customHairType) form.set('hairTypeCustom', hairTypeCustom.trim())
      else if (hairType) form.set('hairType', hairType)
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
      if (status === 'approved' && data.review && data.rating) onPublished?.(data.review, data.rating)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rəy göndərilə bilmədi')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const approved = result === 'approved'
    return (
      <div
        ref={rootRef}
        role="status"
        className="scroll-mt-28 rounded-3xl border border-sand-200/70 bg-cream-50 px-6 py-10 sm:px-10 text-center shadow-[0_1px_2px_rgba(74,61,50,0.04),0_8px_24px_-12px_rgba(74,61,50,0.12)]"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-sage/15 text-accent-sage">
          <CheckCircle2 size={28} />
        </span>
        <h3 className="mt-4 font-serif text-2xl text-brown-300">Rəyiniz üçün təşəkkürlər</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-brown-100/80">
          Rəyiniz digər alıcılara seçim etməkdə kömək edəcək.
        </p>
        {!approved && (
          <div className="mt-3 flex justify-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700">
              <Clock size={13} />
              Admin təsdiqindən sonra saytda görünəcək
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-sand-300 px-6 text-sm font-medium text-brown-300 hover:bg-sand-200/50 transition-colors"
        >
          Bağla
        </button>
      </div>
    )
  }

  const shown = hover || rating

  return (
    <div
      ref={rootRef}
      className="scroll-mt-28 rounded-3xl border border-sand-200/70 bg-cream-50 shadow-[0_1px_2px_rgba(74,61,50,0.04),0_8px_24px_-12px_rgba(74,61,50,0.12)]"
    >
      <form id="review-form" onSubmit={handleSubmit} className="relative" noValidate>
        <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-7">
          <div>
            <h3 className="font-serif text-2xl text-brown-300">Rəyinizi bölüşün</h3>
            <p className="mt-1 text-sm text-brown-100/70">Təcrübəniz digər alıcılara doğru seçim etməyə kömək edir.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brown-100 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
            aria-label="Formu bağla"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          {/* Rating */}
          <div className="rounded-2xl bg-cream-100/70 px-5 py-4">
            <p className="mb-2 text-sm font-medium text-brown-300">
              Ümumi qiymətiniz <span className="text-accent-rose">*</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex gap-1" role="radiogroup" aria-label="Ulduzla qiymət" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} ulduz`}
                    onClick={() => {
                      setRating(n)
                      setError('')
                    }}
                    onMouseEnter={() => setHover(n)}
                    className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brown-300/40"
                  >
                    <Star
                      size={32}
                      strokeWidth={1.4}
                      className={n <= shown ? 'fill-amber-400 text-amber-400' : 'text-amber-400/60'}
                    />
                  </button>
                ))}
              </div>
              <span className={`text-sm font-medium ${shown ? 'text-brown-300' : 'text-brown-100/50'}`}>
                {shown ? RATING_LABELS[shown] : 'Ulduz seçin'}
              </span>
            </div>
          </div>

          {/* Name + hair type */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="review-name" hint="İstəyə bağlı">
                Adınız
              </FieldLabel>
              <input
                id="review-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={MAX_NAME}
                autoComplete="given-name"
                placeholder="Yazılmasa “Anonim” göstərilir"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel htmlFor="review-hair-type" hint="İstəyə bağlı">
                Saç tipiniz
              </FieldLabel>
              <select
                id="review-hair-type"
                value={hairType}
                onChange={(e) => setHairType(e.target.value)}
                className={`${inputClass} appearance-none pr-10 bg-[length:16px] bg-[right_14px_center] bg-no-repeat cursor-pointer ${
                  hairType ? '' : 'text-brown-100/50'
                }`}
                style={selectChevron}
              >
                <option value="">Seçin</option>
                {hairTypes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.label}
                  </option>
                ))}
                <option value={CUSTOM_HAIR_TYPE}>Öz seçiminiz…</option>
              </select>
              {customHairType && (
                <input
                  aria-label="Saç tipinizi yazın"
                  value={hairTypeCustom}
                  onChange={(e) => setHairTypeCustom(e.target.value)}
                  maxLength={MAX_HAIR_TYPE}
                  placeholder="Saç tipinizi yazın"
                  autoFocus
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          </div>

          {/* Comment */}
          <div>
            <FieldLabel htmlFor="review-comment" hint="İstəyə bağlı">
              Rəyiniz
            </FieldLabel>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={MAX_COMMENT}
              rows={4}
              placeholder="Məhsulu nə qədər istifadə etdiniz, hansı nəticəni gördünüz?"
              className={`${inputClass} h-auto min-h-[120px] resize-y py-3 leading-relaxed`}
            />
            {comment.length > MAX_COMMENT * 0.8 && (
              <p className="mt-1 text-right text-xs tabular-nums text-brown-100/60">
                {comment.length} / {MAX_COMMENT}
              </p>
            )}
          </div>

          {/* Photos */}
          <div>
            <FieldLabel hint={`JPG, PNG, WEBP · ən çox ${MAX_IMAGES}`}>Şəkillər</FieldLabel>
            <div className="flex flex-wrap gap-3">
              {picked.map((p, i) => (
                <div key={p.preview} className="relative h-20 w-20 overflow-hidden rounded-xl border border-sand-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
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
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-sand-300 bg-cream-100/50 text-[11px] text-brown-100/70 hover:border-brown-300/40 hover:bg-cream-100 hover:text-brown-300 transition-colors"
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

          {/* Honeypot — hidden from people, bots tend to fill it */}
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="review-website">Website</label>
            <input
              id="review-website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-sand-200/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs leading-relaxed text-brown-100/60">
            {needsApproval
              ? 'Mətn, şəkil və ya öz yazdığınız saç tipi olan rəylər admin təsdiqindən sonra dərc olunur.'
              : 'Yalnız ulduzla verilən qiymət dərhal reytinqə əlavə olunur.'}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-full px-5 text-sm font-medium text-brown-100 hover:bg-sand-200/50 hover:text-brown-300 transition-colors sm:flex-none"
            >
              Ləğv et
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-11 flex-1 rounded-full bg-brown-300 px-6 text-sm font-medium text-cream-50 hover:bg-brown-400 disabled:opacity-50 transition-colors sm:flex-none"
            >
              {submitting ? 'Göndərilir…' : 'Rəyi göndər'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
