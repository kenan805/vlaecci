import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductDetail } from '@/components/ProductDetail'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'
import { listHairTypes } from '@/lib/hair-types'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [product, hairTypes] = await Promise.all([getProductBySlug(slug), listHairTypes(true)])

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <ProductDetail product={product} hairTypes={hairTypes.map(({ id, label }) => ({ id, label }))} />
      </main>
      <Footer />
    </>
  )
}
