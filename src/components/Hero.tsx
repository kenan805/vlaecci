'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-gradient-to-b from-cream-200/50 via-cream-50 to-cream-100" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent-rose/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-accent-sage/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream-200/80 text-brown-100 text-sm mb-6"
        >
          <Sparkles size={16} className="text-accent-rose" />
          Dermatoloq təsdiqli
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-brown-300 leading-tight mb-6"
        >
          Saçınız yenidən
          <br />
          <span className="text-accent-rose">güclü və canlı</span> olsun
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-brown-100/80 max-w-2xl mx-auto mb-10"
        >
          Saç dökülməsi və zəif böyümə problemlərinə təbii həll.
          Tədqiqat əsasında hazırlanmış serumlar və saç baxım məhsulları.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/mehsullar"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 transition-colors"
          >
            Alış-verişə başla
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-brown-200 text-brown-300 rounded-full font-medium hover:bg-cream-200/50 transition-colors"
          >
            Saç diaqnostikası
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream-100 to-transparent" />
    </section>
  )
}
