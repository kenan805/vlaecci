'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Send, CheckCircle } from 'lucide-react'

export function ContactForm() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [messageType, setMessageType] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, messageType, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      setSuccess(true)
      setName('')
      setContact('')
      setMessage('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle size={48} className="mx-auto text-accent-sage mb-4" />
        <h3 className="font-serif text-2xl text-brown-300 mb-2">Mesajınız qəbul edildi</h3>
        <p className="text-brown-100/80">Tezliklə sizinlə əlaqə saxlayacağıq.</p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm text-accent-rose hover:underline"
        >
          Yeni mesaj göndər
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-brown-100 mb-1">Adınız *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/30"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-brown-100 mb-1">E-poçt və ya telefon *</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="email@example.com və ya +994..."
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/30"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-brown-100 mb-1">Mesaj növü</label>
        <select
          value={messageType}
          onChange={(e) => setMessageType(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/30"
        >
          <option value="suggestion">Təklif</option>
          <option value="complaint">Şikayət</option>
          <option value="order">Sifariş sorğusu</option>
          <option value="other">Digər</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-brown-100 mb-1">Mesajınız *</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Probleminizi, təklifinizi və ya sualınızı yazın..."
          className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/30 resize-none"
          required
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-8 py-3 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 transition-colors disabled:opacity-50"
      >
        <Send size={18} />
        {loading ? 'Göndərilir...' : 'Göndər'}
      </button>
    </form>
  )
}
