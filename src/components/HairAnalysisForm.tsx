'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { AnalysisQuestion, AnalysisProfile } from '@/lib/analysis'

export function HairAnalysisForm() {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AnalysisProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/analysis/questions')
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => setError('Suallar yüklənə bilmədi'))
      .finally(() => setLoading(false))
  }, [])

  const visibleQuestions = useMemo(() => {
    const selectedIds = new Set(Object.values(selectedOptions))
    return questions.filter((q) => {
      if (!q.parentOptionId) return true
      return selectedIds.has(q.parentOptionId)
    })
  }, [questions, selectedOptions])

  const currentQuestion = visibleQuestions[currentIndex]
  const isLast = currentIndex === visibleQuestions.length - 1
  const progress = visibleQuestions.length > 0 ? ((currentIndex + 1) / visibleQuestions.length) * 100 : 0

  const handleSelect = (optionId: string) => {
    if (!currentQuestion) return
    setSelectedOptions((prev) => ({ ...prev, [currentQuestion.id]: optionId }))
  }

  const handleNext = async () => {
    if (!currentQuestion || !selectedOptions[currentQuestion.id]) return
    if (isLast) {
      await submitAnalysis()
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const submitAnalysis = async () => {
    setSubmitting(true)
    setError('')
    try {
      const selectedOptionIds = Object.values(selectedOptions)
      const res = await apiFetch('/analysis/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOptionIds, email: email || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      setResult(data.profile)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-brown-300" />
      </div>
    )
  }

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Sparkles size={40} className="mx-auto text-accent-rose mb-4" />
          <h2 className="font-serif text-3xl font-medium text-brown-300 mb-2">{result.title}</h2>
          <p className="text-brown-100/80">{result.summary}</p>
        </div>

        <div className="space-y-6 mb-10">
          {result.explanation && (
            <div className="p-6 bg-cream-100 rounded-2xl border border-sand-200/50">
              <h3 className="font-medium text-brown-300 mb-2">Saçınız haqqında</h3>
              <p className="text-brown-100/90 text-sm leading-relaxed whitespace-pre-line">{result.explanation}</p>
            </div>
          )}
          {result.whyText && (
            <div className="p-6 bg-cream-100 rounded-2xl border border-sand-200/50">
              <h3 className="font-medium text-brown-300 mb-2">Niyə bu nəticə?</h3>
              <p className="text-brown-100/90 text-sm leading-relaxed whitespace-pre-line">{result.whyText}</p>
            </div>
          )}
          {(result.routineTitle || result.routineDescription) && (
            <div className="p-6 bg-accent-sage/10 rounded-2xl border border-accent-sage/20">
              <h3 className="font-medium text-brown-300 mb-2">{result.routineTitle || 'Tövsiyə olunan rutin'}</h3>
              <p className="text-brown-100/90 text-sm leading-relaxed whitespace-pre-line">{result.routineDescription}</p>
            </div>
          )}
          {result.resultMessage && (
            <p className="text-center text-sm text-brown-100/70 italic">{result.resultMessage}</p>
          )}
        </div>

        {result.products.length > 0 && (
          <div>
            <h3 className="font-serif text-xl font-medium text-brown-300 mb-4">Sizin üçün tövsiyə olunan məhsullar</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {result.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/mehsullar/${p.slug}`}
                  className="p-4 bg-cream-100 rounded-xl border border-sand-200/50 hover:border-accent-rose/30 transition-colors"
                >
                  <div className="font-medium text-brown-300">{p.name}</div>
                  <div className="text-sm text-brown-100 mt-1">{p.price} ₼</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  if (visibleQuestions.length === 0) {
    return (
      <div className="text-center py-12 text-brown-100">
        Analiz sualları hələ konfiqurasiya edilməyib. Tezliklə əlavə ediləcək.
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
          <div className="h-full bg-accent-rose transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-brown-100/70 mt-2 text-right">
          {currentIndex + 1} / {visibleQuestions.length}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-serif text-2xl font-medium text-brown-300 mb-6">{currentQuestion.prompt}</h2>
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedOptions[currentQuestion.id] === opt.id
                      ? 'border-brown-300 bg-brown-300/5'
                      : 'border-sand-200 hover:border-accent-rose/30'
                  }`}
                >
                  <span className="text-brown-300 font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLast && (
        <div className="mt-6">
          <label className="block text-sm text-brown-100 mb-1">E-poçt (istəyə bağlı)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nəticəni e-poçtla almaq üçün"
            className="w-full px-4 py-3 rounded-xl border border-sand-200"
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <button
        type="button"
        onClick={handleNext}
        disabled={!currentQuestion || !selectedOptions[currentQuestion.id] || submitting}
        className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 transition-colors disabled:opacity-50"
      >
        {submitting ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
        {isLast ? (submitting ? 'Analiz edilir...' : 'Nəticəni gör') : 'Növbəti'}
      </button>
    </div>
  )
}
