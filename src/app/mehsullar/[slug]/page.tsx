import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductDetail } from '@/components/ProductDetail'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/products'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <ProductDetail product={product} />
      </main>
      <Footer />
    </>
  )
}
