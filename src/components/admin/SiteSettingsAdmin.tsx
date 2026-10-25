'use client'

import { useEffect, useState } from 'react'
import { Loader2, MessageCircle, Phone } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { formatAzPhone, isValidAzPhone, PHONE_PLACEHOLDER } from '@/lib/phone'
import { displayPhone, telHref, whatsappHref } from '@/lib/contact-phone'
import { PageHeader, Card, PrimaryButton, fieldClassName, labelClassName } from './ui'
import { useToast } from './Toast'

/** Site-wide settings. For now: the contact number (footer + WhatsApp orders). */
export function SiteSettingsAdmin() {
  const { toast } = useToast()
  const [saved, setSaved] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    let active = true
    apiFetch('/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (!active || typeof d.contactPhone !== 'string') return
        setSaved(d.contactPhone)
        setPhone(formatAzPhone(d.contactPhone))
      })
      .catch(() => active && toast('Ayarlar yüklənmədi', 'error'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [toast])

  const valid = isValidAzPhone(phone)
  const unchanged = saved !== null && formatAzPhone(saved) === phone

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    setSaving(true)
    try {
      const res = await apiFetch('/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactPhone: phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Saxlanılmadı')
      setSaved(data.contactPhone)
      setPhone(formatAzPhone(data.contactPhone))
      setTouched(false)
      toast('Əlaqə nömrəsi yeniləndi')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Saxlanılmadı', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Sayt ayarları" subtitle="Saytda göstərilən ümumi məlumatlar" />

      <Card className="p-5 sm:p-6">
        <form onSubmit={handleSubmit} noValidate>
          <h3 className="font-medium text-brown-300">Əlaqə nömrəsi</h3>
          <p className="mt-1 text-sm text-brown-100/70">
            Saytın aşağısında (footer) göstərilir. Səbətdən verilən sifarişlər də WhatsApp-da bu nömrəyə göndərilir.
          </p>

          <div className="mt-5">
            <label htmlFor="contact-phone" className={labelClassName}>
              Telefon (WhatsApp)
            </label>
            {loading ? (
              <div className="flex h-[42px] items-center gap-2 text-sm text-brown-100/60">
                <Loader2 size={16} className="animate-spin" /> Yüklənir...
              </div>
            ) : (
              <input
                id="contact-phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                value={phone}
                onChange={(e) => setPhone(formatAzPhone(e.target.value))}
                onBlur={() => setTouched(true)}
                placeholder={PHONE_PLACEHOLDER}
                aria-invalid={touched && !valid}
                aria-describedby="contact-phone-help"
                className={`${fieldClassName} tabular-nums ${touched && !valid ? '!border-red-300 focus:!ring-red-200' : ''}`}
              />
            )}
            <p
              id="contact-phone-help"
              className={`mt-1.5 text-xs ${touched && !valid ? 'text-red-600' : 'text-brown-100/60'}`}
            >
              {touched && !valid
                ? 'Mobil nömrə daxil edin, məs. +994 (055) 708-79-99'
                : 'Azərbaycan mobil nömrəsi (010, 050, 051, 055, 060, 070, 077, 099)'}
            </p>
          </div>

          {saved && (
            <div className="mt-5 rounded-xl border border-sand-200/70 bg-cream-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-brown-100/60">Saytda hazırda</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <a href={telHref(saved)} className="inline-flex items-center gap-2 text-brown-300 hover:text-accent-rose tabular-nums">
                  <Phone size={15} /> {displayPhone(saved)}
                </a>
                <a
                  href={whatsappHref(saved)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brown-300 hover:text-accent-rose"
                >
                  <MessageCircle size={15} /> WhatsApp-da yoxla
                </a>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <PrimaryButton type="submit" disabled={loading || saving || unchanged}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Saxlanılır...' : 'Yadda saxla'}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  )
}
