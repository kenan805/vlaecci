'use client'

import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Eye } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { ConfirmModal } from './ConfirmModal'
import { useToast } from './Toast'
import {
  PageHeader,
  PrimaryButton,
  SearchInput,
  AdminModal,
  ModalFooter,
  IconButton,
  Card,
  EmptyState,
  Toggle,
  fieldClassName,
  modernSelectClassName,
  selectChevronStyle,
  labelClassName,
} from './ui'

interface DiscountCode {
  id: string
  code: string
  percentage: number
  expiresAt: string | null
  isActive: boolean
  maxUses: number | null
  usageCount: number
  limitType: 'none' | 'date' | 'count' | 'both'
}

type LimitType = DiscountCode['limitType']

function limitLabel(d: DiscountCode) {
  if (d.limitType === 'none') return 'Limitsiz'
  if (d.limitType === 'date') {
    return d.expiresAt ? `Tarix: ${new Date(d.expiresAt).toLocaleDateString('az-AZ')}` : 'Tarix limiti'
  }
  if (d.limitType === 'count') return `${d.usageCount}/${d.maxUses ?? '∞'} istifadə`
  return `${d.usageCount}/${d.maxUses ?? '∞'} · ${d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('az-AZ') : ''}`
}

export function DiscountManager({ discounts, onSave }: { discounts: DiscountCode[]; onSave: () => void }) {
  const { toast } = useToast()

  const [search, setSearch] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountCode | null>(null)
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState('')
  const [limitType, setLimitType] = useState<LimitType>('none')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null)
  const [viewing, setViewing] = useState<DiscountCode | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return discounts
    return discounts.filter((d) => d.code.toLowerCase().includes(q))
  }, [discounts, search])

  const openCreate = () => {
    setEditing(null)
    setCode('')
    setPercentage('')
    setLimitType('none')
    setExpiresAt('')
    setMaxUses('')
    setFormOpen(true)
  }

  const openEdit = (d: DiscountCode) => {
    setEditing(d)
    setCode(d.code)
    setPercentage(String(d.percentage))
    setLimitType(d.limitType || 'none')
    setExpiresAt(d.expiresAt ? d.expiresAt.slice(0, 16) : '')
    setMaxUses(d.maxUses != null ? String(d.maxUses) : '')
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const path = editing ? `/admin/discounts/${editing.id}` : '/admin/discounts'
      const res = await apiFetch(path, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          percentage: Number(percentage),
          limitType,
          expiresAt: expiresAt || null,
          maxUses: maxUses ? Number(maxUses) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(editing ? 'Endirim kodu yeniləndi' : 'Endirim kodu yaradıldı')
      closeForm()
      onSave()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (d: DiscountCode) => {
    try {
      const res = await apiFetch(`/admin/discounts/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !d.isActive }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast(d.isActive ? 'Endirim kodu deaktiv edildi' : 'Endirim kodu aktiv edildi')
      onSave()
    } catch {
      toast('Status dəyişmədi', 'error')
    }
  }

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/discounts/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xəta')
      toast('Endirim kodu silindi')
      onSave()
    } catch {
      toast('Endirim kodu silinmədi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Endirim kodları"
        subtitle="Endirim kodlarını yarat və idarə et"
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={18} />
            Yeni kod
          </PrimaryButton>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Kod axtar..." className="mb-4" />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-200/25">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Kod</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Endirim</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Limit</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">İstifadə</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Status</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 text-right">
                  Əməliyyat
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4">
                    <EmptyState icon={<Tag size={24} />} title="Endirim kodu yoxdur" />
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-brown-300">{d.code}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brown-300 whitespace-nowrap tabular-nums">
                      {d.percentage}%
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-100 whitespace-nowrap">{limitLabel(d)}</td>
                    <td className="px-4 py-3 text-sm text-brown-300 tabular-nums">{d.usageCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Toggle checked={d.isActive} onChange={() => toggleActive(d)} label="Status" />
                        <span className={`text-xs font-medium ${d.isActive ? 'text-accent-sage' : 'text-brown-100/50'}`}>
                          {d.isActive ? 'Aktiv' : 'Deaktiv'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton onClick={() => setViewing(d)} title="Bax" aria-label="Endirim koduna bax">
                          <Eye size={16} />
                        </IconButton>
                        <IconButton onClick={() => openEdit(d)} title="Redaktə et" aria-label="Endirim kodunu redaktə et">
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          danger
                          onClick={() => setDeleteTarget(d)}
                          title="Sil"
                          aria-label="Endirim kodunu sil"
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

      {formOpen && (
        <AdminModal
          title={editing ? 'Endirim kodunu redaktə et' : 'Yeni endirim kodu'}
          onClose={closeForm}
          footer={
            <ModalFooter
              onCancel={closeForm}
              submitForm="discount-form"
              submitLabel={editing ? 'Yenilə' : 'Yarat'}
              loading={loading}
            />
          }
        >
          <form id="discount-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClassName}>Kod</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="KOD15"
                className={`${fieldClassName} font-mono`}
                required
              />
            </div>

            <div>
              <label className={labelClassName}>Endirim (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="15"
                className={fieldClassName}
                required
              />
            </div>

            <div>
              <label className={labelClassName}>Limit növü</label>
              <select
                value={limitType}
                onChange={(e) => setLimitType(e.target.value as LimitType)}
                className={modernSelectClassName}
                style={selectChevronStyle}
              >
                <option value="none">Limitsiz</option>
                <option value="date">Yalnız tarix limiti</option>
                <option value="count">Yalnız istifadə sayı limiti</option>
                <option value="both">Hər ikisi</option>
              </select>
            </div>

            {(limitType === 'date' || limitType === 'both') && (
              <div>
                <label className={labelClassName}>Bitmə tarixi</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={fieldClassName}
                />
              </div>
            )}

            {(limitType === 'count' || limitType === 'both') && (
              <div>
                <label className={labelClassName}>Maksimum istifadə sayı</label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="100"
                  className={fieldClassName}
                />
              </div>
            )}
          </form>
        </AdminModal>
      )}

      {viewing && (
        <AdminModal title="Endirim kodu detalları" onClose={() => setViewing(null)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-cream-100 border border-sand-200/60">
              <span className="font-mono text-xl font-semibold text-brown-300 tracking-wide">{viewing.code}</span>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  viewing.isActive ? 'bg-accent-sage/20 text-brown-200' : 'bg-brown-100/10 text-brown-100/60'
                }`}
              >
                {viewing.isActive ? 'Aktiv' : 'Deaktiv'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-sand-200/70 bg-white p-3">
                <p className="text-[11px] text-brown-100/60 mb-0.5">Endirim</p>
                <p className="text-lg font-semibold text-brown-300 tabular-nums">{viewing.percentage}%</p>
              </div>
              <div className="rounded-xl border border-sand-200/70 bg-white p-3">
                <p className="text-[11px] text-brown-100/60 mb-0.5">İstifadə</p>
                <p className="text-lg font-semibold text-brown-300 tabular-nums">
                  {viewing.usageCount}
                  {viewing.maxUses != null && <span className="text-brown-100/50"> / {viewing.maxUses}</span>}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-sand-200/50">
                <span className="text-brown-100/70">Limit növü</span>
                <span className="text-brown-300 font-medium">{limitLabel(viewing)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-sand-200/50">
                <span className="text-brown-100/70">Bitmə tarixi</span>
                <span className="text-brown-300 font-medium">
                  {viewing.expiresAt ? new Date(viewing.expiresAt).toLocaleString('az-AZ') : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-brown-100/70">Maksimum istifadə</span>
                <span className="text-brown-300 font-medium">{viewing.maxUses ?? 'Limitsiz'}</span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu endirim kodunu silmək istədiyinizə əminsiniz?"
        onConfirm={performDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
