'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from './api'
import { DEFAULT_CONTACT_PHONE } from './contact-phone'

// One request per page load, shared by every component that needs the number.
let cached: string | null = null
let pending: Promise<string> | null = null

function loadContactPhone(): Promise<string> {
  if (!pending) {
    pending = apiFetch('/settings/contact', { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (typeof d?.phone === 'string' && d.phone ? d.phone : DEFAULT_CONTACT_PHONE))
      .catch(() => DEFAULT_CONTACT_PHONE)
      .then((phone) => (cached = phone))
  }
  return pending
}

/** The shop's contact number from "Sayt ayarları"; null until it has loaded. */
export function useContactPhone(): string | null {
  const [phone, setPhone] = useState<string | null>(cached)
  useEffect(() => {
    if (cached) return
    let active = true
    loadContactPhone().then((p) => active && setPhone(p))
    return () => {
      active = false
    }
  }, [])
  return phone
}

/** For one-off use outside React render (e.g. when sending an order). */
export function getContactPhoneNow(): Promise<string> {
  return cached ? Promise.resolve(cached) : loadContactPhone()
}
