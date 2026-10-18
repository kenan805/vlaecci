'use client'

import { variantSize, type ProductVariant } from '@/lib/variants'

/** Size / volume chips. `compact` is used on product cards, the default size on the detail page. */
export function VariantSelector({
  variants,
  value,
  onChange,
  compact = false,
}: {
  variants: ProductVariant[]
  value: string | null
  onChange: (id: string) => void
  compact?: boolean
}) {
  if (variants.length === 0) return null

  return (
    <div role="radiogroup" aria-label="Həcm seçin" className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-2'}`}>
      {variants.map((v) => {
        const active = v.id === value
        return (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={v.label || undefined}
            onClick={(e) => {
              // Cards are wrapped in a link — picking a size must not navigate.
              e.preventDefault()
              e.stopPropagation()
              onChange(v.id)
            }}
            className={`inline-flex flex-col items-center justify-center border font-medium leading-none transition-colors ${
              compact ? 'min-w-[44px] rounded-full px-2 py-1 text-[11px]' : 'min-w-[76px] rounded-xl px-4 py-2.5 text-sm'
            } ${
              active
                ? 'border-brown-300 bg-brown-300 text-cream-50'
                : 'border-sand-200 bg-cream-50 text-brown-200 hover:border-brown-300/50'
            }`}
          >
            <span>{variantSize(v)}</span>
            {v.label && !compact && (
              <span className={`mt-1 text-[10px] font-normal ${active ? 'text-cream-50/80' : 'text-brown-100/60'}`}>
                {v.label}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
