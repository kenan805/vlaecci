'use client'

import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'

// Placeholder grid - real Instagram API integration would fetch user posts
const placeholderPosts = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  image: `https://placehold.co/300x300/F5F1E9/DED5C8?text=Post+${i + 1}`,
  alt: `Instagram post ${i + 1}`,
}))

export function InstagramSection() {
  const instagramHandle = process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'vlaecci'

  return (
    <section className="py-20 md:py-28 bg-cream-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <a
            href={`https://instagram.com/${instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brown-300 hover:text-accent-rose transition-colors"
          >
            <Instagram size={24} />
            <span className="font-serif text-2xl md:text-3xl font-medium">@{instagramHandle}</span>
          </a>
          <p className="text-brown-100/80 mt-2">Bizi Instagram-da izləyin</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {placeholderPosts.map((post, i) => (
            <motion.a
              key={post.id}
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="aspect-square rounded-xl overflow-hidden bg-sand-200/50 hover:opacity-90 transition-opacity"
            >
              <img
                src={post.image}
                alt={post.alt}
                className="w-full h-full object-cover"
              />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
