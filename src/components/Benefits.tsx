'use client'

import { Leaf, Droplets, Shield, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const benefits = [
  {
    icon: Leaf,
    title: '100% Təbii',
    desc: 'Sulfat, paraben və sintetik qoxu yoxdur. Yalnız təbii və effektiv komponentlər.',
  },
  {
    icon: Droplets,
    title: 'Sulfatsız',
    desc: 'Saçları qurutmayan, rəngi saxlayan formulalar. Hər gün istifadə üçün uyğundur.',
  },
  {
    icon: Shield,
    title: 'Dermatoloq təsdiqli',
    desc: 'Həssas dəri və saçlı dəri üçün test edilmiş, təhlükəsiz məhsullar.',
  },
  {
    icon: Sparkles,
    title: 'Elmi əsaslı',
    desc: 'Tədqiqat əsasında seçilmiş aktiv maddələr - biotin, keratin, və təbii yağlar.',
  },
]

export function Benefits() {
  return (
    <section className="py-20 md:py-28 bg-cream-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-3xl md:text-4xl font-medium text-brown-300 mb-4">
            Niyə VLAECCI?
          </h2>
          <p className="text-brown-100/80 max-w-2xl mx-auto">
            Saçınızın ehtiyaclarına cavab verən, keyfiyyətli və təhlükəsiz məhsullar.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-cream-100/50 border border-sand-200/50 hover:border-accent-rose/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-rose/20 flex items-center justify-center mb-4 group-hover:bg-accent-rose/30 transition-colors">
                <item.icon className="text-accent-rose" size={24} />
              </div>
              <h3 className="font-medium text-brown-300 mb-2">{item.title}</h3>
              <p className="text-sm text-brown-100/80">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
