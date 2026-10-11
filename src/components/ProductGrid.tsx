'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Check } from 'lucide-react'
import { ProductImage } from './ProductImage'
import { apiFetch } from '@/lib/api'
import { useCart } from '@/lib/cart'
import { formatMoney, variantDisplayName, variantImages, type ProductVariant } from '@/lib/variants'
import { VariantSelector } from './VariantSelector'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  images: string[]
  variants: ProductVariant[]
  variantImages: boolean
  category: { name: string }
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [addedId, setAddedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const { add } = useCart()

  const selectedVariant = (p: Product): ProductVariant | null =>
    p.variants?.find((v) => v.id === selected[p.id]) ?? p.variants?.[0] ?? null

  useEffect(() => {
    apiFetch('/products')
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category?.name).filter(Boolean)))]
  const filtered = category === 'all' ? products : products.filter((p) => p.category?.name === category)

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse aspect-square bg-sand-200/50 rounded-xl" />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-brown-100/80">
        <p>Tezliklə məhsullar əlavə ediləcək.</p>
        <Link href="/analiz" className="text-accent-rose mt-4 inline-block hover:underline">
          Saç analizinə baxın
        </Link>
      </div>
    )
  }

  return (
    <>
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-brown-300 text-cream-50'
                  : 'bg-cream-200 text-brown-100 hover:bg-sand-200'
              }`}
            >
              {cat === 'all' ? 'Hamısı' : cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product) => {
          const variant = selectedVariant(product)
          const images = variantImages(product.images || [], variant, product.variantImages)
          const price = variant ? variant.price : product.price
          return (
          <Link
            key={product.id}
            href={`/mehsullar/${product.slug}`}
            className="group block bg-cream-50 rounded-xl overflow-hidden border border-sand-200/50 hover:shadow-md hover:border-sand-300 transition-all"
          >
            <div className="aspect-square relative bg-sand-200/30">
              {images[0] ? (
                <ProductImage
                  key={images[0]}
                  src={images[0]}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sand-400 text-xs">
                  Şəkil yoxdur
                </div>
              )}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-cream-50/90 rounded text-[10px] font-medium text-brown-100">
                {product.category?.name}
              </div>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-brown-300 group-hover:text-accent-rose transition-colors line-clamp-2 leading-snug">
                {product.name}
              </h3>
              {product.variants?.length > 0 && (
                <div className="mt-2">
                  <VariantSelector
                    compact
                    variants={product.variants}
                    value={variant?.id ?? null}
                    onChange={(id) => setSelected((cur) => ({ ...cur, [product.id]: id }))}
                  />
                  {variant?.label && <p className="mt-1 text-[11px] text-accent-rose">{variant.label}</p>}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-brown-300 text-sm font-semibold">{formatMoney(price)} ₼</p>
                <button
                  type="button"
                  aria-label="Səbətə əlavə et"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    add({
                      productId: product.id,
                      variantId: variant?.id ?? null,
                      variantLabel: variant ? variantDisplayName(variant) : null,
                      name: product.name,
                      slug: product.slug,
                      price,
                      image: images[0] ?? null,
                    })
                    setAddedId(product.id)
                    window.setTimeout(
                      () => setAddedId((cur) => (cur === product.id ? null : cur)),
                      1000
                    )
                  }}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    addedId === product.id
                      ? 'bg-accent-sage/20 text-accent-sage'
                      : 'bg-cream-200 text-brown-100 hover:bg-brown-300 hover:text-cream-50'
                  }`}
                >
                  {addedId === product.id ? <Check size={14} /> : <ShoppingBag size={14} />}
                  <span>{addedId === product.id ? 'Əlavə' : 'Səbətə'}</span>
                </button>
              </div>
            </div>
          </Link>
          )
        })}
      </div>
    </>
  )
}
