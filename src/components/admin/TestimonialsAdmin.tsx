'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Quote, Star } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from './Toast'
import { ConfirmModal } from './ConfirmModal'
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
  labelClassName,
} from './ui'

interface Testimonial {
  id: string
  name: string
  handle: string
  text: string
  rating: number
  sortOrder: number
  isActive: boolean
}

interface FormState {
  name: string
  handle: string
  text: string
  rating: number
  sortOrder: string
}

const EMPTY_FORM: FormState = { name: '', handle: '', text: '', rating: 5, sortOrder: '0' }

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value
        const star = (
          <Star size={onChange ? 22 : 14} className={filled ? 'fill-accent-rose text-accent-rose' : 'text-sand-300'} />
        )
        return onChange ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="p-0.5 rounded hover:scale-110 transition-transform"
            aria-label={`${n} ulduz`}
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        )
      })}
    </div>
  )
}

export function TestimonialsAdmin() {
  const { toast } = useToast()

  const [items, setItems] = useState<Testimonial[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null)

  const fetchItems = async () => {
    try {
      const res = await apiFetch('/admin/testimonials')
      const data = await res.json()
      setItems(data.testimonials || [])
    } catch {
      toast('Rəylər yüklənmədi', 'error')
    }
  }

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.handle.toLowerCase().includes(q) || t.text.toLowerCase().includes(q)
    )
  }, [items, search])

  const openCreate = () => {
    setEditing(null)
    const nextOrder = items.length > 0 ? Math.max(...items.map((t) => t.sortOrder)) + 1 : 0
    setForm({ ...EMPTY_FORM, sortOrder: String(nextOrder) })
    setModalOpen(true)
  }

  const openEdit = (t: Testimonial) => {
    setEditing(t)
    setForm({ name: t.name, handle: t.handle, text: t.text, rating: t.rating, sortOrder: String(t.sortOrder) })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        handle: form.handle,
        text: form.text,
        rating: form.rating,
        sortOrder: Number(form.sortOrder) || 0,
      }
      const res = editing
        ? await apiFetch(`/admin/testimonials/${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await apiFetch('/admin/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(editing ? 'Rəy yeniləndi' : 'Rəy əlavə edildi')
      closeModal()
      await fetchItems()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/testimonials/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast('Rəy silindi')
      await fetchItems()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const toggleActive = async (t: Testimonial) => {
    try {
      const res = await apiFetch(`/admin/testimonials/${t.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !t.isActive }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast(t.isActive ? 'Rəy gizlədildi' : 'Rəy saytda göstərilir')
      await fetchItems()
    } catch {
      toast('Status dəyişmədi', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Müştəri rəyləri"
        subtitle="Ana səhifədəki “Müştərilərimiz nə deyir” bölməsini idarə et"
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={18} />
            Yeni rəy
          </PrimaryButton>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Ad, handle və ya mətn ilə axtar..." className="mb-4" />

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<Quote size={24} />} title="Rəy tapılmadı" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-sand-200/70 bg-sand-200/25">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 w-12">
                    Sıra
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    Müştəri
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    Rəy
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 text-right">
                    Əməliyyat
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors align-top"
                  >
                    <td className="px-4 py-3.5 text-brown-100/60 tabular-nums">{t.sortOrder}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-brown-300">{t.name}</p>
                      {t.handle && <p className="text-xs text-brown-100/60">{t.handle}</p>}
                    </td>
                    <td className="px-4 py-3.5 max-w-[360px]">
                      <Stars value={t.rating} />
                      <p className="text-brown-100/90 mt-1 line-clamp-2">{t.text}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Toggle checked={t.isActive} onChange={() => toggleActive(t)} label="Status" />
                        <span className={`text-xs font-medium ${t.isActive ? 'text-accent-sage' : 'text-brown-100/50'}`}>
                          {t.isActive ? 'Aktiv' : 'Gizli'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton onClick={() => openEdit(t)} aria-label="Redaktə et" title="Redaktə et">
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton danger onClick={() => setDeleteTarget(t)} aria-label="Sil" title="Sil">
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalOpen && (
        <AdminModal
          title={editing ? 'Rəyi redaktə et' : 'Yeni rəy'}
          onClose={closeModal}
          footer={
            <ModalFooter
              onCancel={closeModal}
              submitForm="testimonial-form"
              submitLabel={editing ? 'Yenilə' : 'Əlavə et'}
              loading={saving}
            />
          }
        >
          <form id="testimonial-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClassName}>Ad *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="məs. Leyla M."
                  className={fieldClassName}
                  required
                />
              </div>
              <div>
                <label className={labelClassName}>Instagram</label>
                <input
                  value={form.handle}
                  onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))}
                  placeholder="məs. @leyla.m"
                  className={fieldClassName}
                />
              </div>
            </div>
            <div>
              <label className={labelClassName}>Rəy mətni *</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                rows={4}
                className={fieldClassName}
                required
              />
            </div>
            <div className="flex items-end gap-6">
              <div>
                <span className={labelClassName}>Reytinq</span>
                <Stars value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
              </div>
              <div className="max-w-[140px]">
                <label className={labelClassName}>Sıra</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className={fieldClassName}
                />
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu rəyi silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
