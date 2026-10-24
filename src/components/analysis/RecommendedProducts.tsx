'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Check, ShoppingBag } from 'lucide-react'
import { ProductImage } from '../ProductImage'
import { VariantSelector } from '../VariantSelector'
import { useCart } from '@/lib/cart'
import { formatMoney, variantDisplayName, variantImages, type ProductVariant } from '@/lib/variants'
import type { AnalysisProduct } from '@/lib/analysis'

/** Recommended products on the hair analysis result: add one or all of them to the cart in place. */
export function RecommendedProducts({ products }: { products: AnalysisProduct[] }) {
  const { add, count } = useCart()
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [added, setAdded] = useState<Set<string>>(new Set())

  const variantOf = (p: AnalysisProduct): ProductVariant | null =>
    p.variants.find((v) => v.id === selected[p.id]) ?? p.variants[0] ?? null

  const addToCart = (p: AnalysisProduct) => {
    const variant = variantOf(p)
    const images = variantImages(p.images, variant, p.variantImages)
    add({
      productId: p.id,
      variantId: variant?.id ?? null,
      variantLabel: variant ? variantDisplayName(variant) : null,
      name: p.name,
      slug: p.slug,
      price: variant ? variant.price : p.price,
      image: images[0] ?? null,
    })
    setAdded((cur) => new Set(cur).add(p.id))
  }

  const notAdded = products.filter((p) => !added.has(p.id))
  // Price of what "add all" would add now, i.e. only the products not added yet.
  const remainingTotal = notAdded.reduce((sum, p) => sum + (variantOf(p)?.price ?? p.price), 0)
  const addAllLabel =
    notAdded.length === 0
      ? 'Hamısı səbətdədir'
      : `${notAdded.length === products.length ? 'Hamısını' : 'Qalanları'} səbətə əlavə et · ${formatMoney(remainingTotal)} ₼`

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-serif text-xl font-medium text-brown-300">Sizin üçün tövsiyə olunan məhsullar</h3>
        {products.length > 1 && (
          <button
            type="button"
            onClick={() => notAdded.forEach(addToCart)}
            disabled={notAdded.length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-brown-300 px-4 text-sm font-medium text-brown-300 hover:bg-brown-300 hover:text-cream-50 disabled:border-sand-300 disabled:text-brown-100/50 disabled:hover:bg-transparent transition-colors"
          >
            {notAdded.length === 0 ? <Check size={16} /> : <ShoppingBag size={16} />}
            {addAllLabel}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {products.map((p, i) => {
          const variant = variantOf(p)
          const images = variantImages(p.images, variant, p.variantImages)
          const price = variant ? variant.price : p.price
          const isAdded = added.has(p.id)
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex gap-4 rounded-2xl border border-sand-200/60 bg-cream-100 p-3 pr-4"
            >
              <Link
                href={`/mehsullar/${p.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-200/40"
                aria-label={p.name}
              >
                {images[0] ? (
                  <ProductImage src={images[0]} alt="" fill className="object-cover" sizes="96px" />
                ) : null}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/mehsullar/${p.slug}`}
                  className="group inline-flex items-start gap-1 font-medium leading-snug text-brown-300 hover:text-accent-rose transition-colors"
                >
                  <span className="line-clamp-2">{p.name}</span>
                  <ArrowRight size={14} className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                {variant && p.variants.length === 1 && (
                  <span className="mt-1 text-xs text-brown-100/70">{variantDisplayName(variant)}</span>
                )}
                {p.variants.length > 1 && (
                  <div className="mt-2">
                    <VariantSelector
                      compact
                      variants={p.variants}
                      value={variant?.id ?? null}
                      onChange={(id) => {
                        setSelected((cur) => ({ ...cur, [p.id]: id }))
                        setAdded((cur) => {
                          const next = new Set(cur)
                          next.delete(p.id)
                          return next
                        })
                      }}
                    />
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="text-sm font-semibold text-brown-300 tabular-nums">
                    {formatMoney(price)} ₼
                  </span>
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors ${
                      isAdded
                        ? 'bg-accent-sage/20 text-accent-sage'
                        : 'bg-brown-300 text-cream-50 hover:bg-brown-400'
                    }`}
                    aria-label={isAdded ? `${p.name} səbətə əlavə edildi, bir dəfə də əlavə et` : `${p.name} səbətə əlavə et`}
                  >
                    {isAdded ? <Check size={14} /> : <ShoppingBag size={14} />}
                    {isAdded ? 'Əlavə edildi' : 'Səbətə'}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {added.size > 0 && count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent-sage/30 bg-accent-sage/10 px-5 py-3"
          role="status"
        >
          <span className="text-sm text-brown-300">
            Səbətinizdə <span className="font-semibold tabular-nums">{count}</span> məhsul var
          </span>
          <Link
            href="/sebet"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-brown-300 px-5 text-sm font-medium text-cream-50 hover:bg-brown-400 transition-colors"
          >
            Səbətə keç
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  )
}
