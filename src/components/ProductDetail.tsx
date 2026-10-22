'use client'

import { useEffect, useState } from 'react'
import { ProductImage } from './ProductImage'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Check,
  Minus,
  Plus,
} from 'lucide-react'
import { DiscountCodeInput } from './DiscountCodeInput'
import { apiFetch } from '@/lib/api'
import { useCart } from '@/lib/cart'
import type { ProductDetail as ProductDetailType, ProductReview } from '@/lib/products'
import { formatMoney, variantDisplayName, variantImages } from '@/lib/variants'
import { VariantSelector } from './VariantSelector'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { ProductRating, RatingStars } from './reviews/RatingStars'
import { ReviewImages } from './reviews/ImageLightbox'
import { ReviewForm } from './reviews/ReviewForm'

/** dd.mm.yyyy in UTC — identical on server and client, so hydration matches. */
function formatReviewDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`
}

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
  const [variantId, setVariantId] = useState<string | null>(product.variants?.[0]?.id ?? null)
  const variant = product.variants?.find((v) => v.id === variantId) ?? null
  const shownImages = variantImages(product.images || [], variant, product.variantImages)
  const images = shownImages.length ? shownImages : ['']
  const price = variant ? variant.price : product.price

  const teaser = product.beforeAfter?.[0] ?? null

  const selectVariant = (id: string) => {
    setVariantId(id)
    setActiveImage(0)
  }
  const [reviewFilter, setReviewFilter] = useState<string>('all')
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews)
  const [rating, setRating] = useState(product.rating)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const { add } = useCart()

  const handleAddToCart = () => {
    add(
      {
        productId: product.id,
        variantId: variant?.id ?? null,
        variantLabel: variant ? variantDisplayName(variant) : null,
        name: product.name,
        slug: product.slug,
        price,
        image: shownImages[0] ?? null,
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
    ? reviews
    : reviews.filter((r) => r.hairType === reviewFilter)

  const hairTypesInReviews = Array.from(new Set(reviews.map((r) => r.hairType).filter(Boolean)))

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
          {teaser && (
            <a
              href="#neticeler"
              className="group mt-4 flex items-center gap-4 rounded-2xl border border-sand-200/70 bg-cream-100/70 p-3 pr-5 transition-colors hover:border-brown-300/30 hover:bg-cream-100"
            >
              <span className="relative flex h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-1 ring-brown-300/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teaser.beforeImage} alt="" className="h-full w-1/2 object-cover" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={teaser.afterImage} alt="" className="h-full w-1/2 object-cover" />
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/90" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-rose">
                  Əvvəl / Sonra
                </span>
                <span className="mt-0.5 block text-sm font-medium text-brown-300">
                  {product.beforeAfter.length > 1
                    ? `${product.beforeAfter.length} real nəticəyə baxın`
                    : 'Real nəticəyə baxın'}
                </span>
              </span>
              <ArrowDown size={18} className="shrink-0 text-brown-100 transition-transform group-hover:translate-y-0.5" />
            </a>
          )}
        </div>

        <div>
          <span className="text-sm text-accent-rose font-medium">{product.category?.name}</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mt-1 mb-2">
            {product.name}
          </h1>
          {rating?.count > 0 && (
            <a href="#reyler" className="inline-flex mb-3 hover:opacity-80 transition-opacity">
              <ProductRating rating={rating} size={18} />
            </a>
          )}
          <p className="text-4xl font-medium text-brown-300 mb-6 mt-2">{formatMoney(price)} ₼</p>
          {product.variants?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-brown-200 mb-2.5">
                Həcm:{' '}
                <span className="text-brown-300">{variant ? variantDisplayName(variant) : ''}</span>
              </p>
              <VariantSelector variants={product.variants} value={variant?.id ?? null} onChange={selectVariant} />
            </div>
          )}
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

      {product.beforeAfter?.length > 0 && (
        <section
          id="neticeler"
          className="mb-16 scroll-mt-28 rounded-[32px] bg-cream-100/60 px-4 py-12 sm:px-8 md:py-16"
        >
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-medium text-brown-300 md:text-4xl">Nəticələr özü danışır</h2>
            <p className="mx-auto mt-3 max-w-xl text-brown-100/80">
              {product.name} istifadə edən müştərilərimizin real əvvəl və sonra görüntüləri.
            </p>
          </div>
          <BeforeAfterSlider results={product.beforeAfter} />
        </section>
      )}

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

        <section id="reyler" className="py-8 scroll-mt-28">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6">
            <h2 className="font-serif text-2xl font-medium text-brown-300">Müştəri rəyləri</h2>
            <ProductRating rating={rating} size={18} />
          </div>

          {reviews.length > 0 && (
            <>
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
                    const label = reviews.find((r) => r.hairType === ht)?.hairTypeLabel || ht
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

              <div className="space-y-4 mb-8">
                {filteredReviews.map((review) => (
                  <article key={review.id} className="p-5 bg-cream-100 rounded-2xl border border-sand-200/50">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-brown-300">{review.authorName || 'Anonim'}</span>
                        {review.hairTypeLabel && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent-sage/20 text-brown-100">
                            {review.hairTypeLabel}
                          </span>
                        )}
                      </div>
                      <time dateTime={review.createdAt} className="text-xs text-brown-100/60">
                        {formatReviewDate(review.createdAt)}
                      </time>
                    </div>
                    <span className="sr-only">{review.rating} / 5</span>
                    <RatingStars value={review.rating} size={14} />
                    {review.comment && (
                      <p className="mt-2 text-brown-100/90 text-sm leading-relaxed whitespace-pre-line">{review.comment}</p>
                    )}
                    {review.images.length > 0 && (
                      <div className="mt-3">
                        <ReviewImages images={review.images} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          <ReviewForm
            productSlug={product.slug}
            onPublished={(review, next) => {
              setReviews((cur) => [review, ...cur])
              setRating(next)
            }}
          />
        </section>
      </div>
    </div>
  )
}
