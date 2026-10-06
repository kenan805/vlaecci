import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { BeforeAfter } from '@/components/BeforeAfter'
import { Benefits } from '@/components/Benefits'
import { Testimonials } from '@/components/Testimonials'
import { InstagramSection } from '@/components/InstagramSection'
import { CTASection } from '@/components/CTASection'
import { Footer } from '@/components/Footer'
import { listResults, listTestimonials } from '@/lib/home-content'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [results, testimonials] = await Promise.all([
    listResults(true).catch((err) => {
      console.error('Home results error:', err)
      return []
    }),
    listTestimonials(true).catch((err) => {
      console.error('Home testimonials error:', err)
      return []
    }),
  ])

  return (
    <>
      <Header />
      <main>
        <Hero />
        <BeforeAfter items={results} />
        <Benefits />
        <Testimonials items={testimonials} />
        <InstagramSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
