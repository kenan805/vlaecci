'use client'

import { useState } from 'react'
import { Tag, Check, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface DiscountCodeInputProps {
  onValid?: (code: string, percentage: number) => void
  onInvalid?: () => void
  className?: string
}

export function DiscountCodeInput({ onValid, onInvalid, className = '' }: DiscountCodeInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [percentage, setPercentage] = useState(0)

  const validate = async () => {
    if (!code.trim()) return
    setLoading(true)
    setStatus('idle')
    try {
      const res = await apiFetch('/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (data.valid) {
        setStatus('valid')
        setPercentage(data.percentage)
        onValid?.(code.trim(), data.percentage)
      } else {
        setStatus('invalid')
        onInvalid?.()
      }
    } catch {
      setStatus('invalid')
      onInvalid?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400" size={18} />
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setStatus('idle')
          }}
          onKeyDown={(e) => e.key === 'Enter' && validate()}
          placeholder="Endirim kodu"
          className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/50 ${
            status === 'valid' ? 'border-accent-sage' : status === 'invalid' ? 'border-red-300' : 'border-sand-200'
          }`}
          disabled={loading}
        />
        {status === 'valid' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-sage">
            <Check size={18} />
          </span>
        )}
        {status === 'invalid' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <X size={18} />
          </span>
        )}
      </div>
      <button
        onClick={validate}
        disabled={loading || !code.trim()}
        className="px-4 py-3 bg-sand-200 text-brown-100 rounded-xl font-medium hover:bg-sand-300 disabled:opacity-50 transition-colors"
      >
        {loading ? '...' : 'Tətbiq et'}
      </button>
      {status === 'valid' && percentage > 0 ? <span className="hidden">{percentage}</span> : null}
    </div>
  )
}
