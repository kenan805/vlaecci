'use client'

import { useState } from 'react'
import { Loader2, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export function ConsultationForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', hairIssue: '', notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      setSuccess(true)
      setForm({ name: '', phone: '', hairIssue: '', notes: '' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-cream-100/50 rounded-2xl p-8 border border-sand-200/50 text-center">
        <div className="w-16 h-16 rounded-full bg-accent-sage/20 flex items-center justify-center mx-auto mb-4">
          <Check className="text-accent-sage" size={32} />
        </div>
        <h2 className="font-serif text-xl font-medium text-brown-300 mb-2">
          Müraciətiniz qəbul edildi
        </h2>
        <p className="text-brown-100/80">
          Tezliklə sizinlə əlaqə saxlayacağıq. Suallarınız üçün WhatsApp-dan da yaza bilərsiniz.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-brown-100 mb-2">Ad, Soyad *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Adınız"
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brown-100 mb-2">Telefon *</label>
        <input
          type="tel"
          required
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+994 50 123 45 67"
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/50"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brown-100 mb-2">Saç problemi *</label>
        <textarea
          required
          rows={4}
          value={form.hairIssue}
          onChange={(e) => setForm((f) => ({ ...f, hairIssue: e.target.value }))}
          placeholder="Saç dökülməsi, zəif böyümə, quru saç və s."
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/50 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-brown-100 mb-2">Əlavə qeyd (isteğe bağlı)</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Əlavə məlumat..."
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/50 resize-none"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Göndər'}
      </button>
    </form>
  )
}
