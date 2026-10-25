/** The shop's contact number — shared by server and client (no DB imports here). */
import { formatAzPhone } from './phone'

/** Used until the admin sets a number in "Sayt ayarları". */
export const DEFAULT_CONTACT_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+994557087999'

/** "+994 (055) 708-79-99" */
export function displayPhone(phone: string): string {
  return formatAzPhone(phone) || phone
}

/** tel: link, e.g. "tel:+994557087999" */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/\D/g, '')}`
}

/** WhatsApp chat link, optionally with a prefilled message. */
export function whatsappHref(phone: string, text?: string): string {
  const url = `https://wa.me/${phone.replace(/\D/g, '')}`
  return text ? `${url}?text=${encodeURIComponent(text)}` : url
}
