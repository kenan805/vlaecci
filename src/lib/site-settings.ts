import { query } from './db'
import { DEFAULT_CONTACT_PHONE } from './contact-phone'

export const SETTING_CONTACT_PHONE = 'contact_phone'

async function getSetting(key: string): Promise<string | null> {
  const result = await query<{ value: string }>('SELECT value FROM site_settings WHERE key = $1', [key])
  return result.rows[0]?.value ?? null
}

async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  )
}

/** The contact number shown in the footer and used for WhatsApp orders. */
export async function getContactPhone(): Promise<string> {
  return (await getSetting(SETTING_CONTACT_PHONE)) || DEFAULT_CONTACT_PHONE
}

/** Expects the canonical "+994…" form (see toE164AzPhone). */
export async function setContactPhone(phone: string): Promise<void> {
  await setSetting(SETTING_CONTACT_PHONE, phone)
}
