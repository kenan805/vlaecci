import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ContactForm } from '@/components/ContactForm'

export const dynamic = 'force-dynamic'

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="pt-24 pb-16 min-h-screen">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-2">
            Əlaqə
          </h1>
          <p className="text-brown-100/80 mb-10">
            Təklif, şikayət və ya sifariş sorğusu üçün bizə yazın. Tezliklə cavab verəcəyik.
          </p>
          <ContactForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
