'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ImageIcon, X, Package, Home } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { ImageUploadButton } from '@/components/ImageUploadButton'
import { useToast } from './Toast'
import { ConfirmModal } from './ConfirmModal'
import {
  PageHeader,
  PrimaryButton,
  AdminModal,
  ModalFooter,
  IconButton,
  Card,
  EmptyState,
  Toggle,
  fieldClassName,
  labelClassName,
  modernSelectClassName,
  selectChevronStyle,
} from './ui'

interface Result {
  id: string
  beforeImage: string
  afterImage: string
  title: string
  description: string
  sortOrder: number
  isActive: boolean
  products: { id: string; name: string }[]
  showOnHome: boolean
}

interface FormState {
  beforeImage: string
  afterImage: string
  title: string
  description: string
  sortOrder: string
  productIds: string[]
  showOnHome: boolean
}

const EMPTY_FORM: FormState = {
  beforeImage: '',
  afterImage: '',
  title: '',
  description: '',
  sortOrder: '0',
  productIds: [],
  showOnHome: true,
}

function ImageSlot({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  return (
    <div>
      <span className={labelClassName}>{label}</span>
      <div className="relative aspect-[4/5] rounded-xl border border-sand-200/70 bg-sand-200/30 overflow-hidden flex items-center justify-center">
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-brown-300 shadow hover:bg-white"
              aria-label="Şəkli sil"
              title="Şəkli sil"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <ImageUploadButton onUploaded={onChange} />
        )}
      </div>
    </div>
  )
}

/** Selected products as removable chips plus a select to add more. */
function ProductPicker({
  products,
  value,
  onChange,
}: {
  products: { id: string; name: string }[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  const selected = value
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is { id: string; name: string } => Boolean(p))
  const remaining = products.filter((p) => !value.includes(p.id))

  return (
    <div className="rounded-xl border border-sand-200/70 bg-white p-2">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-accent-rose/15 py-1 pl-2.5 pr-1 text-xs font-medium text-brown-300"
            >
              {p.name}
              <button
                type="button"
                onClick={() => onChange(value.filter((id) => id !== p.id))}
                className="rounded-full p-0.5 text-brown-100/70 hover:bg-white/70 hover:text-brown-300"
                aria-label={`${p.name} sil`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <select
        value=""
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
        disabled={remaining.length === 0}
        className={`${modernSelectClassName} border-dashed`}
        style={selectChevronStyle}
        aria-label="Məhsul əlavə et"
      >
        <option value="">
          {remaining.length === 0 ? 'Bütün məhsullar seçilib' : '+ Məhsul əlavə et'}
        </option>
        {remaining.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ResultsAdmin({
  products,
  onUpdate,
}: {
  products: { id: string; name: string }[]
  onUpdate?: () => void
}) {
  const { toast } = useToast()

  const [results, setResults] = useState<Result[]>([])
  const [loaded, setLoaded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Result | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Result | null>(null)

  const fetchResults = async () => {
    try {
      const res = await apiFetch('/admin/results')
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      toast('Nəticələr yüklənmədi', 'error')
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    fetchResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    const nextOrder = results.length > 0 ? Math.max(...results.map((r) => r.sortOrder)) + 1 : 0
    setForm({ ...EMPTY_FORM, sortOrder: String(nextOrder) })
    setModalOpen(true)
  }

  const openEdit = (r: Result) => {
    setEditing(r)
    setForm({
      beforeImage: r.beforeImage,
      afterImage: r.afterImage,
      title: r.title,
      description: r.description,
      sortOrder: String(r.sortOrder),
      productIds: r.products.map((p) => p.id),
      showOnHome: r.showOnHome,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.beforeImage || !form.afterImage) {
      toast('Əvvəl və sonra şəkillərini yükləyin', 'error')
      return
    }
    if (form.productIds.length === 0 && !form.showOnHome) {
      toast('Nəticə heç yerdə görünməyəcək: məhsul seçin və ya ana səhifəni aktiv edin', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        beforeImage: form.beforeImage,
        afterImage: form.afterImage,
        title: form.title,
        description: form.description,
        sortOrder: Number(form.sortOrder) || 0,
        productIds: form.productIds,
        showOnHome: form.showOnHome,
      }
      const res = editing
        ? await apiFetch(`/admin/results/${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await apiFetch('/admin/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(editing ? 'Nəticə yeniləndi' : 'Nəticə əlavə edildi')
      closeModal()
      await fetchResults()
      onUpdate?.()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/results/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast('Nəticə silindi')
      await fetchResults()
      onUpdate?.()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const toggleActive = async (r: Result) => {
    try {
      const res = await apiFetch(`/admin/results/${r.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !r.isActive }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast(r.isActive ? 'Nəticə gizlədildi' : 'Nəticə saytda göstərilir')
      await fetchResults()
      onUpdate?.()
    } catch {
      toast('Status dəyişmədi', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Əvvəl / Sonra"
        subtitle="Ana səhifədə və məhsul səhifələrində göstərilən nəticə şəkilləri"
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={18} />
            Yeni nəticə
          </PrimaryButton>
        }
      />

      {loaded && results.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ImageIcon size={24} />}
            title="Hələ nəticə əlavə edilməyib"
            action={
              <PrimaryButton onClick={openCreate}>
                <Plus size={16} />
                Nəticə əlavə et
              </PrimaryButton>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((r) => (
            <Card key={r.id} className={`overflow-hidden ${r.isActive ? '' : 'opacity-60'}`}>
              <div className="grid grid-cols-2 gap-px bg-sand-200/70">
                {[
                  { src: r.beforeImage, label: 'Əvvəl' },
                  { src: r.afterImage, label: 'Sonra' },
                ].map((img) => (
                  <div key={img.label} className="relative aspect-[4/5] bg-sand-200/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.label} className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute left-2 bottom-2 text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/90 text-brown-300">
                      {img.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-brown-300 truncate">{r.title || 'Başlıqsız'}</p>
                {r.description && <p className="text-xs text-brown-100/70 mt-0.5 line-clamp-2">{r.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.products.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full bg-accent-rose/15 px-2 py-0.5 text-[11px] font-medium text-accent-rose"
                    >
                      <Package size={11} />
                      {p.name}
                    </span>
                  ))}
                  {r.showOnHome && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand-200/60 px-2 py-0.5 text-[11px] font-medium text-brown-200">
                      <Home size={11} />
                      Ana səhifə
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2.5">
                    <Toggle checked={r.isActive} onChange={() => toggleActive(r)} label="Status" />
                    <span className={`text-xs font-medium ${r.isActive ? 'text-accent-sage' : 'text-brown-100/50'}`}>
                      {r.isActive ? 'Aktiv' : 'Gizli'}
                    </span>
                    <span className="text-xs text-brown-100/50">· Sıra {r.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton onClick={() => openEdit(r)} aria-label="Redaktə et" title="Redaktə et">
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton danger onClick={() => setDeleteTarget(r)} aria-label="Sil" title="Sil">
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <AdminModal
          title={editing ? 'Nəticəni redaktə et' : 'Yeni nəticə'}
          onClose={closeModal}
          wide
          footer={
            <ModalFooter
              onCancel={closeModal}
              submitForm="result-form"
              submitLabel={editing ? 'Yenilə' : 'Əlavə et'}
              loading={saving}
              disabled={!form.beforeImage || !form.afterImage}
            />
          }
        >
          <form id="result-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClassName}>Məhsullar</label>
              <ProductPicker
                products={products}
                value={form.productIds}
                onChange={(productIds) => setForm((f) => ({ ...f, productIds }))}
              />
              <p className="mt-1.5 text-xs text-brown-100/60">
                Nəticə seçilən hər məhsulun səhifəsində “Əvvəl / Sonra” bölməsində göstəriləcək.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-cream-100/70 px-3 py-2.5">
              <div>
                <p className="text-sm text-brown-300">Ana səhifədə göstər</p>
                <p className="text-xs text-brown-100/60">“Nəticələr danışır” bölməsində</p>
              </div>
              <Toggle
                checked={form.showOnHome}
                onChange={(v) => setForm((f) => ({ ...f, showOnHome: v }))}
                label="Ana səhifədə göstər"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageSlot
                label="Əvvəl şəkli *"
                value={form.beforeImage}
                onChange={(url) => setForm((f) => ({ ...f, beforeImage: url }))}
              />
              <ImageSlot
                label="Sonra şəkli *"
                value={form.afterImage}
                onChange={(url) => setForm((f) => ({ ...f, afterImage: url }))}
              />
            </div>
            <p className="text-xs text-brown-100/60">
              Ən yaxşı görünüş üçün hər iki şəkil eyni ölçüdə və eyni bucaqdan çəkilmiş olsun (maks. 4MB).
            </p>
            <div>
              <label className={labelClassName}>Başlıq</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="məs. 8 həftəlik istifadə"
                className={fieldClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>Təsvir</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="məs. Saç Böyümə Serumu ilə"
                rows={2}
                className={fieldClassName}
              />
            </div>
            <div className="max-w-[160px]">
              <label className={labelClassName}>Sıra</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className={fieldClassName}
              />
            </div>
          </form>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu nəticəni silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
