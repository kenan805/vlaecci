'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
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

interface Category {
  id: string
  name: string
  slug: string
  isActive: boolean
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

export function CategoryManager({ onUpdate }: { onUpdate?: () => void }) {
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/admin/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      toast('Kateqoriyalar yüklənmədi', 'error')
    }
  }

  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return categories
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    )
  }, [categories, search])

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSlug('')
    setModalOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setName(category.name)
    setSlug(category.slug)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setName('')
    setSlug('')
  }

  const handleNameChange = (value: string) => {
    setName(value)
    if (!editing) setSlug(slugifyAz(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { name, slug: slug || slugifyAz(name) }
      const res = editing
        ? await apiFetch(`/admin/categories/${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await apiFetch('/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast(editing ? 'Kateqoriya yeniləndi' : 'Kateqoriya əlavə edildi')
      closeModal()
      await fetchCategories()
      onUpdate?.()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/categories/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast('Kateqoriya silindi')
      await fetchCategories()
      onUpdate?.()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const toggleActive = async (c: Category) => {
    try {
      const res = await apiFetch(`/admin/categories/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })
      if (!res.ok) throw new Error('Xəta')
      toast(c.isActive ? 'Kateqoriya deaktiv edildi' : 'Kateqoriya aktiv edildi')
      await fetchCategories()
      onUpdate?.()
    } catch {
      toast('Status dəyişmədi', 'error')
    }
  }

  return (
    <div>
      <PageHeader
        title="Kateqoriyalar"
        subtitle="Məhsul kateqoriyalarını idarə et"
        action={
          <PrimaryButton onClick={openCreate}>
            <Plus size={18} />
            Yeni kateqoriya
          </PrimaryButton>
        }
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Ad və ya slug ilə axtar..."
        className="mb-4"
      />

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<FolderOpen size={24} />} title="Kateqoriya tapılmadı" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-sand-200/70 bg-sand-200/25">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 w-12">
                    #
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    Ad
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">
                    Slug
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
                {filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-brown-100/60 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-brown-300">{c.name}</td>
                    <td className="px-4 py-3.5 text-brown-100 text-sm">/{c.slug}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Toggle checked={c.isActive} onChange={() => toggleActive(c)} label="Status" />
                        <span
                          className={`text-xs font-medium ${
                            c.isActive ? 'text-accent-sage' : 'text-brown-100/50'
                          }`}
                        >
                          {c.isActive ? 'Aktiv' : 'Deaktiv'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton onClick={() => openEdit(c)} aria-label="Redaktə et" title="Redaktə et">
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton
                          danger
                          onClick={() => setDeleteTarget(c)}
                          aria-label="Sil"
                          title="Sil"
                        >
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
          title={editing ? 'Kateqoriyanı redaktə et' : 'Yeni kateqoriya'}
          onClose={closeModal}
          footer={
            <ModalFooter
              onCancel={closeModal}
              submitForm="category-form"
              submitLabel={editing ? 'Yenilə' : 'Əlavə et'}
              loading={loading}
            />
          }
        >
          <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClassName}>Ad</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={fieldClassName}
                required
              />
            </div>
            <div>
              <label className={labelClassName}>Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="avtomatik"
                className={fieldClassName}
              />
            </div>
          </form>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu kateqoriyanı silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
