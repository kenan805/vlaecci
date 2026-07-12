'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Package,
  Tag,
  LogOut,
  FolderOpen,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  User,
  LayoutDashboard,
  ChevronDown,
  Settings,
  ClipboardList,
  MessageSquare,
  ShoppingBag,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { CategoryManager } from './admin/CategoryManager'
import { AnalysisAdmin } from './admin/AnalysisAdmin'
import { ProductsAdmin, type Product } from './admin/ProductsAdmin'
import { DiscountManager } from './admin/DiscountManager'
import { StatsDashboard } from './admin/StatsDashboard'
import { ProfileSettings } from './admin/ProfileSettings'
import { AnalysisLeadsAdmin } from './admin/AnalysisLeadsAdmin'
import { ConsultationsAdmin } from './admin/ConsultationsAdmin'
import { OrdersAdmin } from './admin/OrdersAdmin'
import { ThemeToggle } from './admin/ThemeToggle'
import { ToastProvider } from './admin/Toast'

type Tab =
  | 'stats'
  | 'products'
  | 'orders'
  | 'categories'
  | 'analysis'
  | 'leads'
  | 'consultations'
  | 'discounts'
  | 'profile'

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
  const [tab, setTab] = useState<Tab>('stats')
  const [products, setProducts] = useState<Product[]>([])
  const [discounts, setDiscounts] = useState<DiscountCode[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminUser, setAdminUser] = useState<{ email: string; avatarUrl?: string | null } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem('vlaecci-admin-theme')) as
      | 'light'
      | 'dark'
      | null
    if (saved === 'dark') setTheme('dark')
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-switching')
    root.classList.toggle('dark', theme === 'dark')
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-switching'))
    })
    const fallback = window.setTimeout(() => root.classList.remove('theme-switching'), 200)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fallback)
      root.classList.remove('dark')
      root.classList.remove('theme-switching')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') localStorage.setItem('vlaecci-admin-theme', next)
      return next
    })
  }

  const fetchData = useCallback(async () => {
    try {
      const [pRes, dRes, catRes, meRes] = await Promise.all([
        apiFetch('/admin/products'),
        apiFetch('/admin/discounts'),
        apiFetch('/admin/categories'),
        apiFetch('/admin/profile'),
      ])
      if (pRes.status === 401 || meRes.status === 401) {
        router.push('/admin/login')
        return
      }
      const [pData, dData, catData] = await Promise.all([pRes.json(), dRes.json(), catRes.json()])
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
        if (me.email) setAdminUser({ email: me.email, avatarUrl: me.avatarUrl ?? null })
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

  useEffect(() => {
    if (!userMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const tabs = [
    { id: 'stats' as Tab, label: 'İdarə paneli', icon: LayoutDashboard },
    { id: 'products' as Tab, label: 'Məhsullar', icon: Package },
    { id: 'orders' as Tab, label: 'Sifarişlər', icon: ShoppingBag },
    { id: 'categories' as Tab, label: 'Kateqoriyalar', icon: FolderOpen },
    { id: 'analysis' as Tab, label: 'Saç Analizi', icon: Sparkles },
    { id: 'leads' as Tab, label: 'Analiz nəticələri', icon: ClipboardList },
    { id: 'consultations' as Tab, label: 'Konsultasiyalar', icon: MessageSquare },
    { id: 'discounts' as Tab, label: 'Endirim kodları', icon: Tag },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="animate-pulse text-brown-100">Yüklənir...</div>
      </div>
    )
  }

  const initial = (adminUser?.email?.[0] || 'A').toUpperCase()

  return (
    <div className="h-screen bg-cream-50 flex overflow-hidden">
      <aside
        className={`shrink-0 border-r border-sand-200/70 bg-cream-100 transition-[width] duration-300 ease-out flex flex-col ${
          sidebarOpen ? 'w-60' : 'w-[72px]'
        }`}
      >
        <div
          className={`px-3 py-4 border-b border-sand-200/50 ${
            sidebarOpen ? 'flex items-center justify-between gap-2' : 'flex flex-col items-center gap-3'
          }`}
        >
          <Link href="/" className="flex items-center gap-2 min-w-0" title="VLAECCI" aria-label="VLAECCI">
            <Image src="/logo-mark.png" alt="" width={36} height={36} className="w-9 h-9 shrink-0 object-contain" />
            {sidebarOpen && (
              <Image src="/wordmark.png" alt="VLAECCI" width={747} height={137} className="h-4 w-auto object-contain" />
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl text-brown-100 hover:bg-sand-200/50 hover:text-brown-300 transition-colors"
            title={sidebarOpen ? 'Sidebarı bağla' : 'Sidebarı aç'}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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
                } ${active ? 'bg-brown-300 text-cream-50 shadow-sm' : 'text-brown-100 hover:bg-sand-200/50'}`}
              >
                <t.icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{t.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-30 h-14 shrink-0 bg-cream-100/80 backdrop-blur border-b border-sand-200/70 px-4 sm:px-6 flex items-center justify-end gap-2.5">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`flex items-center gap-2.5 pl-1.5 pr-3 h-10 rounded-xl border transition-all ${
                userMenuOpen
                  ? 'bg-white border-brown-300/40 shadow-sm'
                  : 'bg-white border-sand-200/70 hover:border-brown-300/40 hover:shadow-sm'
              }`}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <span className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-brown-300 to-brown-400 text-cream-50 flex items-center justify-center text-sm font-semibold shadow-sm shrink-0">
                {adminUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={adminUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <span className="text-sm text-brown-300 font-medium hidden sm:block max-w-[160px] truncate">
                {adminUser?.email}
              </span>
              <ChevronDown
                size={15}
                className={`text-brown-100/50 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 z-[70] w-64 p-2 rounded-2xl bg-white border border-sand-200/70 shadow-[0_16px_40px_-12px_rgba(74,61,50,0.3)]"
                >
                  <div className="flex items-center gap-3 px-2 py-2.5 mb-1.5 rounded-xl bg-cream-100/70">
                    <span className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-brown-300 to-brown-400 text-cream-50 flex items-center justify-center text-base font-semibold shrink-0">
                      {adminUser?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={adminUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brown-300 truncate">{adminUser?.email}</p>
                      <p className="text-xs text-brown-100/50">Administrator</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setTab('profile')
                      setUserMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-brown-200 hover:bg-sand-200/50 hover:text-brown-300 transition-colors"
                  >
                    <Settings size={16} />
                    Profil ayarları
                  </button>
                  <div className="my-1 h-px bg-sand-200/60" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Çıxış
                  </button>
                </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {tab === 'stats' && <StatsDashboard />}
          {tab === 'products' && <ProductsAdmin products={products} categories={categories} onRefresh={fetchData} />}
          {tab === 'orders' && <OrdersAdmin />}
          {tab === 'categories' && <CategoryManager onUpdate={fetchData} />}
          {tab === 'analysis' && <AnalysisAdmin products={products.map((p) => ({ id: p.id, name: p.name }))} />}
          {tab === 'leads' && <AnalysisLeadsAdmin />}
          {tab === 'consultations' && <ConsultationsAdmin />}
          {tab === 'discounts' && <DiscountManager discounts={discounts} onSave={fetchData} />}
          {tab === 'profile' && <ProfileSettings onUpdated={fetchData} />}
        </main>
      </div>
    </div>
  )
}
