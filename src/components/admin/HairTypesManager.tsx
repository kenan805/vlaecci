'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from './Toast'
import { ConfirmModal } from './ConfirmModal'
import { AdminModal, IconButton, Toggle, fieldClassName } from './ui'

export interface HairType {
  id: string
  label: string
  sortOrder: number
  isActive: boolean
}

const MAX_LABEL = 40

/** Add, rename, reorder, hide and delete the hair types offered on review forms. */
export function HairTypesManager({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<HairType[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<{ id: string; label: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HairType | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/admin/hair-types')
      const data = await res.json()
      setItems(data.hairTypes || [])
    } catch {
      toast('Saç tipləri yüklənmədi', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const request = async (path: string, method: string, body?: unknown) => {
    const res = await apiFetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
    return data
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.trim()) return
    setAdding(true)
    try {
      const data = await request('/admin/hair-types', 'POST', { label: newLabel })
      setItems((cur) => [...cur, data.hairType])
      setNewLabel('')
      toast('Saç tipi əlavə edildi')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setAdding(false)
    }
  }

  const saveLabel = async () => {
    if (!editing) return
    try {
      await request(`/admin/hair-types/${editing.id}`, 'PUT', { label: editing.label })
      setItems((cur) => cur.map((h) => (h.id === editing.id ? { ...h, label: editing.label.trim() } : h)))
      setEditing(null)
      toast('Saç tipi yeniləndi')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    }
  }

  const toggleActive = async (h: HairType, isActive: boolean) => {
    setItems((cur) => cur.map((x) => (x.id === h.id ? { ...x, isActive } : x)))
    try {
      await request(`/admin/hair-types/${h.id}`, 'PUT', { isActive })
    } catch (err) {
      setItems((cur) => cur.map((x) => (x.id === h.id ? { ...x, isActive: !isActive } : x)))
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    }
  }

  const move = async (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= items.length) return
    const prev = items
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    try {
      await request('/admin/hair-types', 'PATCH', { ids: next.map((h) => h.id) })
    } catch (err) {
      setItems(prev)
      toast(err instanceof Error ? err.message : 'Sıra saxlanılmadı', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await request(`/admin/hair-types/${deleteTarget.id}`, 'DELETE')
      setItems((cur) => cur.filter((h) => h.id !== deleteTarget.id))
      toast('Saç tipi silindi')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <AdminModal title="Saç tipləri" onClose={onClose}>
        <p className="text-sm text-brown-100/70 mb-4">
          Rəy formunda göstərilən seçimlər. Deaktiv tiplər formda görünmür, amma köhnə rəylərdə qalır. Müştəri
          siyahıda olmayan tipi “Öz seçiminiz” ilə özü yaza bilər.
        </p>

        <form onSubmit={add} className="flex gap-2 mb-4">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            maxLength={MAX_LABEL}
            placeholder="Yeni saç tipi, məs. Dalğalı saç"
            className={fieldClassName}
            aria-label="Yeni saç tipi"
          />
          <button
            type="submit"
            disabled={adding || !newLabel.trim()}
            className="inline-flex items-center gap-1.5 px-4 rounded-xl bg-brown-300 text-cream-50 text-sm font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors shrink-0"
          >
            <Plus size={16} />
            Əlavə et
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-brown-100/60 py-8 text-center">Yüklənir...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-brown-100/60 py-8 text-center">Hələ saç tipi yoxdur</p>
        ) : (
          <ul className="divide-y divide-sand-200/60 rounded-xl border border-sand-200/70 bg-white">
            {items.map((h, i) => (
              <li key={h.id} className="flex items-center gap-2 px-3 py-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-0.5 rounded text-brown-100/60 hover:text-brown-300 disabled:opacity-25"
                    aria-label="Yuxarı"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="p-0.5 rounded text-brown-100/60 hover:text-brown-300 disabled:opacity-25"
                    aria-label="Aşağı"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                {editing?.id === h.id ? (
                  <form
                    className="flex flex-1 items-center gap-1.5"
                    onSubmit={(e) => {
                      e.preventDefault()
                      saveLabel()
                    }}
                  >
                    <input
                      value={editing.label}
                      onChange={(e) => setEditing({ id: h.id, label: e.target.value })}
                      maxLength={MAX_LABEL}
                      autoFocus
                      className={`${fieldClassName} !py-1.5`}
                      aria-label="Saç tipinin adı"
                    />
                    <IconButton type="submit" aria-label="Saxla" title="Saxla">
                      <Check size={16} />
                    </IconButton>
                    <IconButton onClick={() => setEditing(null)} aria-label="Ləğv et" title="Ləğv et">
                      <X size={16} />
                    </IconButton>
                  </form>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${h.isActive ? 'text-brown-300' : 'text-brown-100/50 line-through'}`}>
                      {h.label}
                    </span>
                    <Toggle
                      checked={h.isActive}
                      onChange={(next) => toggleActive(h, next)}
                      label={h.isActive ? 'Deaktiv et' : 'Aktiv et'}
                    />
                    <IconButton onClick={() => setEditing({ id: h.id, label: h.label })} aria-label="Adını dəyiş" title="Adını dəyiş">
                      <Pencil size={15} />
                    </IconButton>
                    <IconButton danger onClick={() => setDeleteTarget(h)} aria-label="Sil" title="Sil">
                      <Trash2 size={15} />
                    </IconButton>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminModal>

      <ConfirmModal
        open={deleteTarget !== null}
        message={`“${deleteTarget?.label ?? ''}” silinsin? Bu tipi seçmiş köhnə rəylərdə ad mətn kimi qalacaq.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
