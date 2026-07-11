interface ProductRow {
  id: string
  name: string
  slug: string
  price: string | number
  category_slug?: string
}

export function getRecommendedProducts(
  products: ProductRow[],
  answers: { hairLossLevel: string; hairType: string; scalpCondition: string }
) {
  const categoryPriority: Record<string, string[]> = {
    severe: ['serumlar', 'maskalar', 'sampunlar'],
    moderate: ['serumlar', 'sampunlar', 'maskalar'],
    mild: ['sampunlar', 'serumlar', 'maskalar'],
  }

  const scalpPriority: Record<string, string[]> = {
    oily: ['sampunlar', 'serumlar'],
    dry: ['maskalar', 'serumlar'],
    sensitive: ['maskalar', 'sampunlar'],
    normal: ['serumlar', 'sampunlar'],
  }

  const lossOrder = categoryPriority[answers.hairLossLevel] || ['serumlar', 'sampunlar', 'maskalar']
  const scalpOrder = scalpPriority[answers.scalpCondition] || []

  const scored = products.map((p) => {
    const catSlug = p.category_slug || ''
    let score = 0
    const lossIdx = lossOrder.indexOf(catSlug)
    if (lossIdx >= 0) score += 10 - lossIdx
    const scalpIdx = scalpOrder.indexOf(catSlug)
    if (scalpIdx >= 0) score += 5 - scalpIdx
    return { product: p, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const picked = scored.filter((s) => s.score > 0).slice(0, 3)
  const result = picked.length > 0 ? picked : scored.slice(0, 3)

  return result.map(({ product }) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
  }))
}
