'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, Trash2, Phone, ClipboardList } from 'lucide-react'
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
  fieldClassName,
  modernSelectClassName,
  selectChevronStyle,
} from './ui'

type ConsultationStatus = 'pending' | 'contacted' | 'done'

interface ConsultationRequest {
  id: string
  name: string
  phone: string
  hairIssue: string
  notes?: string | null
  status: ConsultationStatus
  createdAt?: string
}

const STATUS_OPTIONS: { value: ConsultationStatus; label: string }[] = [
  { value: 'pending', label: 'Gözləyir' },
  { value: 'contacted', label: 'Əlaqə saxlanılıb' },
  { value: 'done', label: 'Tamamlandı' },
]

const STATUS_LABELS: Record<ConsultationStatus, string> = {
  pending: 'Gözləyir',
  contacted: 'Əlaqə saxlanılıb',
  done: 'Tamamlandı',
}

const STATUS_BADGE: Record<ConsultationStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  contacted: 'bg-accent-rose/15 text-accent-rose border-accent-rose/30',
  done: 'bg-accent-sage/20 text-brown-200 border-accent-sage/40',
}

function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('az-AZ')
}

export function ConsultationsAdmin() {
  const { toast } = useToast()

  const [requests, setRequests] = useState<ConsultationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ConsultationStatus>('all')

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ConsultationRequest | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/admin/consultations')
      if (!res.ok) throw new Error('Xəta')
      const data: { requests?: ConsultationRequest[] } = await res.json()
      setRequests(Array.isArray(data.requests) ? data.requests : [])
    } catch {
      toast('Müraciətlər yüklənmədi', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!q) return true
      return r.name.toLowerCase().includes(q) || r.phone.toLowerCase().includes(q)
    })
  }, [requests, search, statusFilter])

  const viewing = useMemo(
    () => requests.find((r) => r.id === viewingId) ?? null,
    [requests, viewingId]
  )

  const changeStatus = async (r: ConsultationRequest, status: ConsultationStatus) => {
    if (r.status === status) return
    try {
      const res = await apiFetch(`/admin/consultations/${r.id}`, {
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

  const openView = (r: ConsultationRequest) => {
    setViewingId(r.id)
    setNotesDraft(r.notes ?? '')
  }

  const saveNotes = async () => {
    if (!viewing) return
    setSavingNotes(true)
    try {
      const res = await apiFetch(`/admin/consultations/${viewing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesDraft }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast('Qeyd saxlanıldı')
      await load()
    } catch {
      toast('Qeyd saxlanılmadı', 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/consultations/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xəta')
      toast('Müraciət silindi')
      if (viewingId === deleteTarget.id) setViewingId(null)
      await load()
    } catch {
      toast('Müraciət silinmədi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader title="Konsultasiyalar" subtitle="Müştəri müraciətlərini idarə et" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Ad və ya telefon axtar..."
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ConsultationStatus)}
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
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-200/25">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Ad</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Telefon</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                  Saç problemi
                </th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4">
                    <EmptyState icon={<ClipboardList size={24} />} title="Müraciət yoxdur" />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-brown-300">{r.name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={`tel:${r.phone}`}
                        className="text-sm text-brown-200 hover:text-brown-300 hover:underline"
                      >
                        {r.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="block truncate text-sm text-brown-100" title={r.hairIssue}>
                        {r.hairIssue}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_BADGE[r.status]}`}
                        >
                          {STATUS_LABELS[r.status]}
                        </span>
                        <select
                          value={r.status}
                          onChange={(e) => changeStatus(r, e.target.value as ConsultationStatus)}
                          className="appearance-none rounded-lg border border-sand-200/70 bg-white px-2 py-1 text-xs text-brown-300 cursor-pointer hover:border-brown-300/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20"
                          aria-label="Statusu dəyiş"
                        >
                          {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-brown-100">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton onClick={() => openView(r)} title="Bax" aria-label="Müraciətə bax">
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          danger
                          onClick={() => setDeleteTarget(r)}
                          title="Sil"
                          aria-label="Müraciəti sil"
                        >
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
        <AdminModal title="Müraciət detalları" onClose={() => setViewingId(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-cream-100 border border-sand-200/60">
              <span className="font-serif text-lg font-semibold text-brown-300">{viewing.name}</span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${STATUS_BADGE[viewing.status]}`}
              >
                {STATUS_LABELS[viewing.status]}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 py-1.5 border-b border-sand-200/50">
                <span className="text-brown-100/70">Telefon</span>
                <a
                  href={`tel:${viewing.phone}`}
                  className="inline-flex items-center gap-1.5 font-medium text-brown-300 hover:underline"
                >
                  <Phone size={14} />
                  {viewing.phone}
                </a>
              </div>
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-brown-100/70">Tarix</span>
                <span className="text-brown-300 font-medium">{formatDate(viewing.createdAt)}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-brown-100/60 mb-1.5">Saç problemi</p>
              <p className="text-sm text-brown-200 leading-relaxed whitespace-pre-wrap rounded-xl border border-sand-200/70 bg-white p-3">
                {viewing.hairIssue}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-brown-100/60 mb-1.5">Qeyd</p>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                placeholder="Daxili qeyd əlavə et..."
                className={`${fieldClassName} resize-y`}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingNotes ? 'Saxlanılır...' : 'Qeydi saxla'}
                </button>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu müraciəti silmək istədiyinizə əminsiniz?"
        onConfirm={performDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
