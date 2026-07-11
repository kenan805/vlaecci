'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { apiFetch } from '@/lib/api'

function genId() {
  return crypto.randomUUID()
}

interface DraftOption {
  id: string
  label: string
}

interface ProfileDraft {
  id: string
  name: string
  slug: string
  title: string
  summary: string
  explanation: string
  whyText: string
  routineTitle: string
  routineDescription: string
  resultMessage: string
  isNew?: boolean
}

interface AnalysisData {
  questions: Array<Record<string, unknown>>
  options: Array<Record<string, unknown>>
  profiles: Array<Record<string, unknown>>
  scores: Array<Record<string, unknown>>
  profileProducts: Array<Record<string, unknown>>
}

function rowToProfile(p: Record<string, unknown>): ProfileDraft {
  return {
    id: p.id as string,
    name: (p.name as string) || '',
    slug: (p.slug as string) || '',
    title: (p.title as string) || '',
    summary: (p.summary as string) || '',
    explanation: (p.explanation as string) || '',
    whyText: (p.why_text as string) || '',
    routineTitle: (p.routine_title as string) || '',
    routineDescription: (p.routine_description as string) || '',
    resultMessage: (p.result_message as string) || '',
  }
}

export function AnalysisAdmin({ products }: { products: { id: string; name: string }[] }) {
  const [data, setData] = useState<AnalysisData>({ questions: [], options: [], profiles: [], scores: [], profileProducts: [] })
  const [section, setSection] = useState<'questions' | 'profiles'>('questions')
  const [loading, setLoading] = useState(true)
  const [optionDrafts, setOptionDrafts] = useState<Record<string, DraftOption[]>>({})
  const [profileDrafts, setProfileDrafts] = useState<Record<string, ProfileDraft>>({})
  const [profileOrder, setProfileOrder] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const res = await apiFetch('/admin/analysis')
    const d = await res.json()
    setData(d)

    const drafts: Record<string, DraftOption[]> = {}
    for (const q of d.questions || []) {
      const qId = q.id as string
      drafts[qId] = (d.options || [])
        .filter((o: Record<string, unknown>) => o.question_id === qId)
        .map((o: Record<string, unknown>) => ({ id: o.id as string, label: (o.label as string) || '' }))
    }
    setOptionDrafts(drafts)

    const pDrafts: Record<string, ProfileDraft> = {}
    const order: string[] = []
    for (const p of d.profiles || []) {
      const draft = rowToProfile(p)
      pDrafts[draft.id] = draft
      order.push(draft.id)
    }
    setProfileDrafts(pDrafts)
    setProfileOrder(order)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const apiSave = async (type: string, itemData: Record<string, unknown>) => {
    const res = await apiFetch('/admin/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data: itemData }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Xəta')
    }
  }

  const remove = async (type: string, params: Record<string, string>) => {
    const qs = new URLSearchParams({ type, ...params })
    await apiFetch(`/admin/analysis?${qs}`, { method: 'DELETE' })
    fetchData()
  }

  const addQuestion = async () => {
    const id = genId()
    await apiSave('question', { id, prompt: '', sortOrder: data.questions.length, isActive: true })
    await fetchData()
  }

  const saveQuestion = async (q: Record<string, unknown>, prompt: string, parentOptionId: string | null, isActive: boolean) => {
    await apiSave('question', { ...q, id: q.id, prompt, parentOptionId, isActive })
    await fetchData()
  }

  const addOptionLocal = (questionId: string) => {
    setOptionDrafts((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), { id: genId(), label: '' }],
    }))
  }

  const updateOptionLocal = (questionId: string, optionId: string, label: string) => {
    setOptionDrafts((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).map((o) => (o.id === optionId ? { ...o, label } : o)),
    }))
  }

  const removeOptionLocal = (questionId: string, optionId: string) => {
    setOptionDrafts((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter((o) => o.id !== optionId),
    }))
  }

  const saveOptions = async (questionId: string) => {
    const options = (optionDrafts[questionId] || []).filter((o) => o.label.trim())
    setSaving(`opts-${questionId}`)
    try {
      await apiSave('batchOptions', {
        questionId,
        options: options.map((o, i) => ({ id: o.id, label: o.label.trim(), sortOrder: i })),
      })
      await fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cavablar saxlanıla bilmədi')
    } finally {
      setSaving(null)
    }
  }

  const addProfileLocal = () => {
    const id = genId()
    const draft: ProfileDraft = {
      id,
      name: '',
      slug: `profil-${Date.now()}`,
      title: '',
      summary: '',
      explanation: '',
      whyText: '',
      routineTitle: '',
      routineDescription: '',
      resultMessage: '',
      isNew: true,
    }
    setProfileDrafts((prev) => ({ ...prev, [id]: draft }))
    setProfileOrder((prev) => [...prev, id])
  }

  const updateProfileDraft = (id: string, patch: Partial<ProfileDraft>) => {
    setProfileDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const saveProfile = async (id: string) => {
    const draft = profileDrafts[id]
    if (!draft) return
    if (!draft.name.trim() || !draft.title.trim() || !draft.summary.trim()) {
      alert('Ad, başlıq və qısa nəticə mütləqdir')
      return
    }
    setSaving(`profile-${id}`)
    try {
      await apiSave('profile', {
        id: draft.id,
        name: draft.name.trim(),
        slug: draft.slug || `profil-${Date.now()}`,
        title: draft.title.trim(),
        summary: draft.summary.trim(),
        explanation: draft.explanation,
        whyText: draft.whyText,
        routineTitle: draft.routineTitle,
        routineDescription: draft.routineDescription,
        resultMessage: draft.resultMessage,
        sortOrder: profileOrder.indexOf(id),
        isActive: true,
      })
      await fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Analiz saxlanıla bilmədi')
    } finally {
      setSaving(null)
    }
  }

  const deleteProfile = async (id: string) => {
    const draft = profileDrafts[id]
    if (draft?.isNew) {
      setProfileDrafts((prev) => { const n = { ...prev }; delete n[id]; return n })
      setProfileOrder((prev) => prev.filter((x) => x !== id))
      return
    }
    if (!confirm('Analiz qrupunu silmək istədiyinizə əminsiniz?')) return
    await remove('profile', { id })
  }

  if (loading) return <div className="text-brown-100">Yüklənir...</div>

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button type="button" onClick={() => setSection('questions')} className={`px-4 py-2 rounded-xl text-sm ${section === 'questions' ? 'bg-brown-300 text-cream-50' : 'bg-cream-200 text-brown-100'}`}>
          Suallar və cavablar
        </button>
        <button type="button" onClick={() => setSection('profiles')} className={`px-4 py-2 rounded-xl text-sm ${section === 'profiles' ? 'bg-brown-300 text-cream-50' : 'bg-cream-200 text-brown-100'}`}>
          Analiz qrupları
        </button>
      </div>

      {section === 'questions' && (
        <div>
          <button type="button" onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-brown-300 text-cream-50 rounded-xl text-sm mb-4">
            <Plus size={16} /> Yeni sual
          </button>
          <div className="space-y-4">
            {data.questions.map((q) => {
              const qId = q.id as string
              const options = optionDrafts[qId] || []
              return (
                <QuestionCard
                  key={qId}
                  question={q}
                  options={options}
                  allOptions={data.options}
                  onSaveQuestion={saveQuestion}
                  onDelete={() => remove('question', { id: qId })}
                  onAddOption={() => addOptionLocal(qId)}
                  onUpdateOption={(optId, label) => updateOptionLocal(qId, optId, label)}
                  onRemoveOption={(optId) => removeOptionLocal(qId, optId)}
                  onSaveOptions={() => saveOptions(qId)}
                  saving={saving === `opts-${qId}`}
                />
              )
            })}
          </div>
        </div>
      )}

      {section === 'profiles' && (
        <div>
          <button type="button" onClick={addProfileLocal} className="flex items-center gap-2 px-4 py-2 bg-brown-300 text-cream-50 rounded-xl text-sm mb-4">
            <Plus size={16} /> Yeni analiz qrupu
          </button>
          <div className="space-y-4">
            {profileOrder.map((pId) => {
              const draft = profileDrafts[pId]
              if (!draft) return null
              const pScores = data.scores.filter((s) => s.profile_id === pId)
              const pProducts = data.profileProducts.filter((pp) => pp.profile_id === pId)
              return (
                <div key={pId} className="p-4 bg-cream-100 rounded-xl border border-sand-200/50 space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={draft.name}
                      onChange={(e) => updateProfileDraft(pId, { name: e.target.value })}
                      placeholder="Ad"
                      className="flex-1 px-3 py-2 rounded-lg border border-sand-200"
                    />
                    <button type="button" onClick={() => deleteProfile(pId)} className="p-2 text-red-500"><Trash2 size={16} /></button>
                  </div>
                  <input value={draft.title} onChange={(e) => updateProfileDraft(pId, { title: e.target.value })} placeholder="Nəticə başlığı" className="w-full px-3 py-2 rounded-lg border border-sand-200" />
                  <textarea value={draft.summary} onChange={(e) => updateProfileDraft(pId, { summary: e.target.value })} placeholder="Qısa nəticə" rows={2} className="w-full px-3 py-2 rounded-lg border border-sand-200" />
                  <textarea value={draft.explanation} onChange={(e) => updateProfileDraft(pId, { explanation: e.target.value })} placeholder="Saç haqqında izah" rows={2} className="w-full px-3 py-2 rounded-lg border border-sand-200" />
                  <textarea value={draft.whyText} onChange={(e) => updateProfileDraft(pId, { whyText: e.target.value })} placeholder="Niyə bu nəticə?" rows={2} className="w-full px-3 py-2 rounded-lg border border-sand-200" />
                  <input value={draft.routineTitle} onChange={(e) => updateProfileDraft(pId, { routineTitle: e.target.value })} placeholder="Rutin başlığı" className="w-full px-3 py-2 rounded-lg border border-sand-200" />
                  <textarea value={draft.routineDescription} onChange={(e) => updateProfileDraft(pId, { routineDescription: e.target.value })} placeholder="Rutin təsviri" rows={2} className="w-full px-3 py-2 rounded-lg border border-sand-200" />
                  <textarea value={draft.resultMessage} onChange={(e) => updateProfileDraft(pId, { resultMessage: e.target.value })} placeholder="Əlavə mesaj (istəyə bağlı)" rows={2} className="w-full px-3 py-2 rounded-lg border border-sand-200" />

                  {!draft.isNew && (
                    <>
                      <div>
                        <p className="text-sm text-brown-100 mb-1">Cavab xalları</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {pScores.map((s) => (
                            <span key={`${s.profile_id}-${s.option_id}`} className="inline-flex items-center gap-1 px-2 py-1 bg-sand-200 rounded text-xs">
                              {data.options.find((o) => o.id === s.option_id)?.label as string || s.option_id as string}
                              <button type="button" onClick={() => remove('score', { profileId: pId, optionId: s.option_id as string })} className="text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                        <select
                          className="px-3 py-1.5 rounded-lg border border-sand-200 text-sm"
                          defaultValue=""
                          onChange={async (e) => {
                            if (e.target.value) {
                              await apiSave('score', { profileId: pId, optionId: e.target.value, points: 1 })
                              fetchData()
                              e.target.value = ''
                            }
                          }}
                        >
                          <option value="">Cavab əlavə et...</option>
                          {data.options.map((o) => (
                            <option key={o.id as string} value={o.id as string}>{o.label as string}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <p className="text-sm text-brown-100 mb-1">Tövsiyə olunan məhsullar</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {pProducts.map((pp) => (
                            <span key={`${pp.profile_id}-${pp.product_id}`} className="inline-flex items-center gap-1 px-2 py-1 bg-accent-sage/20 rounded text-xs">
                              {pp.product_name as string}
                              <button type="button" onClick={() => remove('profileProduct', { profileId: pId, productId: pp.product_id as string })} className="text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                        <select
                          className="px-3 py-1.5 rounded-lg border border-sand-200 text-sm"
                          defaultValue=""
                          onChange={async (e) => {
                            if (e.target.value) {
                              await apiSave('profileProduct', { profileId: pId, productId: e.target.value, sortOrder: pProducts.length })
                              fetchData()
                              e.target.value = ''
                            }
                          }}
                        >
                          <option value="">Məhsul əlavə et...</option>
                          {products.map((pr) => (
                            <option key={pr.id} value={pr.id}>{pr.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => saveProfile(pId)}
                    disabled={saving === `profile-${pId}`}
                    className="flex items-center gap-2 px-4 py-2 bg-brown-300 text-cream-50 rounded-lg text-sm disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving === `profile-${pId}` ? 'Saxlanılır...' : 'Saxla'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionCard({
  question,
  options,
  allOptions,
  onSaveQuestion,
  onDelete,
  onAddOption,
  onUpdateOption,
  onRemoveOption,
  onSaveOptions,
  saving,
}: {
  question: Record<string, unknown>
  options: DraftOption[]
  allOptions: Array<Record<string, unknown>>
  onSaveQuestion: (q: Record<string, unknown>, prompt: string, parentOptionId: string | null, isActive: boolean) => void
  onDelete: () => void
  onAddOption: () => void
  onUpdateOption: (optId: string, label: string) => void
  onRemoveOption: (optId: string) => void
  onSaveOptions: () => void
  saving: boolean
}) {
  const [prompt, setPrompt] = useState((question.prompt as string) || '')
  const [parentOptionId, setParentOptionId] = useState((question.parent_option_id as string) || '')
  const [isActive, setIsActive] = useState(question.is_active !== false)

  useEffect(() => {
    setPrompt((question.prompt as string) || '')
    setParentOptionId((question.parent_option_id as string) || '')
    setIsActive(question.is_active !== false)
  }, [question])

  return (
    <div className="p-4 bg-cream-100 rounded-xl border border-sand-200/50">
      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onBlur={() => onSaveQuestion(question, prompt, parentOptionId || null, isActive)}
          placeholder="Sual mətni"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-sand-200 font-medium"
        />
        <select
          value={parentOptionId}
          onChange={(e) => {
            setParentOptionId(e.target.value)
            onSaveQuestion(question, prompt, e.target.value || null, isActive)
          }}
          className="px-3 py-2 rounded-lg border border-sand-200 text-sm"
        >
          <option value="">Kök sual</option>
          {allOptions.map((o) => (
            <option key={o.id as string} value={o.id as string}>{o.label as string || 'Cavab'}</option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-sm text-brown-100">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => {
              setIsActive(e.target.checked)
              onSaveQuestion(question, prompt, parentOptionId || null, e.target.checked)
            }}
          />
          Aktiv
        </label>
        <button type="button" onClick={onDelete} className="p-2 text-red-500"><Trash2 size={16} /></button>
      </div>
      <div className="ml-4 space-y-2">
        {options.map((o) => (
          <div key={o.id} className="flex gap-2 items-center">
            <input
              value={o.label}
              onChange={(e) => onUpdateOption(o.id, e.target.value)}
              placeholder="Yeni cavab"
              className="flex-1 px-3 py-1.5 rounded-lg border border-sand-200 text-sm"
            />
            <button type="button" onClick={() => onRemoveOption(o.id)} className="p-1 text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button type="button" onClick={onAddOption} className="text-sm text-accent-rose hover:underline">
            + Cavab əlavə et
          </button>
          <button
            type="button"
            onClick={onSaveOptions}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brown-300 text-cream-50 rounded-lg text-sm disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saxlanılır...' : 'Cavabları saxla'}
          </button>
        </div>
      </div>
    </div>
  )
}
