'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      router.push('/admin')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl font-medium text-brown-300 text-center mb-8">
          VLAECCI Admin
        </h1>
        <form
          onSubmit={handleSubmit}
          autoComplete="on"
          className="bg-cream-50 rounded-2xl p-8 shadow-sm border border-sand-200/50"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brown-100 mb-2" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-accent-rose/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brown-100 mb-2" htmlFor="admin-password">
                Parol
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-accent-rose/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brown-100/70 hover:text-brown-300"
                  aria-label={showPassword ? 'Parolu gizlə' : 'Parolu göstər'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-brown-300 text-cream-50 rounded-xl font-medium hover:bg-brown-400 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Daxil ol'}
          </button>
        </form>
      </div>
    </div>
  )
}
