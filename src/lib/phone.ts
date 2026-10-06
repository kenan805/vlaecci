/** Azerbaijani mobile operator codes (the two digits after the leading 0). */
const MOBILE_CODES = ['10', '50', '51', '55', '60', '70', '77', '99']

export const PHONE_PLACEHOLDER = '+994 (0XX) XXX-XX-XX'

/** Local number digits, always starting with 0, at most 10 digits (e.g. "0993334405"). */
function localDigits(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('994')) digits = digits.slice(3)
  if (digits && !digits.startsWith('0')) digits = `0${digits}`
  return digits.slice(0, 10)
}

/** Formats as the user types: "+994 (099) 333-44-05". */
export function formatAzPhone(input: string): string {
  const d = localDigits(input)
  if (!d) return ''
  let out = `+994 (${d.slice(0, 3)}`
  if (d.length > 3) out += `) ${d.slice(3, 6)}`
  if (d.length > 6) out += `-${d.slice(6, 8)}`
  if (d.length > 8) out += `-${d.slice(8, 10)}`
  return out
}

export function isValidAzPhone(input: string): boolean {
  const d = localDigits(input)
  return d.length === 10 && MOBILE_CODES.includes(d.slice(1, 3))
}
