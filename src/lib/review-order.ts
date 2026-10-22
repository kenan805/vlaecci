/** Reviews shown on the product page before "Daha çox göstər". */
export const INITIAL_VISIBLE_REVIEWS = 3

interface SortableReview {
  rating: number
  comment: string
  images: string[]
  createdAt: string
}

/** 0 = photos and text, 1 = text, 2 = everything else (photos only, stars only). */
function displayTier(r: SortableReview) {
  const hasText = r.comment.trim() !== ''
  if (hasText && r.images.length > 0) return 0
  if (hasText) return 1
  return 2
}

/**
 * Product page order: reviews with photos and text first, then text-only, then the rest;
 * within each group highest rating first, then newest first.
 */
export function sortReviewsForDisplay<T extends SortableReview>(reviews: T[]): T[] {
  return [...reviews].sort(
    (a, b) =>
      displayTier(a) - displayTier(b) ||
      b.rating - a.rating ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}
