'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  productId: string
  /** Selected size/volume variant, if the product has variants. */
  variantId?: string | null
  /** Human-readable variant, e.g. "30 ml" or "20 ml · Test versiya". */
  variantLabel?: string | null
  name: string
  slug: string
  price: number
  image: string | null
  qty: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  ready: boolean
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (key: string) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/** A cart line is one product in one variant — the same product in two sizes is two lines. */
export function cartKey(item: Pick<CartItem, 'productId' | 'variantId'>): string {
  return `${item.productId}::${item.variantId ?? ''}`
}
const STORAGE_KEY = 'vlaecci-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      /* ignore */
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore */
    }
  }, [items, ready])

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty: number = 1) => {
    setItems((prev) => {
      const key = cartKey(item)
      const existing = prev.find((i) => cartKey(i) === key)
      if (existing) {
        return prev.map((i) => (cartKey(i) === key ? { ...i, qty: i.qty + qty } : i))
      }
      return [...prev, { ...item, qty }]
    })
  }, [])

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => cartKey(i) !== key))
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => cartKey(i) !== key)
        : prev.map((i) => (cartKey(i) === key ? { ...i, qty } : i))
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((n, i) => n + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, count, subtotal, ready, add, remove, setQty, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
