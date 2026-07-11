import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HairAnalysisForm } from '@/components/HairAnalysisForm'

export const dynamic = 'force-dynamic'

export default function AnalysisPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-3">
              Saç Analizi
            </h1>
            <p className="text-brown-100/80 max-w-lg mx-auto">
              Bir neçə suala cavab verin, saçınızın vəziyyətini analiz edək və sizə uyğun qulluq rutini tövsiyə edək.
            </p>
          </div>
          <HairAnalysisForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
