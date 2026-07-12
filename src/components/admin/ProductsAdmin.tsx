'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Eye,
  MessageSquare,
  X,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Check,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { HAIR_TYPES, getHairTypeLabel } from '@/lib/constants'
import { compressImageFile } from '@/lib/compress-image'
import { isValidImageUrl } from '@/lib/parse-image-urls'
import { ConfirmModal } from './ConfirmModal'
import { useToast } from './Toast'

type ProductStatus = 'draft' | 'active' | 'deactive'

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  ingredients?: string
  howToUse?: string
  price: number
  images?: string[]
  categoryId?: string
  category?: { name: string }
  status: ProductStatus
  createdAt?: string
  updatedAt?: string | null
  totalViews?: number
  uniqueViews?: number
  reviewCount?: number
}

interface Review {
  id: string
  authorName: string
  hairType: string
  rating: number
  comment: string
  isActive?: boolean
  createdAt?: string
}

interface Visitor {
  ip: string
  country: string
  lastViewed: string
  viewCount: number
}

type SortField = 'name' | 'price' | 'category' | 'createdAt' | 'updatedAt'
type SortDir = 'asc' | 'desc'

type ConfirmState =
  | { kind: 'delete-product'; id: string }
  | { kind: 'bulk'; action: 'active' | 'deactive' | 'delete'; ids: string[] }
  | { kind: 'delete-review'; reviewId: string; productId: string }

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: 'Qaralama',
  active: 'Aktiv',
  deactive: 'Deaktiv',
}

const STATUS_CYCLE: ProductStatus[] = ['draft', 'active', 'deactive']

const fieldClassName =
  'w-full px-3.5 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/50 transition-shadow'

export const modernSelectClassName = `${fieldClassName} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat cursor-pointer hover:border-brown-300/40`

const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B5344' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
}

// Frosted-glass toolbar controls
const glassControl =
  'h-10 rounded-xl border border-sand-200/70 bg-white/55 backdrop-blur-sm text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/25 focus:border-brown-300/50 transition-colors'

const glassSelect = `${glassControl} appearance-none pl-3.5 pr-9 bg-[length:16px] bg-[right_12px_center] bg-no-repeat cursor-pointer hover:border-brown-300/45`

// Status pill palette: neutral text + colored dot for AA contrast
const STATUS_STYLES: Record<ProductStatus, { pill: string; dot: string }> = {
  draft: { pill: 'bg-sand-200/60 text-brown-200 ring-sand-300/50', dot: 'bg-sand-400' },
  active: { pill: 'bg-accent-sage/15 text-brown-200 ring-accent-sage/35', dot: 'bg-accent-sage' },
  deactive: { pill: 'bg-brown-100/10 text-brown-100/70 ring-brown-100/15', dot: 'bg-brown-100/40' },
}

function slugifyAz(text: string) {
  return text
    .toLowerCase()
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatPrice(value: number) {
  return `${value} ₼`
}

function roundPrice(value: number) {
  return Math.round(value * 100) / 100
}

function AdminModal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-brown-300/40 backdrop-blur-[2px]"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} max-h-[90vh] flex flex-col rounded-2xl bg-cream-50 shadow-xl border border-sand-200/80`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-200/60 shrink-0">
          <h3 className="font-serif text-lg font-medium text-brown-300">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brown-100 hover:bg-sand-200/60 transition-colors"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="shrink-0 px-5 py-4 border-t border-sand-200/60 bg-cream-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function ImageLightbox({
  src,
  alt,
  onClose,
  zoomable = false,
}: {
  src: string
  alt: string
  onClose: () => void
  zoomable?: boolean
}) {
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-brown-300/60 backdrop-blur-sm" onClick={onClose} aria-label="Bağla" />
      <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3">
        {zoomable && (
          <div className="flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="p-2 rounded-xl bg-cream-50/95 text-brown-300 border border-sand-200 shadow hover:bg-cream-100"
              title="Kiçilt"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs text-cream-50 font-medium min-w-[48px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="p-2 rounded-xl bg-cream-50/95 text-brown-300 border border-sand-200 shadow hover:bg-cream-100"
              title="Böyüt"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl transition-transform duration-200"
          style={{ transform: zoomable ? `scale(${zoom})` : undefined }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 -right-2 p-2 rounded-full bg-cream-50 text-brown-300 shadow-lg border border-sand-200 hover:bg-sand-200/50"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

function SortHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
}: {
  label: string
  field: SortField
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
}) {
  const active = sortField === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-brown-300 transition-colors group"
    >
      {label}
      <span className={`inline-flex ${active ? 'text-brown-300' : 'text-brown-100/30 group-hover:text-brown-100/60'}`}>
        {active ? (
          sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        ) : (
          <ArrowUp size={12} className="opacity-0 group-hover:opacity-100" />
        )}
      </span>
    </button>
  )
}

function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(product?.name || '')
  const [slug, setSlug] = useState(product?.slug || '')
  const [description, setDescription] = useState(product?.description || '')
  const [ingredients, setIngredients] = useState(product?.ingredients || '')
  const [howToUse, setHowToUse] = useState(product?.howToUse || '')
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'active')
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || '')
  const [categoryId, setCategoryId] = useState(product?.categoryId || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(product?.categoryId || categories[0].id)
    }
  }, [categories, product, categoryId])

  const onNameChange = (value: string) => {
    setName(value)
    if (!product) setSlug(slugifyAz(value))
  }

  const handlePriceChange = (value: string) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) setPrice(value)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Yalnız şəkil faylları (jpg, png, webp)')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('Maksimum ölçü: 4MB')
      return
    }
    setUploading(true)
    setUploadError('')
    try {
      const compressed = await compressImageFile(file)
      const formData = new FormData()
      formData.append('file', compressed)
      const res = await apiFetch('/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta')
      const url = typeof data.url === 'string' ? data.url.trim() : ''
      if (!isValidImageUrl(url)) throw new Error('Server link qaytarmadı')
      setImageUrl(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükləmə uğursuz')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = product ? `/admin/products/${product.id}` : '/admin/products'
      const res = await apiFetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || slugifyAz(name),
          description,
          ingredients,
          howToUse,
          price: roundPrice(Number(price)),
          images: imageUrl ? [imageUrl] : [],
          categoryId: categoryId || categories[0]?.id,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(product ? 'Məhsul yeniləndi' : 'Məhsul əlavə edildi')
      onSaved()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      title={product ? 'Məhsulu redaktə et' : 'Yeni məhsul'}
      onClose={onClose}
      wide
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-brown-100 border border-sand-200 hover:bg-sand-200/40 transition-colors"
          >
            Ləğv et
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={loading || uploading}
            className="px-6 py-2.5 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Saxlanılır...' : 'Saxla'}
          </button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Ad</label>
          <input value={name} onChange={(e) => onNameChange(e.target.value)} className={fieldClassName} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brown-100 mb-1.5">Qiymət (₼)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={fieldClassName}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brown-100 mb-1.5">Kateqoriya</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={modernSelectClassName}
              style={selectChevronStyle}
              required
            >
              <option value="">Seçin</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProductStatus)}
            className={modernSelectClassName}
            style={selectChevronStyle}
          >
            {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Təsvir</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={fieldClassName} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Tərkibi</label>
          <textarea
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={2}
            placeholder="Məhsulun tərkibindəki komponentlər..."
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">İstifadə qaydası</label>
          <textarea
            value={howToUse}
            onChange={(e) => setHowToUse(e.target.value)}
            rows={2}
            placeholder="Məhsulun necə istifadə olunması..."
            className={fieldClassName}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Şəkil</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          {!imageUrl ? (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 px-4 rounded-2xl border-2 border-dashed border-sand-300 bg-cream-50 hover:border-brown-300/50 hover:bg-sand-200/20 text-brown-100 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={28} className="animate-spin text-brown-300" />
              ) : (
                <Upload size={28} className="text-brown-300" />
              )}
              <span className="text-sm font-medium text-brown-300">{uploading ? 'Yüklənir...' : 'Şəkil yüklə'}</span>
              <span className="text-xs text-brown-100/60">JPG, PNG və ya WEBP · maks. 4MB</span>
            </button>
          ) : (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Önizləmə" className="h-36 w-36 rounded-2xl object-cover border border-sand-200 shadow-sm" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brown-300 text-cream-50 flex items-center justify-center shadow-md hover:bg-brown-400 transition-colors"
                title="Şəkli sil"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs text-accent-rose hover:underline block"
              >
                Başqa şəkil seç
              </button>
            </div>
          )}
          {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
        </div>
      </form>
    </AdminModal>
  )
}

function ReviewFormModal({
  mode,
  review,
  productId,
  onClose,
  onSaved,
}: {
  mode: 'add' | 'edit'
  review?: Review
  productId: string
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [authorName, setAuthorName] = useState(review?.authorName || '')
  const [hairType, setHairType] = useState(review?.hairType || 'normal')
  const [rating, setRating] = useState(review?.rating?.toString() || '5')
  const [comment, setComment] = useState(review?.comment || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'add') {
        const res = await apiFetch(`/admin/products/${productId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName, hairType, rating: Number(rating), comment }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Xəta')
        toast('Rəy əlavə edildi')
      } else if (review) {
        const res = await apiFetch(`/admin/reviews/${review.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authorName,
            hairType,
            rating: Number(rating),
            comment,
            isActive: review.isActive ?? true,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Xəta')
        toast('Rəy yeniləndi')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      title={mode === 'add' ? 'Rəy əlavə et' : 'Rəyi yenilə'}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-brown-100 border border-sand-200 hover:bg-sand-200/40">
            Ləğv et
          </button>
          <button
            type="submit"
            form="review-form"
            disabled={loading}
            className="px-6 py-2.5 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium hover:bg-brown-400 disabled:opacity-50"
          >
            {loading ? 'Saxlanılır...' : 'Saxla'}
          </button>
        </div>
      }
    >
      <form id="review-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Ad</label>
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={fieldClassName} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Saç tipi</label>
          <select
            value={hairType}
            onChange={(e) => setHairType(e.target.value)}
            className={modernSelectClassName}
            style={selectChevronStyle}
            required
          >
            {HAIR_TYPES.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Reytinq</label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={modernSelectClassName}
            style={selectChevronStyle}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ulduz
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brown-100 mb-1.5">Rəy</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className={fieldClassName} required />
        </div>
      </form>
    </AdminModal>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center text-sm leading-none" aria-label={`${rating} / 5`}>
      <span className="text-amber-400">{'★'.repeat(rating)}</span>
      <span className="text-sand-300">{'★'.repeat(Math.max(0, 5 - rating))}</span>
    </span>
  )
}

function ProductReviewsModal({
  product,
  reviewsRefreshKey,
  onClose,
  onRefresh,
  onConfirmDeleteReview,
}: {
  product: Product
  reviewsRefreshKey?: number
  onClose: () => void
  onRefresh: () => void
  onConfirmDeleteReview: (reviewId: string, productId: string) => void
}) {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<null | { kind: 'add' } | { kind: 'edit'; review: Review }>(null)

  const loadReviews = useCallback(() => {
    setLoading(true)
    apiFetch(`/admin/products/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .finally(() => setLoading(false))
  }, [product.id])

  useEffect(() => {
    loadReviews()
  }, [loadReviews, reviewsRefreshKey])

  const toggleActive = async (r: Review) => {
    const nextActive = !(r.isActive ?? true)
    setTogglingId(r.id)
    try {
      const res = await apiFetch(`/admin/reviews/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: r.authorName,
          hairType: r.hairType,
          rating: r.rating,
          comment: r.comment,
          isActive: nextActive,
        }),
      })
      if (!res.ok) throw new Error('Xəta')
      setReviews((prev) => prev.map((x) => (x.id === r.id ? { ...x, isActive: nextActive } : x)))
      toast(nextActive ? 'Rəy aktiv edildi' : 'Rəy deaktiv edildi')
      onRefresh()
    } catch {
      toast('Status dəyişmədi', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = reviews.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase().trim()
    return r.authorName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
  })

  return (
    <>
      <AdminModal title={`${product.name} — Rəylər`} onClose={onClose} wide>
        <div className="space-y-4">
          {/* Search + add */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-100/50 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rəy axtar (ad və ya mətn)..."
                className="w-full h-10 pl-10 pr-9 rounded-xl border border-sand-200/70 bg-white text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/40 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-brown-100/50 hover:text-brown-300 hover:bg-sand-200/50 transition-colors"
                  aria-label="Təmizlə"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setReviewModal({ kind: 'add' })}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-brown-300 text-cream-50 text-sm font-medium hover:bg-brown-400 transition-colors shrink-0"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Rəy əlavə et</span>
            </button>
          </div>

          {/* List */}
          {loading ? (
            <p className="text-sm text-brown-100/60 py-8 text-center">Yüklənir...</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-brown-100/60">
              <div className="w-12 h-12 rounded-2xl bg-sand-200/40 flex items-center justify-center">
                <MessageSquare size={22} className="text-sand-400" />
              </div>
              <p className="text-sm">{search ? 'Uyğun rəy tapılmadı' : 'Hələ rəy yoxdur'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((r) => {
                const active = r.isActive ?? true
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-3.5 transition-colors ${
                      active ? 'border-sand-200/70 bg-white' : 'border-sand-200/50 bg-sand-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-brown-300 text-sm">{r.authorName}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-sand-200/60 text-brown-200">
                            {getHairTypeLabel(r.hairType)}
                          </span>
                          <StarRating rating={r.rating} />
                          {!active && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-brown-100/10 text-brown-100/60">
                              Deaktiv
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-brown-100/90 mt-1.5 leading-relaxed whitespace-pre-line">{r.comment}</p>
                        {r.createdAt && <p className="text-xs text-brown-100/50 mt-1.5">{formatDate(r.createdAt)}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleActive(r)}
                          disabled={togglingId === r.id}
                          title={active ? 'Deaktiv et' : 'Aktiv et'}
                          aria-label={active ? 'Deaktiv et' : 'Aktiv et'}
                          aria-pressed={active}
                          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                            active ? 'bg-accent-sage' : 'bg-sand-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                              active ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewModal({ kind: 'edit', review: r })}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
                          title="Redaktə et"
                          aria-label="Rəyi redaktə et"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirmDeleteReview(r.id, product.id)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Sil"
                          aria-label="Rəyi sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </AdminModal>

      {(reviewModal?.kind === 'add' || reviewModal?.kind === 'edit') && (
        <ReviewFormModal
          mode={reviewModal.kind}
          review={reviewModal.kind === 'edit' ? reviewModal.review : undefined}
          productId={product.id}
          onClose={() => setReviewModal(null)}
          onSaved={() => {
            loadReviews()
            onRefresh()
          }}
        />
      )}
    </>
  )
}

function VisitorsModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [stats, setStats] = useState({ totalViews: 0, uniqueViews: 0 })

  useEffect(() => {
    apiFetch(`/admin/products/${productId}/views`)
      .then((r) => r.json())
      .then((d) => {
        setStats({ totalViews: d.totalViews ?? 0, uniqueViews: d.uniqueViews ?? 0 })
        setVisitors(d.visitors || [])
      })
      .finally(() => setLoading(false))
  }, [productId])

  return (
    <AdminModal title="Baxış statistikası" onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-xl bg-cream-100 border border-sand-200/50">
            <p className="text-xs text-brown-100/60">Ümumi baxış</p>
            <p className="text-xl font-medium text-brown-300">{stats.totalViews}</p>
          </div>
          <div className="flex-1 p-3 rounded-xl bg-cream-100 border border-sand-200/50">
            <p className="text-xs text-brown-100/60">Unikal baxış</p>
            <p className="text-xl font-medium text-brown-300">{stats.uniqueViews}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-brown-100/60">Yüklənir...</p>
        ) : visitors.length === 0 ? (
          <p className="text-sm text-brown-100/60">Ziyarətçi məlumatı yoxdur</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-sand-200/60">
            <table className="w-full text-left text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-sand-200/70 bg-sand-200/20">
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">IP</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Ölkə</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Son baxış</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Say</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v, i) => (
                  <tr key={`${v.ip}-${i}`} className="border-b border-sand-200/40 last:border-0">
                    <td className="px-3 py-2 font-mono text-xs text-brown-300">{v.ip}</td>
                    <td className="px-3 py-2 text-brown-100">{v.country}</td>
                    <td className="px-3 py-2 text-brown-100 whitespace-nowrap">{formatDate(v.lastViewed)}</td>
                    <td className="px-3 py-2 text-brown-300">{v.viewCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminModal>
  )
}

function ProductViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [visitorsOpen, setVisitorsOpen] = useState(false)
  const img = product.images?.[0]

  const stats: { label: string; value: string | number }[] = [
    { label: 'Qiymət', value: formatPrice(product.price) },
    { label: 'Ümumi baxış', value: product.totalViews ?? 0 },
    { label: 'Unikal baxış', value: product.uniqueViews ?? 0 },
    { label: 'Rəylər', value: product.reviewCount ?? 0 },
  ]

  return (
    <>
      <AdminModal title={product.name} onClose={onClose} wide>
        <div className="space-y-5">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category?.name && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent-rose/15 text-accent-rose">
                {product.category.name}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ring-1 ${STATUS_STYLES[product.status].pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[product.status].dot}`} />
              {STATUS_LABELS[product.status]}
            </span>
            {product.createdAt && (
              <span className="text-xs text-brown-100/50">{formatDate(product.createdAt)}</span>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-sand-200/70 bg-cream-50 p-3">
                <p className="text-[11px] text-brown-100/60 mb-0.5">{s.label}</p>
                <p className="text-lg font-semibold text-brown-300 tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Image + description */}
          <div className="flex flex-col sm:flex-row gap-5">
            <button
              type="button"
              onClick={() => img && setLightboxSrc(img)}
              className="w-full sm:w-52 h-52 rounded-2xl overflow-hidden bg-sand-200/30 border border-sand-200/50 shrink-0 hover:ring-2 hover:ring-brown-300/20 transition-shadow cursor-zoom-in"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sand-400 text-sm">Şəkil yoxdur</div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-semibold text-brown-300 mb-1.5">Təsvir</h5>
              <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{product.description || '—'}</p>
            </div>
          </div>

          {product.ingredients && (
            <section>
              <h5 className="text-sm font-semibold text-brown-300 mb-1.5">Tərkibi</h5>
              <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{product.ingredients}</p>
            </section>
          )}

          {product.howToUse && (
            <section>
              <h5 className="text-sm font-semibold text-brown-300 mb-1.5">İstifadə qaydası</h5>
              <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{product.howToUse}</p>
            </section>
          )}

          <div className="flex justify-end pt-1 border-t border-sand-200/50">
            <button
              type="button"
              onClick={() => setVisitorsOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-sand-200/70 text-brown-100 hover:bg-sand-200/40 hover:text-brown-300 transition-colors"
            >
              <Eye size={15} />
              Ziyarətçilər
            </button>
          </div>
        </div>
      </AdminModal>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt={product.name} onClose={() => setLightboxSrc(null)} zoomable />
      )}

      {visitorsOpen && <VisitorsModal productId={product.id} onClose={() => setVisitorsOpen(false)} />}
    </>
  )
}

export function ProductsAdmin({
  categories,
  products,
  onRefresh,
}: {
  categories: { id: string; name: string }[]
  products: Product[]
  onRefresh: () => void
}) {
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statusMenu, setStatusMenu] = useState<{ id: string; top: number; left: number } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState<'list' | 'grid'>('list')

  const [formProduct, setFormProduct] = useState<Product | null | 'create'>(null)
  const [viewProduct, setViewProduct] = useState<Product | null>(null)
  const [reviewsProduct, setReviewsProduct] = useState<Product | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (search) {
        const q = search.toLowerCase().trim()
        const matchesName = p.name.toLowerCase().includes(q)
        const matchesPrice = String(p.price).includes(q)
        if (!matchesName && !matchesPrice) return false
      }
      if (filterCategory && p.categoryId !== filterCategory) return false
      if (filterStatus && p.status !== filterStatus) return false
      if (minPrice && p.price < Number(minPrice)) return false
      if (maxPrice && p.price > Number(maxPrice)) return false
      return true
    })
  }, [products, search, filterCategory, filterStatus, minPrice, maxPrice])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'az')
          break
        case 'price':
          cmp = a.price - b.price
          break
        case 'category':
          cmp = (a.category?.name || '').localeCompare(b.category?.name || '', 'az')
          break
        case 'createdAt':
          cmp = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          break
        case 'updatedAt':
          cmp = new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime()
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sortField, sortDir])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageItems = sorted.slice(start, start + pageSize)
  const from = total === 0 ? 0 : start + 1
  const to = Math.min(start + pageSize, total)

  const pageNumbers = (() => {
    const pages: number[] = []
    const maxButtons = 5
    let startPage = Math.max(1, safePage - Math.floor(maxButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxButtons - 1)
    startPage = Math.max(1, endPage - maxButtons + 1)
    for (let i = startPage; i <= endPage; i++) pages.push(i)
    return pages
  })()

  const allPageSelected = pageItems.length > 0 && pageItems.every((p) => selected.has(p.id))

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allPageSelected) {
        pageItems.forEach((p) => next.delete(p.id))
      } else {
        pageItems.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateStatus = async (id: string, status: ProductStatus) => {
    try {
      const res = await apiFetch(`/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast('Status yeniləndi')
      onRefresh()
    } catch {
      toast('Status yenilənmədi', 'error')
    }
    setStatusMenu(null)
  }

  const handleBulk = async (action: 'active' | 'deactive' | 'delete', ids: string[]) => {
    try {
      const res = await apiFetch('/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(
        action === 'delete'
          ? 'Seçilmiş məhsullar silindi'
          : action === 'active'
            ? 'Seçilmiş məhsullar aktiv edildi'
            : 'Seçilmiş məhsullar deaktiv edildi'
      )
      setSelected(new Set())
      onRefresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Əməliyyat uğursuz', 'error')
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      const res = await apiFetch(`/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xəta')
      toast('Məhsul silindi')
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      onRefresh()
    } catch {
      toast('Məhsul silinmədi', 'error')
    }
  }

  const deleteReview = async (reviewId: string) => {
    try {
      const res = await apiFetch(`/admin/reviews/${reviewId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xəta')
      toast('Rəy silindi')
      setReviewsRefreshKey((k) => k + 1)
      onRefresh()
    } catch {
      toast('Rəy silinmədi', 'error')
    }
  }

  const handleConfirm = async () => {
    if (!confirm) return
    if (confirm.kind === 'delete-product') {
      await deleteProduct(confirm.id)
    } else if (confirm.kind === 'bulk') {
      await handleBulk(confirm.action, confirm.ids)
    } else if (confirm.kind === 'delete-review') {
      await deleteReview(confirm.reviewId)
    }
    setConfirm(null)
  }

  const confirmMessage = (() => {
    if (!confirm) return ''
    if (confirm.kind === 'bulk' && confirm.action === 'active') {
      return 'Seçilmiş məhsulları aktiv etmək istədiyinizə əminsiniz?'
    }
    if (confirm.kind === 'bulk' && confirm.action === 'deactive') {
      return 'Seçilmiş məhsulları deaktiv etmək istədiyinizə əminsiniz?'
    }
    return 'Bu elementi silmək istədiyinizə əminsiniz?'
  })()

  const confirmDanger = !confirm || confirm.kind === 'delete-product' || (confirm.kind === 'bulk' && confirm.action === 'delete')

  const hasActiveFilters = Boolean(search || filterCategory || minPrice || maxPrice || filterStatus)
  const activeFilterCount = [filterCategory, minPrice, maxPrice, filterStatus].filter(Boolean).length

  const resetFilters = () => {
    setSearch('')
    setFilterCategory('')
    setMinPrice('')
    setMaxPrice('')
    setFilterStatus('')
    setPage(1)
  }

  // Close the status popover on scroll / resize / Escape
  useEffect(() => {
    if (!statusMenu) return
    const close = () => setStatusMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStatusMenu(null)
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [statusMenu])

  const statusMenuCurrent = statusMenu ? pageItems.find((p) => p.id === statusMenu.id)?.status : undefined

  return (
    <div className="relative">
      <div className="relative">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brown-300">Məhsullar</h2>
            <p className="text-sm text-brown-100/70 mt-1">Məhsulları idarə et, əlavə et və izlə</p>
          </div>
          <button
            type="button"
            onClick={() => setFormProduct('create')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium shadow-sm hover:bg-brown-400 hover:shadow-md active:scale-[0.98] transition-all shrink-0"
          >
            <Plus size={18} />
            Yeni məhsul
          </button>
        </div>

        {/* Search + Filters */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-100/50 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Ad və ya qiymət ilə axtar..."
              className="w-full h-11 pl-10 pr-9 rounded-xl border border-sand-200/70 bg-white text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/40 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-brown-100/50 hover:text-brown-300 hover:bg-sand-200/50 transition-colors"
                aria-label="Axtarışı təmizlə"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-colors shrink-0 ${
              showFilters || activeFilterCount > 0
                ? 'border-brown-300/40 bg-brown-300/5 text-brown-300'
                : 'border-sand-200/70 bg-white text-brown-100 hover:bg-sand-200/30 hover:text-brown-300'
            }`}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtrlər</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-brown-300 text-cream-50 text-[10px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="shrink-0 inline-flex items-center p-1 h-11 rounded-xl border border-sand-200/70 bg-white gap-1">
            <button
              type="button"
              onClick={() => setView('list')}
              title="Cədvəl görünüşü"
              aria-label="Cədvəl görünüşü"
              aria-pressed={view === 'list'}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors ${
                view === 'list' ? 'bg-brown-300 text-cream-50' : 'text-brown-100/70 hover:bg-sand-200/50 hover:text-brown-300'
              }`}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setView('grid')}
              title="Kart görünüşü"
              aria-label="Kart görünüşü"
              aria-pressed={view === 'grid'}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors ${
                view === 'grid' ? 'bg-brown-300 text-cream-50' : 'text-brown-100/70 hover:bg-sand-200/50 hover:text-brown-300'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="mb-4 rounded-2xl border border-sand-200/70 bg-white p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-brown-100/70 mb-1.5">Kateqoriya</label>
                <select
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value)
                    setPage(1)
                  }}
                  className={`${modernSelectClassName} w-full`}
                  style={selectChevronStyle}
                >
                  <option value="">Hamısı</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brown-100/70 mb-1.5">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value)
                    setPage(1)
                  }}
                  className={`${modernSelectClassName} w-full`}
                  style={selectChevronStyle}
                >
                  <option value="">Hamısı</option>
                  {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brown-100/70 mb-1.5">Min qiymət</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value)
                    setPage(1)
                  }}
                  placeholder="0 ₼"
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brown-100/70 mb-1.5">Max qiymət</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value)
                    setPage(1)
                  }}
                  placeholder="∞ ₼"
                  className={fieldClassName}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brown-100 hover:bg-sand-200/40 hover:text-brown-300 transition-colors"
                >
                  <RotateCcw size={13} />
                  Filtrləri sıfırla
                </button>
              </div>
            )}
          </div>
        )}

        {/* Count */}
        <p className="text-sm text-brown-100/70 mb-3">
          <span className="font-semibold text-brown-300">{total}</span> məhsul
          {hasActiveFilters && total !== products.length && (
            <span className="text-brown-100/50"> · {products.length} arasından</span>
          )}
        </p>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-brown-300/[0.03] border border-brown-300/15">
            <span className="inline-flex items-center gap-1.5 text-sm text-brown-300 font-medium mr-1">
              <span className="w-6 h-6 rounded-full bg-brown-300 text-cream-50 text-xs flex items-center justify-center">
                {selected.size}
              </span>
              seçildi
            </span>
            <button
              type="button"
              onClick={() =>
                setConfirm({ kind: 'bulk', action: 'active', ids: Array.from(selected) })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-sage/20 text-brown-200 hover:bg-accent-sage/30 transition-colors"
            >
              Toplu Aktiv
            </button>
            <button
              type="button"
              onClick={() =>
                setConfirm({ kind: 'bulk', action: 'deactive', ids: Array.from(selected) })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-200/80 text-brown-100 hover:bg-sand-200 transition-colors"
            >
              Toplu Deaktiv
            </button>
            <button
              type="button"
              onClick={() =>
                setConfirm({ kind: 'bulk', action: 'delete', ids: Array.from(selected) })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Toplu Sil
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs text-brown-100 hover:bg-sand-200/50 transition-colors"
            >
              Seçimi ləğv et
            </button>
          </div>
        )}

        {/* Table / Grid */}
        <div className="rounded-2xl border border-sand-200/70 bg-white shadow-[0_1px_3px_rgba(74,61,50,0.05)] overflow-hidden">
          {view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left">
              <thead>
                <tr className="border-b border-sand-200/70 bg-sand-200/25">
                  <th className="px-3 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-sand-300 text-brown-300 focus:ring-brown-300/30 cursor-pointer"
                      aria-label="Hamısını seç"
                    />
                  </th>
                  <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 w-10">#</th>
                  <th className="px-3 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Şəkil</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    <SortHeader label="Ad" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    <SortHeader label="Kateqoriya" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    <SortHeader label="Qiymət" field="price" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Status</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    <SortHeader label="Yaradılıb" field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    <SortHeader label="Yenilənib" field="updatedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-brown-100/60">
                        <div className="w-14 h-14 rounded-2xl bg-sand-200/40 flex items-center justify-center">
                          <Package size={24} className="text-sand-400" />
                        </div>
                        <p className="text-sm">Məhsul tapılmadı</p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="text-xs text-accent-rose hover:underline"
                          >
                            Filtrləri sıfırla
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={`border-b border-sand-200/40 last:border-0 transition-colors ${
                        selected.has(p.id) ? 'bg-brown-300/[0.04]' : 'hover:bg-cream-100/70'
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-sand-300 text-brown-300 focus:ring-brown-300/30 cursor-pointer"
                          aria-label={`${p.name} seç`}
                        />
                      </td>
                      <td className="px-3 py-3 text-xs text-brown-100/50 tabular-nums">{start + idx + 1}</td>
                      <td className="px-3 py-3">
                        {p.images?.[0] ? (
                          <button type="button" onClick={() => setLightboxSrc(p.images![0])} className="block cursor-zoom-in">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.images[0]}
                              alt=""
                              className="w-11 h-11 rounded-xl object-cover border border-sand-200/60 hover:ring-2 hover:ring-brown-300/25 transition-shadow"
                            />
                          </button>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-sand-200/40 flex items-center justify-center text-sand-400">
                            <Package size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-brown-300 text-sm">{p.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-brown-100">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-brown-300 whitespace-nowrap tabular-nums">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect()
                            setStatusMenu(
                              statusMenu?.id === p.id
                                ? null
                                : { id: p.id, top: r.bottom + 6, left: r.left }
                            )
                          }}
                          className={`group inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium ring-1 transition-colors ${STATUS_STYLES[p.status].pill}`}
                          title="Status dəyiş"
                          aria-haspopup="menu"
                          aria-expanded={statusMenu?.id === p.id}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[p.status].dot}`} />
                          {STATUS_LABELS[p.status]}
                          <ChevronDown size={12} className="opacity-50 group-hover:opacity-90 transition-opacity" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-brown-100 whitespace-nowrap tabular-nums">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-brown-100 whitespace-nowrap tabular-nums">{formatDate(p.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => setViewProduct(p)}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
                            title="Bax"
                            aria-label="Məhsula bax"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormProduct(p)}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
                            title="Redaktə et"
                            aria-label="Məhsulu redaktə et"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewsProduct(p)}
                            className="relative w-9 h-9 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
                            title="Rəylər"
                            aria-label="Rəylərə bax"
                          >
                            <MessageSquare size={16} />
                            {(p.reviewCount ?? 0) > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5 inline-flex items-center justify-center rounded-full bg-brown-300 text-cream-50 text-[9px] font-semibold leading-none">
                                {p.reviewCount}
                              </span>
                            )}
                          </button>
                          <Link
                            href={`/mehsullar/${p.slug}`}
                            target="_blank"
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors"
                            title="Saytda aç"
                            aria-label="Saytda aç"
                          >
                            <ExternalLink size={16} />
                          </Link>
                          <span className="mx-0.5 w-px h-5 bg-sand-200/70" />
                          <button
                            type="button"
                            onClick={() => setConfirm({ kind: 'delete-product', id: p.id })}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-brown-100/50 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Sil"
                            aria-label="Məhsulu sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          ) : pageItems.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="flex flex-col items-center gap-3 text-brown-100/60">
                <div className="w-14 h-14 rounded-2xl bg-sand-200/40 flex items-center justify-center">
                  <Package size={24} className="text-sand-400" />
                </div>
                <p className="text-sm">Məhsul tapılmadı</p>
                {hasActiveFilters && (
                  <button type="button" onClick={resetFilters} className="text-xs text-accent-rose hover:underline">
                    Filtrləri sıfırla
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
              {pageItems.map((p, idx) => (
                <div
                  key={p.id}
                  className={`relative rounded-xl border p-3 flex flex-col gap-3 transition-shadow hover:shadow-sm ${
                    selected.has(p.id) ? 'border-brown-300/40 bg-brown-300/[0.03]' : 'border-sand-200/60 bg-white'
                  }`}
                >
                  <div className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-sand-300 text-brown-300 focus:ring-brown-300/30 cursor-pointer bg-white/90"
                        aria-label={`${p.name} seç`}
                      />
                    </div>
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          const r = e.currentTarget.getBoundingClientRect()
                          setStatusMenu(
                            statusMenu?.id === p.id ? null : { id: p.id, top: r.bottom + 6, left: Math.max(8, r.right - 168) }
                          )
                        }}
                        className={`group inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-[11px] font-medium ring-1 backdrop-blur transition-colors ${STATUS_STYLES[p.status].pill}`}
                        title="Status dəyiş"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[p.status].dot}`} />
                        {STATUS_LABELS[p.status]}
                        <ChevronDown size={12} className="opacity-50 group-hover:opacity-90" />
                      </button>
                    </div>
                    {p.images?.[0] ? (
                      <button type="button" onClick={() => setLightboxSrc(p.images![0])} className="block w-full cursor-zoom-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images[0]} alt="" className="w-full aspect-square rounded-lg object-cover border border-sand-200/60" />
                      </button>
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-sand-200/40 flex items-center justify-center text-sand-400">
                        <Package size={28} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-medium text-brown-300 text-sm truncate">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-brown-100/70">
                      <span className="truncate">{p.category?.name || '—'}</span>
                      <span className="text-brown-100/30">·</span>
                      <span className="font-semibold text-brown-300 tabular-nums">{formatPrice(p.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-sand-200/50">
                    <span className="text-[11px] text-brown-100/40 tabular-nums">#{start + idx + 1}</span>
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => setViewProduct(p)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors" title="Bax" aria-label="Bax">
                        <Eye size={15} />
                      </button>
                      <button type="button" onClick={() => setFormProduct(p)} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors" title="Redaktə et" aria-label="Redaktə et">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => setReviewsProduct(p)} className="relative w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors" title="Rəylər" aria-label="Rəylər">
                        <MessageSquare size={15} />
                        {(p.reviewCount ?? 0) > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 inline-flex items-center justify-center rounded-full bg-brown-300 text-cream-50 text-[9px] font-semibold leading-none">
                            {p.reviewCount}
                          </span>
                        )}
                      </button>
                      <Link href={`/mehsullar/${p.slug}`} target="_blank" className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors" title="Saytda aç" aria-label="Saytda aç">
                        <ExternalLink size={15} />
                      </Link>
                      <button type="button" onClick={() => setConfirm({ kind: 'delete-product', id: p.id })} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-brown-100/50 hover:bg-red-50 hover:text-red-500 transition-colors" title="Sil" aria-label="Sil">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-sand-200/60 bg-cream-50/60">
            <div className="flex items-center gap-2 text-sm text-brown-100">
              <span className="text-brown-100/70">Səhifədə:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className={`${glassSelect} !w-auto !h-9 py-1.5 !pl-3 !pr-8`}
                style={selectChevronStyle}
                aria-label="Səhifə ölçüsü"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-lg text-sm text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Əvvəl</span>
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                    n === safePage
                      ? 'bg-brown-300 text-cream-50 shadow-sm'
                      : 'text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="inline-flex items-center gap-1 px-3 h-9 rounded-lg text-sm text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <span className="hidden sm:inline">Sonra</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status change popover (fixed, avoids table clipping) */}
      {statusMenu && (
        <>
          <button
            type="button"
            aria-label="Bağla"
            className="fixed inset-0 z-[90]"
            onClick={() => setStatusMenu(null)}
          />
          <div
            role="menu"
            className="fixed z-[95] min-w-[168px] p-1.5 rounded-xl bg-cream-50/95 backdrop-blur-md border border-sand-200/70 shadow-xl"
            style={{ top: statusMenu.top, left: statusMenu.left }}
          >
            <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-brown-100/50">
              Status seç
            </p>
            {STATUS_CYCLE.map((s) => {
              const isCur = statusMenuCurrent === s
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => updateStatus(statusMenu.id, s)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    isCur ? 'bg-sand-200/50 text-brown-300 font-medium' : 'text-brown-200 hover:bg-sand-200/40'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[s].dot}`} />
                  <span className="flex-1 text-left">{STATUS_LABELS[s]}</span>
                  {isCur && <Check size={14} className="text-accent-sage" />}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Modals */}
      {formProduct !== null && (
        <ProductFormModal
          product={formProduct === 'create' ? null : formProduct}
          categories={categories}
          onClose={() => setFormProduct(null)}
          onSaved={onRefresh}
        />
      )}

      {viewProduct && (
        <ProductViewModal product={viewProduct} onClose={() => setViewProduct(null)} />
      )}

      {reviewsProduct && (
        <ProductReviewsModal
          product={reviewsProduct}
          reviewsRefreshKey={reviewsRefreshKey}
          onClose={() => setReviewsProduct(null)}
          onRefresh={onRefresh}
          onConfirmDeleteReview={(reviewId, productId) =>
            setConfirm({ kind: 'delete-review', reviewId, productId })
          }
        />
      )}

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt="" onClose={() => setLightboxSrc(null)} />
      )}

      <ConfirmModal
        open={confirm !== null}
        message={confirmMessage}
        confirmLabel={confirm?.kind === 'bulk' && confirm.action !== 'delete' ? 'Təsdiq et' : 'Sil'}
        danger={confirmDanger}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
