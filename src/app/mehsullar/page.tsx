import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProductGrid } from '@/components/ProductGrid'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-2">
            Məhsullar
          </h1>
          <p className="text-brown-100/80 mb-12">
            Dermatoloq təsdiqli saç baxım məhsullarımız.
          </p>
          <ProductGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}
