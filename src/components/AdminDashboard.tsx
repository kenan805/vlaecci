'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Tag,
  LogOut,
  Pencil,
  Trash2,
  FolderOpen,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  User,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { CategoryManager } from './admin/CategoryManager'
import { AnalysisAdmin } from './admin/AnalysisAdmin'
import { ProductsAdmin, type Product } from './admin/ProductsAdmin'
import { ToastProvider } from './admin/Toast'

type Tab = 'products' | 'categories' | 'analysis' | 'discounts'

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

export function AdminDashboard() {
  return (
    <ToastProvider>
      <AdminDashboardInner />
    </ToastProvider>
  )
}

function AdminDashboardInner() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminUser, setAdminUser] = useState<{ email: string } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [pRes, dRes, catRes, meRes] = await Promise.all([
        apiFetch('/admin/products'),
        apiFetch('/admin/discounts'),
        apiFetch('/admin/categories'),
        apiFetch('/auth/me'),
      ])
      if (pRes.status === 401) {
        router.push('/admin/login')
        return
      }
      const [pData, dData, catData] = await Promise.all([
        pRes.json(),
        dRes.json(),
        catRes.json(),
      ])
      setProducts(
        (pData.products || []).map((p: Product & { status?: string }) => ({
          ...p,
          status: p.status || 'active',
        }))
      )
      setDiscounts(dData.codes || [])
      setCategories(catData.categories || [])
      if (meRes.ok) {
        const me = await meRes.json()
        if (me.email) setAdminUser({ email: me.email })
      }
    } catch {
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const tabs = [
    { id: 'products' as Tab, label: 'Məhsullar', icon: Package },
    { id: 'categories' as Tab, label: 'Kateqoriyalar', icon: FolderOpen },
    { id: 'analysis' as Tab, label: 'Saç Analizi', icon: Sparkles },
    { id: 'discounts' as Tab, label: 'Endirim kodları', icon: Tag },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-pulse text-brown-100">Yüklənir...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">
      <aside
        className={`shrink-0 border-r border-sand-200/70 bg-cream-100 transition-all duration-300 ease-out flex flex-col ${
          sidebarOpen ? 'w-60' : 'w-[72px]'
        }`}
      >
        <div className={`flex items-center gap-2 px-3 py-4 border-b border-sand-200/50 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <Link href="/" className="font-serif text-lg font-medium text-brown-300 truncate pl-1">
              VLAECCI
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl text-brown-100 hover:bg-sand-200/50 hover:text-brown-300 transition-colors"
            title={sidebarOpen ? 'Sidebarı bağla' : 'Sidebarı aç'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                title={t.label}
                className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${
                  sidebarOpen ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
                } ${
                  active
                    ? 'bg-brown-300 text-cream-50 shadow-sm'
                    : 'text-brown-100 hover:bg-sand-200/50'
                }`}
              >
                <t.icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{t.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-cream-100/90 border-b border-sand-200/70 px-4 sm:px-6 flex items-center justify-between gap-4">
          <h1 className="font-serif text-lg font-medium text-brown-300 truncate">
            {tabs.find((t) => t.id === tab)?.label}
          </h1>
          <div className="flex items-center gap-3">
            {adminUser && (
              <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-cream-50 border border-sand-200/60">
                <div className="w-8 h-8 rounded-full bg-brown-300/10 text-brown-300 flex items-center justify-center">
                  <User size={16} />
                </div>
                <span className="text-sm text-brown-300 font-medium hidden sm:block max-w-[160px] truncate">
                  {adminUser.email}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-brown-100 hover:bg-sand-200/50 hover:text-brown-300 text-sm transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Çıxış</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {tab === 'products' && (
            <ProductsAdmin
              products={products}
              categories={categories}
              onRefresh={fetchData}
            />
          )}
          {tab === 'categories' && <CategoryManager onUpdate={fetchData} />}
          {tab === 'analysis' && (
            <AnalysisAdmin products={products.map((p) => ({ id: p.id, name: p.name }))} />
          )}
          {tab === 'discounts' && (
            <DiscountManager discounts={discounts} onSave={fetchData} />
          )}
        </main>
      </div>
    </div>
  )
}

function DiscountManager({ discounts, onSave }: { discounts: DiscountCode[]; onSave: () => void }) {
  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState('')
  const [limitType, setLimitType] = useState<'none' | 'date' | 'count' | 'both'>('none')
  const [expiresAt, setExpiresAt] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<DiscountCode | null>(null)

  const resetForm = () => {
    setCode('')
    setPercentage('')
    setLimitType('none')
    setExpiresAt('')
    setMaxUses('')
    setEditing(null)
  }

  const startEdit = (d: DiscountCode) => {
    setEditing(d)
    setCode(d.code)
    setPercentage(String(d.percentage))
    setLimitType(d.limitType || 'none')
    setExpiresAt(d.expiresAt ? d.expiresAt.slice(0, 16) : '')
    setMaxUses(d.maxUses != null ? String(d.maxUses) : '')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          percentage: Number(percentage),
          limitType,
          expiresAt: expiresAt || null,
          maxUses: maxUses ? Number(maxUses) : null,
        }),
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Xəta')
      resetForm()
      onSave()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!editing) return
    setLoading(true)
    try {
      const res = await apiFetch(`/admin/discounts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          percentage: Number(percentage),
          limitType,
          expiresAt: expiresAt || null,
          maxUses: maxUses ? Number(maxUses) : null,
        }),
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || 'Xəta')
      resetForm()
      onSave()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (d: DiscountCode) => {
    await apiFetch(`/admin/discounts/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !d.isActive }),
    })
    onSave()
  }

  const deleteDiscount = async (id: string) => {
    if (!confirm('Endirim kodunu silmək istədiyinizə əminsiniz?')) return
    await apiFetch(`/admin/discounts/${id}`, { method: 'DELETE' })
    onSave()
  }

  const limitLabel = (d: DiscountCode) => {
    if (d.limitType === 'none') return 'Limitsiz'
    if (d.limitType === 'date') return d.expiresAt ? `Tarix: ${new Date(d.expiresAt).toLocaleDateString('az-AZ')}` : 'Tarix limiti'
    if (d.limitType === 'count') return `${d.usageCount}/${d.maxUses ?? '∞'} istifadə`
    return `${d.usageCount}/${d.maxUses ?? '∞'} · ${d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('az-AZ') : ''}`
  }

  return (
    <div>
      <form
        onSubmit={editing ? (e) => { e.preventDefault(); handleUpdate() } : handleCreate}
        className="p-4 bg-cream-100 rounded-xl border border-sand-200/50 mb-6 space-y-3"
      >
        <div className="flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="KOD15"
            className="px-4 py-2 rounded-lg border border-sand-200 font-mono"
            required
          />
          <input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            placeholder="15"
            className="w-20 px-4 py-2 rounded-lg border border-sand-200"
            required
          />
          <span className="self-center text-brown-100">%</span>
        </div>
        <div>
          <label className="block text-sm text-brown-100 mb-1">Limit növü</label>
          <select
            value={limitType}
            onChange={(e) => setLimitType(e.target.value as typeof limitType)}
            className="w-full px-4 py-2 rounded-lg border border-sand-200 text-sm"
          >
            <option value="none">Limitsiz</option>
            <option value="date">Yalnız tarix limiti</option>
            <option value="count">Yalnız istifadə sayı limiti</option>
            <option value="both">Hər ikisi</option>
          </select>
        </div>
        {(limitType === 'date' || limitType === 'both') && (
          <div>
            <label className="block text-sm text-brown-100 mb-1">Bitmə tarixi</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-sand-200 text-sm"
            />
          </div>
        )}
        {(limitType === 'count' || limitType === 'both') && (
          <div>
            <label className="block text-sm text-brown-100 mb-1">Maksimum istifadə sayı</label>
            <input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="100"
              className="w-full px-4 py-2 rounded-lg border border-sand-200 text-sm"
            />
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-brown-300 text-cream-50 rounded-lg text-sm">
            {loading ? '...' : editing ? 'Yenilə' : 'Yarat'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-sand-200 rounded-lg text-sm">
              Ləğv et
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {discounts.map((d) => (
          <div key={d.id} className="p-4 bg-cream-100 rounded-xl border border-sand-200/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-medium text-brown-300">{d.code}</span>
                  <span className="text-brown-100">{d.percentage}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.isActive ? 'bg-accent-sage/20 text-accent-sage' : 'bg-sand-200 text-brown-100'}`}>
                    {d.isActive ? 'Aktiv' : 'Deaktiv'}
                  </span>
                </div>
                <p className="text-xs text-brown-100/70 mt-1">{limitLabel(d)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button type="button" onClick={() => startEdit(d)} className="p-2 text-brown-100 hover:text-brown-300" title="Redaktə">
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleActive(d)}
                  className="px-2 py-1 text-xs rounded-lg border border-sand-200 text-brown-100 hover:bg-sand-200"
                >
                  {d.isActive ? 'Deaktiv et' : 'Aktiv et'}
                </button>
                <button type="button" onClick={() => deleteDiscount(d.id)} className="p-2 text-red-500 hover:text-red-600" title="Sil">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
