'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, Check, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import type { AnalysisQuestion, AnalysisProfile } from '@/lib/analysis'

/* Decorative animated flowing hair — evokes the logo, gently sways */
function FlowingHair({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 320" fill="none" className={className} aria-hidden>
      {[
        { d: 'M40 10 C 20 90, 70 150, 30 310', delay: 0 },
        { d: 'M80 10 C 60 100, 110 170, 70 310', delay: 0.6 },
        { d: 'M120 10 C 100 90, 150 160, 110 310', delay: 1.2 },
        { d: 'M160 10 C 140 100, 190 150, 150 310', delay: 0.3 },
      ].map((s, i) => (
        <motion.path
          key={i}
          d={s.d}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, x: [0, 4, 0, -4, 0] }}
          transition={{
            pathLength: { duration: 2, delay: s.delay },
            opacity: { duration: 1, delay: s.delay },
            x: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: s.delay },
          }}
        />
      ))}
    </svg>
  )
}

export function HairAnalysisForm() {
  const [questions, setQuestions] = useState<AnalysisQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'intro' | 'quiz'>('intro')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1)
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
  const answeredCurrent = currentQuestion ? Boolean(selectedOptions[currentQuestion.id]) : false

  const handleSelect = (optionId: string) => {
    if (!currentQuestion) return
    const next = { ...selectedOptions, [currentQuestion.id]: optionId }
    setSelectedOptions(next)
    const selIds = new Set(Object.values(next))
    const newVisible = questions.filter((q) => !q.parentOptionId || selIds.has(q.parentOptionId))
    // auto-advance to keep it flowing (unless this is the last question)
    if (currentIndex < newVisible.length - 1) {
      setDirection(1)
      window.setTimeout(() => setCurrentIndex((i) => i + 1), 380)
    }
  }

  const goBack = () => {
    if (currentIndex === 0) {
      setStep('intro')
      return
    }
    setDirection(-1)
    setCurrentIndex((i) => Math.max(0, i - 1))
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

  const restart = () => {
    setResult(null)
    setSelectedOptions({})
    setCurrentIndex(0)
    setEmail('')
    setStep('intro')
  }

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={32} className="animate-spin text-brown-300" />
      </div>
    )
  }

  /* ---------------- Result ---------------- */
  if (result) {
    return (
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent-rose/15 flex items-center justify-center"
          >
            <Sparkles size={34} className="text-accent-rose" />
          </motion.div>
          <p className="text-xs tracking-[0.25em] uppercase text-accent-rose mb-2">Sizin nəticəniz</p>
          <h2 className="font-serif text-3xl font-medium text-brown-300 mb-2">{result.title}</h2>
          <p className="text-brown-100/80">{result.summary}</p>
        </div>

        <div className="space-y-4 mb-10">
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
          <div className="mb-8">
            <h3 className="font-serif text-xl font-medium text-brown-300 mb-4">Sizin üçün tövsiyə olunan məhsullar</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {result.products.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                  <Link
                    href={`/mehsullar/${p.slug}`}
                    className="flex items-center justify-between p-4 bg-cream-100 rounded-xl border border-sand-200/50 hover:border-accent-rose/40 hover:shadow-sm transition-all"
                  >
                    <div>
                      <div className="font-medium text-brown-300">{p.name}</div>
                      <div className="text-sm text-brown-100 mt-0.5">{p.price} ₼</div>
                    </div>
                    <ArrowRight size={18} className="text-accent-rose" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-sand-200 text-brown-100 hover:bg-sand-200/40 hover:text-brown-300 text-sm transition-colors"
          >
            <RotateCcw size={15} />
            Yenidən başla
          </button>
        </div>
      </motion.div>
    )
  }

  /* ---------------- Intro ---------------- */
  if (step === 'intro') {
    const rootCount = questions.filter((q) => !q.parentOptionId).length
    return (
      <div className="relative overflow-hidden">
        {/* ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-accent-rose/10 blur-3xl" />
          <div className="absolute top-40 -right-10 w-80 h-80 rounded-full bg-accent-sage/10 blur-3xl" />
          <FlowingHair className="hidden md:block absolute top-10 right-6 w-40 h-64 text-accent-rose/25" />
          <FlowingHair className="hidden md:block absolute top-16 left-6 w-32 h-56 text-brown-300/15" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center max-w-xl mx-auto py-10 sm:py-16"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto mb-6 w-24 h-24"
          >
            <Image src="/logo-mark.png" alt="" width={96} height={96} className="w-full h-full object-contain" priority />
          </motion.div>

          <p className="text-xs tracking-[0.25em] uppercase text-accent-rose mb-3">Şəxsi saç diaqnostikası</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-brown-300 mb-4">
            Saçınızı birlikdə tanıyaq
          </h1>
          <p className="text-brown-100/80 leading-relaxed mb-8">
            Bir neçə sadə suala cavab verin — saçınızın vəziyyətini analiz edib yalnız sizə uyğun qulluq rutini və
            məhsullar tövsiyə edək.
          </p>

          <button
            type="button"
            onClick={() => {
              setStep('quiz')
              setCurrentIndex(0)
            }}
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 shadow-sm hover:shadow-md transition-all"
          >
            Başlayaq
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-brown-100/60">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent-rose" /> ~2 dəqiqə
            </span>
            {rootCount > 0 && <span>· {rootCount}+ sual</span>}
            <span>· Pulsuz</span>
          </div>
        </motion.div>
      </div>
    )
  }

  /* ---------------- Empty ---------------- */
  if (visibleQuestions.length === 0) {
    return (
      <div className="text-center py-16 text-brown-100">
        Analiz sualları hələ konfiqurasiya edilməyib. Tezliklə əlavə ediləcək.
      </div>
    )
  }

  /* ---------------- Quiz ---------------- */
  return (
    <div className="relative max-w-xl mx-auto">
      {/* Progress segments + back */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={goBack}
          className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full text-brown-100/70 hover:bg-sand-200/50 hover:text-brown-300 transition-colors"
          aria-label="Geri"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 flex items-center gap-1.5">
          {visibleQuestions.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-sand-200 overflow-hidden">
              <motion.div
                className="h-full bg-accent-rose rounded-full"
                initial={false}
                animate={{ width: i < currentIndex ? '100%' : i === currentIndex ? '55%' : '0%' }}
                transition={{ duration: 0.4 }}
              />
            </div>
          ))}
        </div>
        <span className="shrink-0 text-xs text-brown-100/60 tabular-nums">
          {currentIndex + 1}/{visibleQuestions.length}
        </span>
      </div>

      {currentQuestion && (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <h2 className="font-serif text-2xl sm:text-[28px] leading-tight font-medium text-brown-300 mb-6">
              {currentQuestion.prompt}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => {
                const selected = selectedOptions[currentQuestion.id] === opt.id
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group w-full text-left p-4 sm:p-5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-colors ${
                      selected
                        ? 'border-brown-300 bg-brown-300/[0.06]'
                        : 'border-sand-200 bg-cream-50 hover:border-accent-rose/40'
                    }`}
                  >
                    <span className={`font-medium ${selected ? 'text-brown-300' : 'text-brown-200'}`}>{opt.label}</span>
                    <span
                      className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                        selected ? 'bg-brown-300 border-brown-300 text-cream-50' : 'border-sand-300 text-transparent'
                      }`}
                    >
                      <Check size={14} />
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* Last question: email + submit */}
            {isLast && answeredCurrent && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <label className="block text-sm text-brown-100 mb-1.5">E-poçt (istəyə bağlı)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nəticəni e-poçtla almaq üçün"
                  className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={submitAnalysis}
                  disabled={submitting}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {submitting ? 'Analiz edilir...' : 'Nəticəni gör'}
                </button>
              </motion.div>
            )}

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </motion.div>
      )}
    </div>
  )
}
