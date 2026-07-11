'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const STEPS = [
  {
    id: 'hairLossLevel',
    question: 'Saç dökülmə səviyyəniz necədir?',
    options: [
      { value: 'mild', label: 'Yüngül - Biraz saç tökülür' },
      { value: 'moderate', label: 'Orta - Diqqət çəkən miqdarda dökülmə' },
      { value: 'severe', label: 'Ciddi - Güclü saç itkisi' },
    ],
  },
  {
    id: 'hairType',
    question: 'Saç tipiniz necədir?',
    options: [
      { value: 'thin', label: 'İnce və nazik' },
      { value: 'normal', label: 'Normal' },
      { value: 'thick', label: 'Qalın və güclü' },
      { value: 'curly', label: 'Dalğalı və ya buruq' },
    ],
  },
  {
    id: 'scalpCondition',
    question: 'Saçlı dərinizin vəziyyəti necədir?',
    options: [
      { value: 'oily', label: 'Yağlı' },
      { value: 'dry', label: 'Quru' },
      { value: 'normal', label: 'Normal' },
      { value: 'sensitive', label: 'Həssas' },
    ],
  },
]

export function QuizForm() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ recommendations: { id: string; name: string; slug: string; price: number }[] } | null>(null)
  const [error, setError] = useState('')

  const currentStep = STEPS[step]
  const isLastStep = step === STEPS.length - 1

  const handleNext = () => {
    if (currentStep && answers[currentStep.id]) {
      if (isLastStep) {
        submitQuiz()
      } else {
        setStep((s) => s + 1)
      }
    }
  }

  const submitQuiz = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hairLossLevel: answers.hairLossLevel,
          hairType: answers.hairType,
          scalpCondition: answers.scalpCondition,
          email: email || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xəta baş verdi')
    } finally {
      setLoading(false)
    }
  }

  const selectOption = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentStep.id]: value }))
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cream-100/50 rounded-2xl p-8 border border-sand-200/50"
      >
        <h2 className="font-serif text-2xl font-medium text-brown-300 mb-4">
          Sizin üçün tövsiyələr
        </h2>
        <p className="text-brown-100/80 mb-6">
          Cavablarınıza əsasən aşağıdakı məhsulları məsləhət görürük:
        </p>
        <div className="space-y-4 mb-8">
          {result.recommendations.map((p) => (
            <Link
              key={p.id}
              href={`/mehsullar/${p.slug}`}
              className="block p-4 bg-cream-50 rounded-xl border border-sand-200/50 hover:border-accent-rose/30 transition-colors"
            >
              <div className="font-medium text-brown-300">{p.name}</div>
              <div className="text-accent-rose font-medium">{p.price} ₼</div>
            </Link>
          ))}
        </div>
        <Link
          href="/mehsullar"
          className="inline-flex items-center gap-2 text-accent-rose hover:underline"
        >
          Bütün məhsulları gör
          <ChevronRight size={18} />
        </Link>
      </motion.div>
    )
  }

  return (
    <div className="bg-cream-100/50 rounded-2xl p-6 md:p-8 border border-sand-200/50">
      <div className="mb-6">
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-accent-rose' : 'bg-sand-200'
              }`}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-serif text-xl md:text-2xl font-medium text-brown-300 mb-6">
              {currentStep?.question}
            </h2>
            <div className="space-y-3">
              {currentStep?.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectOption(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    answers[currentStep.id] === opt.value
                      ? 'border-accent-rose bg-accent-rose/10 text-brown-300'
                      : 'border-sand-200 bg-cream-50 text-brown-100 hover:border-sand-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {isLastStep && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-brown-100 mb-2">
            E-poçt (isteğe bağlı - nəticələr göndəriləcək)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-cream-50 focus:outline-none focus:ring-2 focus:ring-accent-rose/50"
          />
        </div>
      )}

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={handleNext}
        disabled={!answers[currentStep.id] || loading}
        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-brown-300 text-cream-50 rounded-full font-medium hover:bg-brown-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isLastStep ? (
          'Nəticələri gör'
        ) : (
          <>
            Növbəti
            <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
  )
}
