/** Product size/volume variants — shared by server and client (no DB imports here). */

export const VARIANT_UNITS = [
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'L' },
  { value: 'g', label: 'qr' },
  { value: 'kg', label: 'kq' },
  { value: 'pcs', label: 'ədəd' },
] as const

export type VariantUnit = (typeof VARIANT_UNITS)[number]['value']

export interface ProductVariant {
  id: string
  amount: number
  unit: VariantUnit
  label: string
  price: number
  images: string[]
  sortOrder: number
  isActive: boolean
}

export function isVariantUnit(value: unknown): value is VariantUnit {
  return VARIANT_UNITS.some((u) => u.value === value)
}

export function unitLabel(unit: string): string {
  return VARIANT_UNITS.find((u) => u.value === unit)?.label ?? unit
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2))).replace('.', ',')
}

/** "30 ml", "1,5 L" */
export function variantSize(v: Pick<ProductVariant, 'amount' | 'unit'>): string {
  return `${formatAmount(v.amount)} ${unitLabel(v.unit)}`
}

/** "20 ml · Test versiya" — used in cart, orders and WhatsApp messages. */
export function variantDisplayName(v: Pick<ProductVariant, 'amount' | 'unit' | 'label'>): string {
  return v.label ? `${variantSize(v)} · ${v.label}` : variantSize(v)
}

/** Images to show for a variant: its own when the product uses per-variant images and it has some. */
export function variantImages(productImages: string[], variant: ProductVariant | null, perVariant: boolean): string[] {
  if (perVariant && variant && variant.images.length > 0) return variant.images
  return productImages
}

export function formatMoney(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
