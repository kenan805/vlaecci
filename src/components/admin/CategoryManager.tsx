'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface Category {
  id: string
  name: string
  slug: string
}

export function CategoryManager({ onUpdate }: { onUpdate?: () => void }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    const res = await apiFetch('/admin/categories')
    const data = await res.json()
    setCategories(data.categories || [])
  }

  useEffect(() => { fetchCategories() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await apiFetch(`/admin/categories/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-') }),
        })
      } else {
        await apiFetch('/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-') }),
        })
      }
      setName('')
      setSlug('')
      setEditing(null)
      fetchCategories()
      onUpdate?.()
    } catch {
      alert('Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Kateqoriyanı silmək istədiyinizə əminsiniz?')) return
    const res = await apiFetch(`/admin/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Xəta'); return }
    fetchCategories()
    onUpdate?.()
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-cream-100 rounded-xl border border-sand-200/50 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm text-brown-100 mb-1">Ad</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-sand-200" required />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm text-brown-100 mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="avtomatik" className="w-full px-3 py-2 rounded-lg border border-sand-200" />
        </div>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-brown-300 text-cream-50 rounded-lg text-sm">
          {editing ? 'Yenilə' : 'Əlavə et'}
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setName(''); setSlug('') }} className="px-4 py-2 border border-sand-200 rounded-lg text-sm">
            Ləğv
          </button>
        )}
      </form>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 bg-cream-100 rounded-xl border border-sand-200/50">
            <div>
              <span className="font-medium text-brown-300">{c.name}</span>
              <span className="ml-2 text-xs text-brown-100">/{c.slug}</span>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditing(c); setName(c.name); setSlug(c.slug) }} className="p-2 text-brown-100 hover:text-brown-300">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
