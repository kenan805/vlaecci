import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { BeforeAfter } from '@/components/BeforeAfter'
import { Benefits } from '@/components/Benefits'
import { Testimonials } from '@/components/Testimonials'
import { InstagramSection } from '@/components/InstagramSection'
import { CTASection } from '@/components/CTASection'
import { Footer } from '@/components/Footer'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <BeforeAfter />
        <Benefits />
        <Testimonials />
        <InstagramSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
