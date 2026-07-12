'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Trash2, ShoppingBag, Package, Phone, MapPin } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { ConfirmModal } from './ConfirmModal'
import { useToast } from './Toast'
import {
  PageHeader,
  SearchInput,
  AdminModal,
  IconButton,
  Card,
  EmptyState,
  modernSelectClassName,
  selectChevronStyle,
} from './ui'

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  name: string
  price: number
  qty: number
}

interface Order {
  id: string
  customerName: string
  phone: string
  address: string | null
  note: string | null
  subtotal: number
  discountCode: string | null
  discountAmount: number
  total: number
  status: string
  createdAt: string
  items: OrderItem[]
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Gözləyir' },
  { value: 'confirmed', label: 'Təsdiqlənib' },
  { value: 'shipped', label: 'Göndərilib' },
  { value: 'delivered', label: 'Çatdırılıb' },
  { value: 'cancelled', label: 'Ləğv edilib' },
]

// Status pill palette: neutral text + colored dot for AA contrast (mirrors ProductsAdmin STATUS_STYLES)
const STATUS_STYLES: Record<OrderStatus, { label: string; pill: string; dot: string }> = {
  pending: { label: 'Gözləyir', pill: 'bg-amber-400/15 text-brown-200 ring-amber-400/40', dot: 'bg-amber-400' },
  confirmed: { label: 'Təsdiqlənib', pill: 'bg-accent-rose/15 text-brown-200 ring-accent-rose/35', dot: 'bg-accent-rose' },
  shipped: { label: 'Göndərilib', pill: 'bg-sand-400/25 text-brown-200 ring-sand-400/45', dot: 'bg-sand-400' },
  delivered: { label: 'Çatdırılıb', pill: 'bg-accent-sage/15 text-brown-200 ring-accent-sage/35', dot: 'bg-accent-sage' },
  cancelled: { label: 'Ləğv edilib', pill: 'bg-red-500/10 text-brown-100/70 ring-red-500/25', dot: 'bg-red-400' },
}

const FALLBACK_STYLE = { label: 'Naməlum', pill: 'bg-sand-200/60 text-brown-200 ring-sand-300/50', dot: 'bg-sand-400' }

function statusMeta(status: string) {
  return STATUS_STYLES[status as OrderStatus] ?? FALLBACK_STYLE
}

function formatDate(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('az-AZ')
}

function manat(value: number): string {
  return `${value.toFixed(2)} ₼`
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 whitespace-nowrap ${meta.pill}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

export function OrdersAdmin() {
  const { toast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)

  const load = useCallback(async () => {
    setError(false)
    try {
      const res = await apiFetch('/admin/orders')
      if (!res.ok) throw new Error('Xəta')
      const data: { orders?: Order[] } = await res.json()
      setOrders(Array.isArray(data.orders) ? data.orders : [])
    } catch {
      setError(true)
      toast('Sifarişlər yüklənmədi', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (!q) return true
      return o.customerName.toLowerCase().includes(q) || o.phone.toLowerCase().includes(q)
    })
  }, [orders, search, statusFilter])

  const viewing = useMemo(() => orders.find((o) => o.id === viewingId) ?? null, [orders, viewingId])

  const totalRevenue = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0),
    [orders]
  )

  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (order.status === status) return
    try {
      const res = await apiFetch(`/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast('Status yeniləndi')
      await load()
    } catch {
      toast('Status dəyişmədi', 'error')
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/orders/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xəta')
      toast('Sifariş silindi')
      if (viewingId === deleteTarget.id) setViewingId(null)
      await load()
    } catch {
      toast('Sifariş silinmədi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader title="Sifarişlər" subtitle="Müştəri sifarişlərini idarə et" />

      <div className="grid grid-cols-2 gap-3 mb-5 sm:max-w-md">
        <div className="rounded-2xl border border-sand-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(74,61,50,0.05)]">
          <div className="flex items-center gap-2 text-brown-100/60 mb-1">
            <ShoppingBag size={15} />
            <p className="text-[11px] uppercase tracking-wide">Sifariş sayı</p>
          </div>
          <p className="text-xl font-semibold text-brown-300 tabular-nums">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-sand-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(74,61,50,0.05)]">
          <div className="flex items-center gap-2 text-brown-100/60 mb-1">
            <Package size={15} />
            <p className="text-[11px] uppercase tracking-wide">Ümumi dövriyyə</p>
          </div>
          <p className="text-xl font-semibold text-brown-300 tabular-nums">{manat(totalRevenue)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Ad və ya telefon axtar..."
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
          className={`${modernSelectClassName} sm:w-56`}
          style={selectChevronStyle}
          aria-label="Statusa görə filtr"
        >
          <option value="all">Hamısı</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-200/25">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Müştəri</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Məhsullar</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Cəm</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Status</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Tarix</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 text-right">
                  Əməliyyat
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-brown-100/60">
                    Yüklənir...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm">
                    <p className="text-brown-100/70 mb-3">Sifarişlər yüklənmədi</p>
                    <button
                      type="button"
                      onClick={load}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40 transition-colors"
                    >
                      Yenidən cəhd et
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4">
                    <EmptyState icon={<ShoppingBag size={24} />} title="Sifariş yoxdur" />
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-medium text-brown-300">{o.customerName}</span>
                      <a
                        href={`tel:${o.phone}`}
                        className="block text-xs text-brown-100/60 hover:text-brown-300 hover:underline"
                      >
                        {o.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-brown-100">
                      {o.items.length} məhsul
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-brown-300 tabular-nums">
                      {manat(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} />
                        <select
                          value={o.status}
                          onChange={(e) => changeStatus(o, e.target.value as OrderStatus)}
                          className="appearance-none rounded-lg border border-sand-200/70 bg-white px-2 py-1 text-xs text-brown-300 cursor-pointer hover:border-brown-300/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20"
                          aria-label="Statusu dəyiş"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-brown-100">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton onClick={() => setViewingId(o.id)} title="Bax" aria-label="Sifarişə bax">
                          <Eye size={16} />
                        </IconButton>
                        <IconButton danger onClick={() => setDeleteTarget(o)} title="Sil" aria-label="Sifarişi sil">
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {viewing && (
        <AdminModal title="Sifariş detalları" onClose={() => setViewingId(null)} wide>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-cream-100 border border-sand-200/60">
              <div className="space-y-1.5">
                <p className="font-serif text-lg font-semibold text-brown-300">{viewing.customerName}</p>
                <a
                  href={`tel:${viewing.phone}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brown-200 hover:text-brown-300 hover:underline"
                >
                  <Phone size={14} />
                  {viewing.phone}
                </a>
                {viewing.address && (
                  <p className="flex items-start gap-1.5 text-sm text-brown-100/80">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    {viewing.address}
                  </p>
                )}
              </div>
              <StatusBadge status={viewing.status} />
            </div>

            {viewing.note && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-brown-100/60 mb-1.5">Qeyd</p>
                <p className="text-sm text-brown-200 leading-relaxed whitespace-pre-wrap rounded-xl border border-sand-200/70 bg-white p-3">
                  {viewing.note}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] uppercase tracking-wide text-brown-100/60 mb-1.5">Məhsullar</p>
              <div className="overflow-x-auto rounded-xl border border-sand-200/70">
                <table className="w-full min-w-[380px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-sand-200/60 bg-sand-200/25">
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-brown-100/60">Məhsul</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-brown-100/60 text-right">Qiymət</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-brown-100/60 text-right">Say</th>
                      <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-brown-100/60 text-right">Cəm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.items.map((item, i) => (
                      <tr key={i} className="border-b border-sand-200/40 last:border-0">
                        <td className="px-3 py-2 text-brown-300">{item.name}</td>
                        <td className="px-3 py-2 text-right text-brown-100 tabular-nums whitespace-nowrap">{manat(item.price)}</td>
                        <td className="px-3 py-2 text-right text-brown-100 tabular-nums">{item.qty}</td>
                        <td className="px-3 py-2 text-right text-brown-300 font-medium tabular-nums whitespace-nowrap">
                          {manat(item.price * item.qty)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2 text-sm rounded-xl border border-sand-200/70 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-brown-100/70">Ara cəm</span>
                <span className="text-brown-300 tabular-nums">{manat(viewing.subtotal)}</span>
              </div>
              {viewing.discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-brown-100/70">Endirim</span>
                  <span className="text-accent-rose tabular-nums whitespace-nowrap">
                    {viewing.discountCode ? `${viewing.discountCode}: ` : ''}−{manat(viewing.discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-sand-200/60">
                <span className="font-semibold text-brown-300">Yekun</span>
                <span className="font-semibold text-brown-300 tabular-nums">{manat(viewing.total)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-brown-100/70">Tarix</span>
              <span className="text-brown-300 font-medium">{formatDate(viewing.createdAt)}</span>
            </div>
          </div>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu sifarişi silmək istədiyinizə əminsiniz?"
        onConfirm={performDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
