import { Star } from 'lucide-react'

/** Rounds to the nearest half star (4.3 → 4.5, 4.2 → 4). */
function roundToHalf(value: number) {
  return Math.round(value * 2) / 2
}

/** Five stars filled to `value`, supporting half stars. */
export function RatingStars({
  value,
  size = 16,
  className = '',
}: {
  value: number
  size?: number
  className?: string
}) {
  const rounded = roundToHalf(Math.min(5, Math.max(0, value)))
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, rounded - i))
        return (
          <span key={i} className="relative inline-block shrink-0" style={{ width: size, height: size }}>
            <Star size={size} strokeWidth={1.5} className="absolute inset-0 text-amber-400/70" />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} strokeWidth={1.5} className="fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

/**
 * Average rating of approved reviews with the review count, e.g. ★★★★½ (203).
 * Renders nothing when the product has no approved reviews.
 */
export function ProductRating({
  rating,
  size = 16,
  className = '',
}: {
  rating: { average: number; count: number } | null | undefined
  size?: number
  className?: string
}) {
  if (!rating || rating.count <= 0) return null
  const average = roundToHalf(rating.average)
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={`5 üzərindən ${String(average).replace('.', ',')} ulduz, ${rating.count} rəy`}
      title={`${rating.average.toFixed(1)} / 5`}
    >
      <RatingStars value={rating.average} size={size} />
      <span className="text-brown-100/80 tabular-nums" style={{ fontSize: Math.max(11, size - 2) }}>
        ({rating.count})
      </span>
    </span>
  )
}
