'use client'

import { motion } from 'framer-motion'

const results = [
  {
    metric: '89%',
    label: 'Daha güclü saç',
    desc: '8 həftə istifadədən sonra',
  },
  {
    metric: '76%',
    label: 'Saç dökülməsinin azalması',
    desc: 'Müştəri təcrübələri',
  },
  {
    metric: '4x',
    label: 'Sürətli böyümə',
    desc: 'Vitamin və mineral dəstəyi ilə',
  },
]

export function BeforeAfter() {
  return (
    <section className="py-20 md:py-28 bg-cream-100/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-4">
            Nəticələr danışır
          </h2>
          <p className="text-brown-100/80 max-w-2xl mx-auto">
            Minlərlə müştərimiz VLAECCI məhsulları ilə saçlarında real dəyişiklik gördü.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {results.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-cream-50 rounded-2xl p-8 text-center shadow-sm border border-sand-200/50 hover:shadow-md transition-shadow"
            >
              <div className="text-4xl md:text-5xl font-serif font-medium text-accent-rose mb-2">
                {item.metric}
              </div>
              <div className="text-brown-300 font-medium mb-1">{item.label}</div>
              <div className="text-sm text-brown-100/70">{item.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Visual before/after placeholder - real images would go here */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          <div className="aspect-[4/3] rounded-2xl bg-sand-200/50 flex items-center justify-center border border-sand-300/30">
            <span className="text-sand-400 text-sm">ƏVVƏL - Foto nümunə</span>
          </div>
          <div className="aspect-[4/3] rounded-2xl bg-sand-200/50 flex items-center justify-center border border-sand-300/30">
            <span className="text-sand-400 text-sm">SONRA - Foto nümunə</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
