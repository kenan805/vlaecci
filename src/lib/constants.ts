export const HAIR_TYPES = [
  { value: 'oily', label: 'Yağlı saç dərisi' },
  { value: 'dry', label: 'Quru saç' },
  { value: 'curly', label: 'Buruq saç' },
  { value: 'colored', label: 'Boyanmış saç' },
  { value: 'hair_loss', label: 'Saç tökülməsi problemi' },
  { value: 'normal', label: 'Normal saç' },
] as const

export type HairType = (typeof HAIR_TYPES)[number]['value']

export function getHairTypeLabel(value: string): string {
  return HAIR_TYPES.find((h) => h.value === value)?.label || value
}
