'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, Trash2, Minus, Plus, Loader2, Tag, X, Check, ArrowRight } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductImage } from '@/components/ProductImage'
import { useCart } from '@/lib/cart'
import { apiFetch } from '@/lib/api'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+994557087999'

interface OrderResponseItem {
  name: string
  price: number
  qty: number
}

interface OrderResponse {
  orderId: string
  subtotal: number
  discountPercentage: number
  discountAmount: number
  total: number
  items: OrderResponseItem[]
}

interface AppliedDiscount {
  code: string
  percentage: number
}

interface DiscountCheckResponse {
  valid: boolean
  percentage?: number
  reason?: string
}

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 text-sm text-brown-300 placeholder:text-brown-100/50 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/40 transition-colors'

/** Round to 2 decimals and format without trailing zeros. */
function money(n: number): string {
  return (Math.round(n * 100) / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export default function CartPage() {
  const { items, subtotal, ready, setQty, remove, clear } = useCart()

  // discount
  const [codeInput, setCodeInput] = useState('')
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null)
  const [discountLoading, setDiscountLoading] = useState(false)
  const [discountError, setDiscountError] = useState('')

  // checkout form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')

  // submission
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [orderError, setOrderError] = useState('')
  const [success, setSuccess] = useState<OrderResponse | null>(null)

  const discountAmount = discount ? (subtotal * discount.percentage) / 100 : 0
  const total = subtotal - discountAmount

  const applyDiscount = async () => {
    const code = codeInput.trim()
    if (!code) return
    setDiscountLoading(true)
    setDiscountError('')
    try {
      const res = await apiFetch('/discount/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = (await res.json()) as DiscountCheckResponse
      if (data.valid && typeof data.percentage === 'number') {
        setDiscount({ code: code.toUpperCase(), percentage: data.percentage })
      } else {
        setDiscount(null)
        setDiscountError(
          data.reason === 'expired'
            ? 'Kodun vaxtı bitib'
            : data.reason === 'limit_reached'
              ? 'Kodun istifadə limiti dolub'
              : 'Kod yanlışdır'
        )
      }
    } catch {
      setDiscount(null)
      setDiscountError('Kod yoxlanıla bilmədi')
    } finally {
      setDiscountLoading(false)
    }
  }

  const removeDiscount = () => {
    setDiscount(null)
    setCodeInput('')
    setDiscountError('')
  }

  const submitOrder = async () => {
    setFormError('')
    setOrderError('')
    if (!name.trim() || !phone.trim()) {
      setFormError('Ad və telefon mütləqdir')
      return
    }
    if (items.length === 0) return

    setSubmitting(true)
    try {
      const res = await apiFetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
          customer: {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            note: note.trim(),
          },
          code: discount?.code || undefined,
        }),
      })
      const data = (await res.json()) as OrderResponse & { error?: string }
      if (!res.ok) throw new Error(data.error || 'Sifariş yaradıla bilmədi')

      // Build the WhatsApp order summary
      const lines: string[] = [`Yeni sifariş #${data.orderId.slice(0, 8)}`, '']
      for (const it of data.items) {
        lines.push(`• ${it.name} x ${it.qty} = ${money(it.price * it.qty)} ₼`)
      }
      lines.push('')
      lines.push(`Ara cəm: ${money(data.subtotal)} ₼`)
      if (data.discountAmount > 0) {
        const label = discount?.code || `${data.discountPercentage}%`
        lines.push(`Endirim (${label}): -${money(data.discountAmount)} ₼`)
      }
      lines.push(`Yekun: ${money(data.total)} ₼`)
      lines.push('')
      lines.push(`Ad: ${name.trim()}`)
      lines.push(`Tel: ${phone.trim()}`)
      if (address.trim()) lines.push(`Ünvan: ${address.trim()}`)

      const waNumber = WHATSAPP_NUMBER.replace(/\D/g, '')
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join('\n'))}`
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }

      clear()
      setSuccess(data)
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Sifariş yaradıla bilmədi')
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------- Body ---------------- */
  let body: React.ReactNode

  if (success) {
    body = (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center py-10"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-sage/15 flex items-center justify-center"
        >
          <Check size={38} className="text-accent-sage" />
        </motion.div>
        <h1 className="font-serif text-3xl font-medium text-brown-300 mb-3">Sifarişiniz qəbul edildi!</h1>
        <p className="text-sm text-brown-100/70 mb-1">Sifariş nömrəniz</p>
        <p className="font-mono text-lg text-brown-300 mb-5">#{success.orderId.slice(0, 8)}</p>
        <p className="text-brown-100/80 text-sm leading-relaxed mb-8">
          Sizi WhatsApp-a yönləndiririk — sifarişi təsdiqləmək üçün açılan mesajı bizə göndərin. Pəncərə açılmadısa,
          zəhmət olmasa bizimlə birbaşa əlaqə saxlayın.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-brown-300 text-cream-50 font-medium hover:bg-brown-400 transition-colors"
          >
            Ana səhifə
          </Link>
          <Link
            href="/mehsullar"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-sand-200 text-brown-100 font-medium hover:bg-sand-200/40 hover:text-brown-300 transition-colors"
          >
            Məhsullar
            <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    )
  } else if (!ready) {
    body = (
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="animate-spin text-brown-300" />
      </div>
    )
  } else if (items.length === 0) {
    body = (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sand-200/40 flex items-center justify-center">
          <ShoppingBag size={34} className="text-brown-100/60" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-brown-300 mb-2">Səbətiniz boşdur</h1>
        <p className="text-brown-100/80 mb-8">Məhsullara baxın və bəyəndiklərinizi səbətə əlavə edin.</p>
        <Link
          href="/mehsullar"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-brown-300 text-cream-50 font-medium hover:bg-brown-400 transition-colors"
        >
          Məhsullara bax
          <ArrowRight size={18} />
        </Link>
      </div>
    )
  } else {
    body = (
      <>
        <h1 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-8">Səbət</h1>
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 p-4 rounded-2xl bg-cream-50 border border-sand-200/50"
              >
                <Link
                  href={`/mehsullar/${item.slug}`}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-sand-200/30"
                >
                  {item.image ? (
                    <ProductImage src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sand-400 text-[10px]">
                      Şəkil yoxdur
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/mehsullar/${item.slug}`}
                      className="font-medium text-brown-300 hover:text-accent-rose transition-colors line-clamp-2 leading-snug"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(item.productId)}
                      aria-label="Səbətdən sil"
                      className="shrink-0 p-1.5 text-brown-100/60 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-brown-100/80 mt-0.5">{money(item.price)} ₼</p>

                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-full border border-sand-200 bg-cream-50">
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.qty - 1)}
                        disabled={item.qty <= 1}
                        aria-label="Azalt"
                        className="w-9 h-9 flex items-center justify-center text-brown-100 hover:text-brown-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-brown-300 tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.qty + 1)}
                        aria-label="Artır"
                        className="w-9 h-9 flex items-center justify-center text-brown-100 hover:text-brown-300 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-semibold text-brown-300 tabular-nums">
                      {money(item.price * item.qty)} ₼
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary + discount + checkout */}
          <div className="space-y-5 lg:sticky lg:top-24">
            {/* Discount */}
            <div className="p-5 rounded-2xl bg-cream-100 border border-sand-200/50">
              <p className="text-sm font-medium text-brown-300 mb-3">Endirim kodu</p>
              {discount ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-accent-sage/40 bg-accent-sage/10 px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-brown-300">
                    <Tag size={16} className="text-accent-sage" />
                    {discount.code}
                    <span className="text-accent-sage">−{discount.percentage}%</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscount}
                    aria-label="Kodu sil"
                    className="p-1 text-brown-100/60 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400" size={16} />
                      <input
                        type="text"
                        value={codeInput}
                        onChange={(e) => {
                          setCodeInput(e.target.value.toUpperCase())
                          setDiscountError('')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') applyDiscount()
                        }}
                        placeholder="Kod daxil edin"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-sm text-brown-300 placeholder:text-brown-100/50 focus:outline-none focus:ring-2 focus:ring-accent-rose/40 focus:border-accent-rose/40 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyDiscount}
                      disabled={discountLoading || !codeInput.trim()}
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brown-300 text-cream-50 text-sm font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors"
                    >
                      {discountLoading ? <Loader2 size={16} className="animate-spin" /> : 'Tətbiq et'}
                    </button>
                  </div>
                  {discountError && <p className="mt-2 text-xs text-red-500">{discountError}</p>}
                </>
              )}
            </div>

            {/* Summary */}
            <div className="p-5 rounded-2xl bg-cream-100 border border-sand-200/50 space-y-2.5">
              <div className="flex justify-between text-sm text-brown-100">
                <span>Ara cəm</span>
                <span className="tabular-nums">{money(subtotal)} ₼</span>
              </div>
              {discount && (
                <div className="flex justify-between text-sm text-accent-sage">
                  <span>Endirim ({discount.percentage}%)</span>
                  <span className="tabular-nums">−{money(discountAmount)} ₼</span>
                </div>
              )}
              <div className="flex justify-between pt-2.5 border-t border-sand-200/60 text-base font-semibold text-brown-300">
                <span>Yekun</span>
                <span className="tabular-nums">{money(total)} ₼</span>
              </div>
            </div>

            {/* Checkout form */}
            <div className="p-5 rounded-2xl bg-cream-50 border border-sand-200/50 space-y-3">
              <p className="text-sm font-medium text-brown-300">Çatdırılma məlumatları</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ad *"
                className={inputClass}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefon *"
                className={inputClass}
              />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ünvan"
                className={inputClass}
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Qeyd"
                rows={3}
                className={`${inputClass} resize-none`}
              />

              {formError && <p className="text-xs text-red-500">{formError}</p>}
              {orderError && <p className="text-xs text-red-500">{orderError}</p>}

              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brown-300 text-cream-50 font-medium hover:bg-brown-400 shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <ShoppingBag size={18} />}
                {submitting ? 'Göndərilir...' : 'Sifarişi tamamla'}
              </button>
              <p className="text-[11px] text-center text-brown-100/60 leading-relaxed">
                Sifariş təsdiqi üçün WhatsApp-a yönləndiriləcəksiniz.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">{body}</div>
      </main>
      <Footer />
    </>
  )
}
