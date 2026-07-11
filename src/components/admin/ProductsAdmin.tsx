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
  MoreVertical,
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

function statusBadgeClass(status: ProductStatus) {
  switch (status) {
    case 'draft':
      return 'bg-sand-200/80 text-brown-100'
    case 'active':
      return 'bg-accent-sage/20 text-accent-sage'
    case 'deactive':
      return 'bg-brown-100/10 text-brown-100/60'
  }
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

function ReviewViewModal({ review, onClose }: { review: Review; onClose: () => void }) {
  return (
    <AdminModal title="Rəy detalları" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-brown-100/60 mb-0.5">Müştəri</p>
          <p className="text-sm font-medium text-brown-300">{review.authorName}</p>
        </div>
        <div>
          <p className="text-xs text-brown-100/60 mb-0.5">Saç tipi</p>
          <p className="text-sm text-brown-300">{getHairTypeLabel(review.hairType)}</p>
        </div>
        <div>
          <p className="text-xs text-brown-100/60 mb-0.5">Reytinq</p>
          <p className="text-sm text-brown-300">{review.rating} / 5</p>
        </div>
        <div>
          <p className="text-xs text-brown-100/60 mb-0.5">Rəy mətni</p>
          <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{review.comment}</p>
        </div>
        {review.createdAt && (
          <div>
            <p className="text-xs text-brown-100/60 mb-0.5">Tarix</p>
            <p className="text-sm text-brown-300">{formatDate(review.createdAt)}</p>
          </div>
        )}
      </div>
    </AdminModal>
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

function ProductViewModal({
  product,
  scrollToReviews,
  reviewsRefreshKey,
  onClose,
  onRefresh,
  onEdit,
  onConfirmDeleteReview,
}: {
  product: Product
  scrollToReviews?: boolean
  reviewsRefreshKey?: number
  onClose: () => void
  onRefresh: () => void
  onEdit: () => void
  onConfirmDeleteReview: (reviewId: string, productId: string) => void
}) {
  const reviewsRef = useRef<HTMLDivElement>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [visitorsOpen, setVisitorsOpen] = useState(false)
  const [reviewModal, setReviewModal] = useState<
    null | { kind: 'view'; review: Review } | { kind: 'add' } | { kind: 'edit'; review: Review }
  >(null)

  const loadReviews = useCallback(() => {
    setLoadingReviews(true)
    apiFetch(`/admin/products/${product.id}/reviews`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews || []))
      .finally(() => setLoadingReviews(false))
  }, [product.id])

  useEffect(() => {
    loadReviews()
  }, [loadReviews, reviewsRefreshKey])

  useEffect(() => {
    if (scrollToReviews && !loadingReviews && reviewsRef.current) {
      reviewsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [scrollToReviews, loadingReviews])

  const img = product.images?.[0]

  return (
    <>
      <AdminModal title={product.name} onClose={onClose} wide>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <button
              type="button"
              onClick={() => img && setLightboxSrc(img)}
              className="w-full sm:w-48 h-48 rounded-2xl overflow-hidden bg-sand-200/30 border border-sand-200/50 shrink-0 hover:ring-2 hover:ring-brown-300/20 transition-shadow"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sand-400 text-sm">Şəkil yoxdur</div>
              )}
            </button>
            <div className="flex-1 min-w-0 space-y-3">
              {product.category?.name && (
                <span className="inline-block text-xs font-medium text-accent-rose">{product.category.name}</span>
              )}
              <h4 className="font-serif text-2xl font-medium text-brown-300">{product.name}</h4>
              <p className="text-2xl font-medium text-brown-300">{formatPrice(product.price)}</p>
              <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${statusBadgeClass(product.status)}`}>
                {STATUS_LABELS[product.status]}
              </span>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="text-sm text-brown-100">
                  <span className="text-brown-100/60">Baxış: </span>
                  <span className="font-medium text-brown-300">{product.totalViews ?? 0}</span>
                </div>
                <div className="text-sm text-brown-100">
                  <span className="text-brown-100/60">Unikal: </span>
                  <span className="font-medium text-brown-300">{product.uniqueViews ?? 0}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVisitorsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-sand-200 text-brown-100 hover:bg-sand-200/40"
                >
                  <Eye size={14} />
                  Ziyarətçilər
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brown-300 text-cream-50 hover:bg-brown-400"
                >
                  <Pencil size={14} />
                  Redaktə et
                </button>
              </div>
            </div>
          </div>

          <section>
            <h5 className="text-sm font-medium text-brown-300 mb-1.5">Təsvir</h5>
            <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{product.description || '—'}</p>
          </section>

          {product.ingredients && (
            <section>
              <h5 className="text-sm font-medium text-brown-300 mb-1.5">Tərkibi</h5>
              <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{product.ingredients}</p>
            </section>
          )}

          {product.howToUse && (
            <section>
              <h5 className="text-sm font-medium text-brown-300 mb-1.5">İstifadə qaydası</h5>
              <p className="text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{product.howToUse}</p>
            </section>
          )}

          <section ref={reviewsRef}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h5 className="text-sm font-medium text-brown-300">Rəylər ({reviews.length})</h5>
              <button
                type="button"
                onClick={() => setReviewModal({ kind: 'add' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brown-300 text-cream-50 hover:bg-brown-400"
              >
                <Plus size={14} />
                Rəy əlavə et
              </button>
            </div>

            {loadingReviews ? (
              <p className="text-sm text-brown-100/60">Yüklənir...</p>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-brown-100/60">Rəy yoxdur</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-sand-200/60">
                <table className="w-full text-left text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-sand-200/70 bg-sand-200/20">
                      <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Ad</th>
                      <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Saç tipi</th>
                      <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Reytinq</th>
                      <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70">Rəy</th>
                      <th className="px-3 py-2 text-xs font-semibold uppercase text-brown-100/70 text-right">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id} className="border-b border-sand-200/40 last:border-0 hover:bg-cream-50/80">
                        <td className="px-3 py-2 font-medium text-brown-300">{r.authorName}</td>
                        <td className="px-3 py-2 text-brown-100">{getHairTypeLabel(r.hairType)}</td>
                        <td className="px-3 py-2 text-brown-300">{r.rating}/5</td>
                        <td className="px-3 py-2 text-brown-100 max-w-[200px] truncate">{r.comment}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => setReviewModal({ kind: 'view', review: r })}
                              className="p-1.5 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                              title="Bax"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setReviewModal({ kind: 'edit', review: r })}
                              className="p-1.5 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                              title="Yenilə"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onConfirmDeleteReview(r.id, product.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                              title="Sil"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </AdminModal>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt={product.name} onClose={() => setLightboxSrc(null)} zoomable />
      )}

      {visitorsOpen && <VisitorsModal productId={product.id} onClose={() => setVisitorsOpen(false)} />}

      {reviewModal?.kind === 'view' && (
        <ReviewViewModal review={reviewModal.review} onClose={() => setReviewModal(null)} />
      )}
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
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)

  const [formProduct, setFormProduct] = useState<Product | null | 'create'>(null)
  const [viewState, setViewState] = useState<{ product: Product; scrollToReviews?: boolean } | null>(null)
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
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
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
    setStatusMenuId(null)
  }

  const cycleStatus = (status: ProductStatus): ProductStatus => {
    const idx = STATUS_CYCLE.indexOf(status)
    return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
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

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 p-4 rounded-2xl border border-sand-200/60 bg-cream-100/80">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-100/50 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Ad ilə axtar..."
              className={`${fieldClassName} pl-9`}
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setPage(1)
            }}
            className={modernSelectClassName}
            style={selectChevronStyle}
          >
            <option value="">Bütün kateqoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value)
              setPage(1)
            }}
            placeholder="Min qiymət"
            className={fieldClassName}
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              setPage(1)
            }}
            placeholder="Max qiymət"
            className={fieldClassName}
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            className={modernSelectClassName}
            style={selectChevronStyle}
          >
            <option value="">Bütün statuslar</option>
            {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Header row */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <p className="text-sm text-brown-100/80">
          {total === 0 ? '0 məhsul' : `${from}–${to} / ${total} məhsul`}
        </p>
        <button
          type="button"
          onClick={() => setFormProduct('create')}
          className="flex items-center gap-2 px-4 py-2 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium hover:bg-brown-400 transition-colors"
        >
          <Plus size={18} />
          Yeni məhsul
        </button>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 p-3 rounded-xl bg-brown-300/5 border border-brown-300/15">
          <span className="text-sm text-brown-300 font-medium mr-1">{selected.size} seçildi</span>
          <button
            type="button"
            onClick={() =>
              setConfirm({ kind: 'bulk', action: 'active', ids: Array.from(selected) })
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-sage/20 text-accent-sage hover:bg-accent-sage/30"
          >
            Toplu Aktiv
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirm({ kind: 'bulk', action: 'deactive', ids: Array.from(selected) })
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-200/80 text-brown-100 hover:bg-sand-200"
          >
            Toplu Deaktiv
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirm({ kind: 'bulk', action: 'delete', ids: Array.from(selected) })
            }
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100"
          >
            Toplu Sil
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs text-brown-100 hover:bg-sand-200/50"
          >
            Seçimi ləğv et
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-sand-200/60 bg-cream-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-200/20">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-sand-300 text-brown-300 focus:ring-brown-300/30"
                    aria-label="Hamısını seç"
                  />
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70 w-10">#</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">Şəkil</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">
                  <SortHeader label="Ad" field="name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">
                  <SortHeader label="Kateqoriya" field="category" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">
                  <SortHeader label="Qiymət" field="price" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">
                  <SortHeader label="Yaradılıb" field="createdAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70">
                  <SortHeader label="Yenilənib" field="updatedAt" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-brown-100/70 text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-brown-100/70">
                    Məhsul tapılmadı
                  </td>
                </tr>
              ) : (
                pageItems.map((p, idx) => (
                  <tr key={p.id} className="border-b border-sand-200/40 last:border-0 hover:bg-cream-50/80 transition-colors">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-sand-300 text-brown-300 focus:ring-brown-300/30"
                        aria-label={`${p.name} seç`}
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-brown-100/60">{start + idx + 1}</td>
                    <td className="px-3 py-3">
                      {p.images?.[0] ? (
                        <button type="button" onClick={() => setLightboxSrc(p.images![0])} className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0]}
                            alt=""
                            className="w-11 h-11 rounded-lg object-cover border border-sand-200/60 hover:ring-2 hover:ring-brown-300/20 transition-shadow"
                          />
                        </button>
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-sand-200/40 flex items-center justify-center text-sand-400">
                          <Package size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brown-300 text-sm">{p.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-100">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-brown-300 whitespace-nowrap">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-[11px] px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(p.status)}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-brown-100 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-brown-100 whitespace-nowrap">{formatDate(p.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => setViewState({ product: p })}
                          className="p-2 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                          title="Bax"
                        >
                          <Eye size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormProduct(p)}
                          className="p-2 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                          title="Redaktə et"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewState({ product: p, scrollToReviews: true })}
                          className="p-2 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                          title="Rəylər"
                        >
                          <MessageSquare size={17} />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setStatusMenuId(statusMenuId === p.id ? null : p.id)}
                            className="p-2 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                            title="Status dəyiş"
                          >
                            <MoreVertical size={17} />
                          </button>
                          {statusMenuId === p.id && (
                            <>
                              <button
                                type="button"
                                className="fixed inset-0 z-10"
                                aria-label="Bağla"
                                onClick={() => setStatusMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] py-1 rounded-xl bg-cream-50 border border-sand-200 shadow-lg">
                                {STATUS_CYCLE.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => updateStatus(p.id, s)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brown-300 hover:bg-sand-200/40"
                                  >
                                    {p.status === s && <Check size={14} className="text-accent-sage" />}
                                    <span className={p.status === s ? 'font-medium' : ''}>{STATUS_LABELS[s]}</span>
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => updateStatus(p.id, cycleStatus(p.status))}
                                  className="w-full px-3 py-2 text-xs text-brown-100/70 hover:bg-sand-200/40 border-t border-sand-200/60"
                                >
                                  Növbəti status
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                        <Link
                          href={`/mehsullar/${p.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg text-brown-100 hover:bg-sand-200/50 hover:text-brown-300"
                          title="Saytda aç"
                        >
                          <ExternalLink size={17} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirm({ kind: 'delete-product', id: p.id })}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                          title="Sil"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-sand-200/60 bg-cream-50/50">
          <div className="flex items-center gap-2 text-sm text-brown-100">
            <span className="text-brown-100/70">Səhifədə:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className={`${modernSelectClassName} !w-auto py-1.5 px-2.5`}
              style={selectChevronStyle}
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-brown-100 border border-sand-200 hover:bg-sand-200/40 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft size={16} />
              Əvvəl
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                  n === safePage
                    ? 'bg-brown-300 text-cream-50'
                    : 'text-brown-100 border border-sand-200 hover:bg-sand-200/40'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-brown-100 border border-sand-200 hover:bg-sand-200/40 disabled:opacity-40 disabled:pointer-events-none"
            >
              Sonra
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {formProduct !== null && (
        <ProductFormModal
          product={formProduct === 'create' ? null : formProduct}
          categories={categories}
          onClose={() => setFormProduct(null)}
          onSaved={onRefresh}
        />
      )}

      {viewState && (
        <ProductViewModal
          product={viewState.product}
          scrollToReviews={viewState.scrollToReviews}
          reviewsRefreshKey={reviewsRefreshKey}
          onClose={() => setViewState(null)}
          onRefresh={onRefresh}
          onEdit={() => {
            const p = viewState.product
            setViewState(null)
            setFormProduct(p)
          }}
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
