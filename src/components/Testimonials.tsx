'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Leyla M.',
    handle: '@leyla.m',
    text: '3 aydan sonra saçlarım əslində daha güclü hiss olunur. Serum həqiqətən işləyir!',
    rating: 5,
  },
  {
    name: 'Aysel K.',
    handle: '@aysel.k',
    text: 'Saç dökülməsim azaldı və saçlarım daha parlaq görünür. Məsləhət edirəm.',
    rating: 5,
  },
  {
    name: 'Nigar R.',
    handle: '@nigar.r',
    text: 'Təbii məhsul axtarırdım - VLAECCI məndəki ən yaxşı seçim oldu.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-cream-100/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-4">
            Müştərilərimiz nə deyir
          </h2>
          <p className="text-brown-100/80 max-w-2xl mx-auto">
            Instagram-da bizimlə nəticələrini paylaşan minlərlə qadından bəziləri.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-cream-50 rounded-2xl p-6 border border-sand-200/50 shadow-sm"
            >
              <Quote className="text-accent-rose/50 mb-4" size={32} />
              <div className="flex gap-1 mb-3">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <Star key={j} size={16} className="fill-accent-rose text-accent-rose" />
                ))}
              </div>
              <p className="text-brown-100/90 mb-4 text-sm leading-relaxed">&quot;{item.text}&quot;</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-sand-200 flex items-center justify-center text-brown-100 font-medium text-sm">
                  {item.name[0]}
                </div>
                <div>
                  <div className="font-medium text-brown-300 text-sm">{item.name}</div>
                  <div className="text-xs text-brown-100/70">{item.handle}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
