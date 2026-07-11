'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

export function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-brown-300 text-cream-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-4xl font-medium mb-4"
        >
          Saçınızın yolunu tapın
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-cream-200/90 mb-8 max-w-xl mx-auto"
        >
          Pulsuz saç analizimizə cavab verin və sizin saç tipinizə uyğun məhsulları kəşf edin.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/analiz"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-cream-50 text-brown-300 rounded-full font-medium hover:bg-cream-100 transition-colors"
          >
            Analizə başla
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/mehsullar"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-cream-200 text-cream-50 rounded-full font-medium hover:bg-cream-50/10 transition-colors"
          >
            Bütün məhsullar
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
