'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, ExternalLink, MessageSquare, Trash2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from './Toast'
import { ConfirmModal } from './ConfirmModal'
import {
  PageHeader,
  SearchInput,
  IconButton,
  Card,
  EmptyState,
  modernSelectClassName,
  selectChevronStyle,
} from './ui'
import { RatingStars } from '../reviews/RatingStars'
import { ReviewImages } from '../reviews/ImageLightbox'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type Filter = ReviewStatus | 'all'

interface AdminReview {
  id: string
  authorName: string
  rating: number
  comment: string
  images: string[]
  status: ReviewStatus
  createdAt: string
  product: { name: string; slug: string }
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Gözləmədə',
  approved: 'Təsdiqlənib',
  rejected: 'Rədd edilib',
}

const STATUS_STYLES: Record<ReviewStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-accent-sage/15 text-accent-sage',
  rejected: 'bg-red-50 text-red-600',
}

const FILTERS: Filter[] = ['pending', 'approved', 'rejected', 'all']
const PAGE_SIZES = [10, 20, 50]

/** Up to 5 page buttons centred on the current page. */
function visiblePages(page: number, totalPages: number) {
  const maxButtons = 5
  let start = Math.max(1, page - Math.floor(maxButtons / 2))
  const end = Math.min(totalPages, start + maxButtons - 1)
  start = Math.max(1, end - maxButtons + 1)
  const pages: number[] = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ReviewsAdmin({ onPendingChange }: { onPendingChange?: (count: number) => void }) {
  const { toast } = useToast()
  const [filter, setFilter] = useState<Filter>('pending')
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [counts, setCounts] = useState<Record<ReviewStatus, number>>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])
  const [total, setTotal] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null)

  // Search runs on the server; wait until typing pauses.
  useEffect(() => {
    const next = search.trim()
    if (next === query) return
    const t = window.setTimeout(() => {
      setQuery(next)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [search, query])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filter !== 'all') params.set('status', filter)
      if (query) params.set('q', query)
      const res = await apiFetch(`/admin/reviews?${params}`)
      const data = await res.json()
      const nextTotal: number = data.total ?? 0
      // The last item of the last page was approved / rejected / deleted: step back a page.
      const lastPage = Math.max(1, Math.ceil(nextTotal / pageSize))
      if (page > lastPage) {
        setPage(lastPage)
        return
      }
      setReviews(data.reviews || [])
      setTotal(nextTotal)
      if (data.counts) {
        setCounts(data.counts)
        onPendingChange?.(data.counts.pending)
      }
    } catch {
      toast('Rəylər yüklənmədi', 'error')
    } finally {
      setLoading(false)
    }
  }, [filter, query, page, pageSize, toast, onPendingChange])

  useEffect(() => {
    load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const setStatus = async (r: AdminReview, status: ReviewStatus) => {
    setBusyId(r.id)
    try {
      const res = await apiFetch(`/admin/reviews/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(status === 'approved' ? 'Rəy təsdiqləndi' : 'Rəy rədd edildi')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/reviews/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast('Rəy silindi')
      await load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const statusTotal = counts.pending + counts.approved + counts.rejected

  return (
    <div>
      <PageHeader
        title="Məhsul rəyləri"
        subtitle="Mətn və ya şəkil olan rəylər təsdiqdən sonra saytda görünür. Yalnız ulduz olan rəylər avtomatik təsdiqlənir."
      />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Ad, mətn və ya məhsul ilə axtar..."
          className="flex-1"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
              className={`px-3 h-9 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brown-300 text-cream-50'
                  : 'bg-white border border-sand-200/70 text-brown-100 hover:bg-sand-200/40'
              }`}
            >
              {f === 'all' ? 'Hamısı' : STATUS_LABELS[f]}
              <span className="ml-1.5 opacity-60 tabular-nums">{f === 'all' ? statusTotal : counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading && reviews.length === 0 ? (
          <p className="text-sm text-brown-100/60 py-12 text-center">Yüklənir...</p>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={24} />}
            title={filter === 'pending' && !query ? 'Təsdiq gözləyən rəy yoxdur' : 'Rəy tapılmadı'}
          />
        ) : (
          <ul className={`divide-y divide-sand-200/50 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {reviews.map((r) => (
              <li key={r.id} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-brown-300">{r.authorName || 'Anonim'}</span>
                      <RatingStars value={r.rating} size={14} />
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}
                      >
                        {STATUS_LABELS[r.status]}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-brown-100/60">
                      {r.product.slug ? (
                        <Link
                          href={`/mehsullar/${r.product.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-accent-rose hover:underline"
                        >
                          {r.product.name}
                          <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <span>{r.product.name}</span>
                      )}
                      <span>{formatDate(r.createdAt)}</span>
                    </div>
                    {r.comment ? (
                      <p className="mt-2 text-sm text-brown-100/90 leading-relaxed whitespace-pre-line">{r.comment}</p>
                    ) : (
                      r.images.length === 0 && (
                        <p className="mt-2 text-xs italic text-brown-100/50">Yalnız ulduz</p>
                      )
                    )}
                    {r.images.length > 0 && (
                      <div className="mt-3">
                        <ReviewImages images={r.images} size={56} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r, 'approved')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-accent-sage text-cream-50 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        <Check size={15} />
                        Təsdiqlə
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r, 'rejected')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-sand-200/70 bg-white text-sm font-medium text-brown-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
                      >
                        <X size={15} />
                        Rədd et
                      </button>
                    )}
                    <IconButton danger onClick={() => setDeleteTarget(r)} aria-label="Sil" title="Sil">
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {total > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-sand-200/60 bg-cream-50/60 rounded-b-2xl">
            <div className="flex items-center gap-3 text-sm text-brown-100">
              <span className="text-brown-100/70">Səhifədə:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className={`${modernSelectClassName} !w-auto !h-9 !py-1 !pl-3 !pr-8`}
                style={selectChevronStyle}
                aria-label="Səhifə ölçüsü"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-brown-100/70 tabular-nums">
                {from}–{to} / {total}
              </span>
            </div>

            {totalPages > 1 && (
              <nav className="flex items-center gap-1" aria-label="Səhifələr">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="inline-flex items-center gap-1 px-3 h-9 rounded-lg text-sm text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Əvvəl</span>
                </button>
                {visiblePages(page, totalPages).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    aria-current={n === page ? 'page' : undefined}
                    className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                      n === page
                        ? 'bg-brown-300 text-cream-50 shadow-sm'
                        : 'text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="inline-flex items-center gap-1 px-3 h-9 rounded-lg text-sm text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  <span className="hidden sm:inline">Sonra</span>
                  <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </div>
        )}
      </Card>

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu rəyi silmək istədiyinizə əminsiniz? Şəkilləri də silinəcək."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
