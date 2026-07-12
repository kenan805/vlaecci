import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { HairAnalysisForm } from '@/components/HairAnalysisForm'

export const dynamic = 'force-dynamic'

export default function AnalysisPage() {
  return (
    <>
      <Header />
      <main className="pt-20 pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <HairAnalysisForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
