'use client'

import { useEffect, useState } from 'react'
import { ProductImage } from './ProductImage'
import Link from 'next/link'
import { ArrowLeft, Star, ChevronDown, ChevronUp, ShoppingBag, Check, Minus, Plus } from 'lucide-react'
import { DiscountCodeInput } from './DiscountCodeInput'
import { apiFetch } from '@/lib/api'
import { useCart } from '@/lib/cart'
import type { ProductDetail as ProductDetailType } from '@/lib/products'

interface ProductDetailProps {
  product: ProductDetailType
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-sand-200/60 py-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="font-serif text-xl font-medium text-brown-300">{title}</h2>
        {open ? <ChevronUp size={20} className="text-brown-100" /> : <ChevronDown size={20} className="text-brown-100" />}
      </button>
      {open && <div className="mt-4 text-brown-100/90 leading-relaxed whitespace-pre-line">{children}</div>}
    </div>
  )
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0)
  const images = product.images?.length ? product.images : ['']
  const [reviewFilter, setReviewFilter] = useState<string>('all')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  const handleAddToCart = () => {
    add(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images?.[0] ?? null,
      },
      qty
    )
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  useEffect(() => {
    if (!product.slug) return
    apiFetch(`/products/${product.slug}/view`, { method: 'POST' }).catch(() => {})
  }, [product.slug])

  const filteredReviews = reviewFilter === 'all'
    ? product.reviews
    : product.reviews.filter((r) => r.hairType === reviewFilter)

  const hairTypesInReviews = Array.from(new Set(product.reviews.map((r) => r.hairType)))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <Link
        href="/mehsullar"
        className="inline-flex items-center gap-2 text-brown-100 hover:text-brown-300 mb-8 text-sm"
      >
        <ArrowLeft size={16} />
        Məhsullara qayıt
      </Link>

      <div className="grid md:grid-cols-2 gap-12 mb-16">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-sand-200/30 relative mb-4">
            {images[activeImage] ? (
              <ProductImage
                src={images[activeImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sand-400">
                Şəkil yoxdur
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                    activeImage === i ? 'border-brown-300' : 'border-transparent'
                  }`}
                >
                  <ProductImage src={img} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-sm text-accent-rose font-medium">{product.category?.name}</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mt-1 mb-4">
            {product.name}
          </h1>
          <p className="text-4xl font-medium text-brown-300 mb-6">{product.price} ₼</p>
          <p className="text-brown-100/90 leading-relaxed mb-8">{product.description}</p>

          <div className="flex items-stretch gap-3 mb-6">
            <div className="inline-flex items-center rounded-full border border-sand-200 bg-cream-50 px-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Azalt"
                className="w-10 h-10 flex items-center justify-center text-brown-100 hover:text-brown-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center font-medium text-brown-300 tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Artır"
                className="w-10 h-10 flex items-center justify-center text-brown-100 hover:text-brown-300 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors ${
                added ? 'bg-accent-sage text-cream-50' : 'bg-brown-300 text-cream-50 hover:bg-brown-400'
              }`}
            >
              {added ? (
                <>
                  <Check size={18} /> Səbətə əlavə edildi ✓
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> Səbətə əlavə et
                </>
              )}
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-brown-100 mb-2">Endirim kodunuz var?</p>
            <DiscountCodeInput
              onValid={(code, pct) => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('vlaecci_discount', JSON.stringify({ code, percentage: pct }))
                }
              }}
            />
          </div>

          <Link
            href="/elaqe"
            className="inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 transition-colors"
          >
            Sifariş və ya sual üçün əlaqə
          </Link>
        </div>
      </div>

      <div className="max-w-3xl">
        {product.ingredients && (
          <Section title="Tərkibi">
            {product.ingredients}
          </Section>
        )}
        {product.howToUse && (
          <Section title="İstifadə qaydası">
            {product.howToUse}
          </Section>
        )}

        {product.reviews.length > 0 && (
          <div className="py-8">
            <h2 className="font-serif text-2xl font-medium text-brown-300 mb-6">Müştəri rəyləri</h2>

            {hairTypesInReviews.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    reviewFilter === 'all' ? 'bg-brown-300 text-cream-50' : 'bg-sand-200 text-brown-100'
                  }`}
                >
                  Hamısı
                </button>
                {hairTypesInReviews.map((ht) => {
                  const label = product.reviews.find((r) => r.hairType === ht)?.hairTypeLabel || ht
                  return (
                    <button
                      key={ht}
                      type="button"
                      onClick={() => setReviewFilter(ht)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        reviewFilter === ht ? 'bg-brown-300 text-cream-50' : 'bg-sand-200 text-brown-100'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-5 bg-cream-100 rounded-2xl border border-sand-200/50">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="font-medium text-brown-300">{review.authorName}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent-sage/20 text-brown-100">
                        {review.hairTypeLabel}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < review.rating ? 'fill-accent-rose text-accent-rose' : 'text-sand-300'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-brown-100/90 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
