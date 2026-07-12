'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save, HelpCircle, Layers, ChevronDown } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from './Toast'
import { ConfirmModal } from './ConfirmModal'
import {
  PageHeader,
  PrimaryButton,
  Card,
  EmptyState,
  Toggle,
  IconButton,
  fieldClassName,
  modernSelectClassName,
  selectChevronStyle,
  labelClassName,
} from './ui'

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

type ConfirmState = { kind: 'question'; id: string } | { kind: 'profile'; id: string }

interface NodeCtx {
  optionDrafts: Record<string, DraftOption[]>
  optionIdSet: Set<string>
  childrenByOption: Record<string, Array<Record<string, unknown>>>
  saving: string | null
  onSaveQuestion: (q: Record<string, unknown>, prompt: string, isActive: boolean) => void
  onDeleteQuestion: (id: string) => void
  onAddOption: (questionId: string) => void
  onUpdateOption: (questionId: string, optId: string, label: string) => void
  onRemoveOption: (questionId: string, optId: string) => void
  onSaveOptions: (questionId: string) => void
  onAddChild: (parentOptionId: string) => void
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
  const { toast } = useToast()
  const [data, setData] = useState<AnalysisData>({ questions: [], options: [], profiles: [], scores: [], profileProducts: [] })
  const [section, setSection] = useState<'questions' | 'profiles'>('questions')
  const [loading, setLoading] = useState(true)
  const [optionDrafts, setOptionDrafts] = useState<Record<string, DraftOption[]>>({})
  const [profileDrafts, setProfileDrafts] = useState<Record<string, ProfileDraft>>({})
  const [profileOrder, setProfileOrder] = useState<string[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null)

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
    await fetchData()
  }

  const handleConfirm = async () => {
    if (!confirm) return
    try {
      if (confirm.kind === 'question') {
        await remove('question', { id: confirm.id })
        toast('Sual silindi')
      } else if (confirm.kind === 'profile') {
        await remove('profile', { id: confirm.id })
        toast('Analiz qrupu silindi')
      }
    } catch {
      toast('Silinmə uğursuz', 'error')
    }
    setConfirm(null)
  }

  const addQuestion = async () => {
    const id = genId()
    try {
      await apiSave('question', { id, prompt: '', sortOrder: data.questions.length, isActive: true })
      await fetchData()
    } catch {
      toast('Sual əlavə edilə bilmədi', 'error')
    }
  }

  const addChildQuestion = async (parentOptionId: string) => {
    const id = genId()
    try {
      await apiSave('question', { id, prompt: '', parentOptionId, sortOrder: data.questions.length, isActive: true })
      await fetchData()
    } catch {
      toast('Alt sual əlavə edilə bilmədi', 'error')
    }
  }

  const saveQuestion = async (q: Record<string, unknown>, prompt: string, isActive: boolean) => {
    try {
      await apiSave('question', { ...q, id: q.id, prompt, parentOptionId: (q.parent_option_id as string) || null, isActive })
      await fetchData()
    } catch {
      toast('Sual saxlanıla bilmədi', 'error')
    }
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
      toast('Cavablar saxlanıldı')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Cavablar saxlanıla bilmədi', 'error')
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
    setExpandedProfile(id)
  }

  const updateProfileDraft = (id: string, patch: Partial<ProfileDraft>) => {
    setProfileDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const saveProfile = async (id: string) => {
    const draft = profileDrafts[id]
    if (!draft) return
    if (!draft.name.trim() || !draft.title.trim() || !draft.summary.trim()) {
      toast('Ad, başlıq və qısa nəticə mütləqdir', 'error')
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
      toast('Analiz qrupu saxlanıldı')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Analiz saxlanıla bilmədi', 'error')
    } finally {
      setSaving(null)
    }
  }

  const deleteProfile = (id: string) => {
    const draft = profileDrafts[id]
    if (draft?.isNew) {
      setProfileDrafts((prev) => {
        const n = { ...prev }
        delete n[id]
        return n
      })
      setProfileOrder((prev) => prev.filter((x) => x !== id))
      return
    }
    setConfirm({ kind: 'profile', id })
  }

  const optionLabel = (optionId: string) =>
    (data.options.find((o) => o.id === optionId)?.label as string) || 'Cavab'

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-white text-brown-300 shadow-sm' : 'text-brown-100 hover:text-brown-300'
    }`

  // Build the question tree
  const optionIdSet = new Set(data.options.map((o) => o.id as string))
  const childrenByOption: Record<string, Array<Record<string, unknown>>> = {}
  for (const q of data.questions) {
    const pid = (q.parent_option_id as string) || ''
    if (pid && optionIdSet.has(pid)) {
      ;(childrenByOption[pid] ||= []).push(q)
    }
  }
  const rootQuestions = data.questions.filter((q) => {
    const pid = (q.parent_option_id as string) || ''
    return !pid || !optionIdSet.has(pid)
  })

  const nodeCtx: NodeCtx = {
    optionDrafts,
    optionIdSet,
    childrenByOption,
    saving,
    onSaveQuestion: saveQuestion,
    onDeleteQuestion: (id) => setConfirm({ kind: 'question', id }),
    onAddOption: addOptionLocal,
    onUpdateOption: updateOptionLocal,
    onRemoveOption: removeOptionLocal,
    onSaveOptions: saveOptions,
    onAddChild: addChildQuestion,
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Saç Analizi" subtitle="Diaqnostika suallarını və nəticə qruplarını idarə et" />
        <p className="text-sm text-brown-100/60">Yüklənir...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Saç Analizi" subtitle="Diaqnostika suallarını və nəticə qruplarını idarə et" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex p-1 rounded-xl bg-sand-200/40 border border-sand-200/60">
          <button type="button" onClick={() => setSection('questions')} className={tabClass(section === 'questions')}>
            Suallar və cavablar
          </button>
          <button type="button" onClick={() => setSection('profiles')} className={tabClass(section === 'profiles')}>
            Analiz qrupları
          </button>
        </div>
        {section === 'questions' ? (
          <PrimaryButton onClick={addQuestion}>
            <Plus size={18} />
            Yeni kök sual
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={addProfileLocal}>
            <Plus size={18} />
            Yeni analiz qrupu
          </PrimaryButton>
        )}
      </div>

      {section === 'questions' && (
        <div className="space-y-2.5">
          {rootQuestions.length === 0 ? (
            <Card>
              <EmptyState icon={<HelpCircle size={24} />} title="Hələ sual yoxdur" />
            </Card>
          ) : (
            rootQuestions.map((q) => <QuestionNode key={q.id as string} question={q} ctx={nodeCtx} />)
          )}
        </div>
      )}

      {section === 'profiles' && (
        <div className="space-y-2.5">
          {profileOrder.length === 0 ? (
            <Card>
              <EmptyState icon={<Layers size={24} />} title="Hələ analiz qrupu yoxdur" />
            </Card>
          ) : (
            profileOrder.map((pId) => {
              const draft = profileDrafts[pId]
              if (!draft) return null
              const open = expandedProfile === pId
              const pScores = data.scores.filter((s) => s.profile_id === pId)
              const pProducts = data.profileProducts.filter((pp) => pp.profile_id === pId)
              return (
                <Card key={pId} className="overflow-hidden">
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => setExpandedProfile(open ? null : pId)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-brown-100/50 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-brown-300 truncate">{draft.name || 'Yeni analiz qrupu'}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-brown-100/60">
                          {draft.title && <span className="truncate">{draft.title}</span>}
                          {!draft.isNew && (
                            <span className="shrink-0">
                              · {pScores.length} cavab · {pProducts.length} məhsul
                            </span>
                          )}
                          {draft.isNew && <span className="text-accent-rose shrink-0">· yadda saxlanılmayıb</span>}
                        </div>
                      </div>
                    </button>
                    <IconButton danger onClick={() => deleteProfile(pId)} title="Sil" aria-label="Analiz qrupunu sil">
                      <Trash2 size={16} />
                    </IconButton>
                  </div>

                  {open && (
                    <div className="px-4 pb-4 pt-1 border-t border-sand-200/50 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClassName}>Qrup adı</label>
                          <input
                            value={draft.name}
                            onChange={(e) => updateProfileDraft(pId, { name: e.target.value })}
                            placeholder="Məs. Zəif saçlar"
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Nəticə başlığı</label>
                          <input
                            value={draft.title}
                            onChange={(e) => updateProfileDraft(pId, { title: e.target.value })}
                            placeholder="Nəticə başlığı"
                            className={fieldClassName}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClassName}>Qısa nəticə</label>
                        <textarea
                          value={draft.summary}
                          onChange={(e) => updateProfileDraft(pId, { summary: e.target.value })}
                          placeholder="Qısa nəticə"
                          rows={2}
                          className={fieldClassName}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelClassName}>Saç haqqında izah</label>
                          <textarea
                            value={draft.explanation}
                            onChange={(e) => updateProfileDraft(pId, { explanation: e.target.value })}
                            placeholder="Saç haqqında izah"
                            rows={2}
                            className={fieldClassName}
                          />
                        </div>
                        <div>
                          <label className={labelClassName}>Niyə bu nəticə?</label>
                          <textarea
                            value={draft.whyText}
                            onChange={(e) => updateProfileDraft(pId, { whyText: e.target.value })}
                            placeholder="Niyə bu nəticə?"
                            rows={2}
                            className={fieldClassName}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={labelClassName}>Rutin başlığı</label>
                        <input
                          value={draft.routineTitle}
                          onChange={(e) => updateProfileDraft(pId, { routineTitle: e.target.value })}
                          placeholder="Rutin başlığı"
                          className={fieldClassName}
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Rutin təsviri</label>
                        <textarea
                          value={draft.routineDescription}
                          onChange={(e) => updateProfileDraft(pId, { routineDescription: e.target.value })}
                          placeholder="Rutin təsviri"
                          rows={2}
                          className={fieldClassName}
                        />
                      </div>
                      <div>
                        <label className={labelClassName}>Əlavə mesaj (istəyə bağlı)</label>
                        <textarea
                          value={draft.resultMessage}
                          onChange={(e) => updateProfileDraft(pId, { resultMessage: e.target.value })}
                          placeholder="Əlavə mesaj"
                          rows={2}
                          className={fieldClassName}
                        />
                      </div>

                      {!draft.isNew && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          <div>
                            <label className={labelClassName}>Cavab xalları</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {pScores.length === 0 && <span className="text-xs text-brown-100/50">Hələ cavab yoxdur</span>}
                              {pScores.map((s) => (
                                <span
                                  key={`${s.profile_id}-${s.option_id}`}
                                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-sand-200/70 rounded-full text-xs text-brown-200"
                                >
                                  {optionLabel(s.option_id as string)}
                                  <button
                                    type="button"
                                    onClick={() => remove('score', { profileId: pId, optionId: s.option_id as string })}
                                    className="w-4 h-4 inline-flex items-center justify-center rounded-full text-brown-100/60 hover:bg-brown-300/10 hover:text-red-500"
                                    aria-label="Sil"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <select
                              className={`${modernSelectClassName} text-sm`}
                              style={selectChevronStyle}
                              defaultValue=""
                              onChange={async (e) => {
                                if (e.target.value) {
                                  await apiSave('score', { profileId: pId, optionId: e.target.value, points: 1 })
                                  await fetchData()
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="">Cavab əlavə et...</option>
                              {data.options.map((o) => (
                                <option key={o.id as string} value={o.id as string}>
                                  {o.label as string}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClassName}>Tövsiyə olunan məhsullar</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {pProducts.length === 0 && <span className="text-xs text-brown-100/50">Hələ məhsul yoxdur</span>}
                              {pProducts.map((pp) => (
                                <span
                                  key={`${pp.profile_id}-${pp.product_id}`}
                                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-accent-sage/20 rounded-full text-xs text-brown-200"
                                >
                                  {pp.product_name as string}
                                  <button
                                    type="button"
                                    onClick={() => remove('profileProduct', { profileId: pId, productId: pp.product_id as string })}
                                    className="w-4 h-4 inline-flex items-center justify-center rounded-full text-brown-100/60 hover:bg-brown-300/10 hover:text-red-500"
                                    aria-label="Sil"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <select
                              className={`${modernSelectClassName} text-sm`}
                              style={selectChevronStyle}
                              defaultValue=""
                              onChange={async (e) => {
                                if (e.target.value) {
                                  await apiSave('profileProduct', { profileId: pId, productId: e.target.value, sortOrder: pProducts.length })
                                  await fetchData()
                                  e.target.value = ''
                                }
                              }}
                            >
                              <option value="">Məhsul əlavə et...</option>
                              {products.map((pr) => (
                                <option key={pr.id} value={pr.id}>
                                  {pr.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => saveProfile(pId)}
                          disabled={saving === `profile-${pId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors"
                        >
                          <Save size={16} />
                          {saving === `profile-${pId}` ? 'Saxlanılır...' : 'Saxla'}
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>
      )}

      <ConfirmModal
        open={confirm !== null}
        message={
          confirm?.kind === 'question'
            ? 'Bu sualı (və alt suallarını) silmək istədiyinizə əminsiniz?'
            : 'Bu analiz qrupunu silmək istədiyinizə əminsiniz?'
        }
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

function QuestionNode({ question, ctx }: { question: Record<string, unknown>; ctx: NodeCtx }) {
  const qId = question.id as string
  const [prompt, setPrompt] = useState((question.prompt as string) || '')
  const [isActive, setIsActive] = useState(question.is_active !== false)
  const [open, setOpen] = useState(!((question.prompt as string) || '').trim())

  useEffect(() => {
    setPrompt((question.prompt as string) || '')
    setIsActive(question.is_active !== false)
  }, [question])

  const options = ctx.optionDrafts[qId] || []
  const answerCount = options.filter((o) => o.label.trim()).length
  const childCount = options.reduce((n, o) => n + (ctx.childrenByOption[o.id]?.length || 0), 0)

  return (
    <Card className={`overflow-hidden ${isActive ? '' : 'opacity-70'}`}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex-1 flex items-center gap-3 text-left min-w-0">
          <ChevronDown size={18} className={`shrink-0 text-brown-100/50 transition-transform ${open ? 'rotate-180' : ''}`} />
          <div className="min-w-0">
            <div className="font-medium text-brown-300 truncate">{prompt || 'Adsız sual'}</div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-brown-100/60">
              <span>{answerCount} cavab</span>
              {childCount > 0 && <span className="text-accent-rose">· {childCount} alt sual</span>}
            </div>
          </div>
        </button>
        <label className="flex items-center gap-2 text-xs text-brown-100/70 px-1 shrink-0">
          <Toggle
            checked={isActive}
            label="Aktiv"
            onChange={(next) => {
              setIsActive(next)
              ctx.onSaveQuestion(question, prompt, next)
            }}
          />
          <span className="hidden sm:inline">{isActive ? 'Aktiv' : 'Deaktiv'}</span>
        </label>
        <IconButton danger onClick={() => ctx.onDeleteQuestion(qId)} title="Sualı sil" aria-label="Sualı sil">
          <Trash2 size={16} />
        </IconButton>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-sand-200/50 space-y-4">
          <div>
            <label className={labelClassName}>Sual mətni</label>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onBlur={() => ctx.onSaveQuestion(question, prompt, isActive)}
              placeholder="Sual mətni"
              className={fieldClassName}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-brown-100">Cavablar və alt suallar</label>
              <button
                type="button"
                onClick={() => ctx.onSaveOptions(qId)}
                disabled={ctx.saving === `opts-${qId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brown-300 text-cream-50 rounded-lg text-xs font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors"
              >
                <Save size={13} />
                {ctx.saving === `opts-${qId}` ? 'Saxlanılır...' : 'Cavabları saxla'}
              </button>
            </div>

            {options.length === 0 && <p className="text-xs text-brown-100/50 mb-2">Hələ cavab yoxdur.</p>}

            <div className="space-y-2">
              {options.map((o, i) => {
                const saved = ctx.optionIdSet.has(o.id)
                const children = ctx.childrenByOption[o.id] || []
                return (
                  <div key={o.id}>
                    <div className="flex gap-2 items-center">
                      <span className="shrink-0 w-5 text-xs text-brown-100/40 text-right tabular-nums">{i + 1}</span>
                      <input
                        value={o.label}
                        onChange={(e) => ctx.onUpdateOption(qId, o.id, e.target.value)}
                        placeholder="Cavab variantı"
                        className={`flex-1 ${fieldClassName} !py-2 text-sm`}
                      />
                      <IconButton danger onClick={() => ctx.onRemoveOption(qId, o.id)} title="Cavabı sil" aria-label="Cavabı sil" className="!w-8 !h-8">
                        <Trash2 size={14} />
                      </IconButton>
                    </div>

                    {/* Nested sub-questions for this answer */}
                    {saved ? (
                      <div className="ml-6 mt-2 pl-3 border-l-2 border-sand-200/70 space-y-2">
                        {children.map((cq) => (
                          <QuestionNode key={cq.id as string} question={cq} ctx={ctx} />
                        ))}
                        <button
                          type="button"
                          onClick={() => ctx.onAddChild(o.id)}
                          className="inline-flex items-center gap-1 text-xs text-accent-rose hover:underline"
                        >
                          <Plus size={12} />
                          Bu cavaba alt sual
                        </button>
                      </div>
                    ) : (
                      o.label.trim() && (
                        <p className="ml-6 mt-1 text-[11px] text-brown-100/40">
                          Alt sual əlavə etmək üçün əvvəlcə “Cavabları saxla”.
                        </p>
                      )
                    )}
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => ctx.onAddOption(qId)}
              className="inline-flex items-center gap-1 text-sm text-accent-rose hover:underline mt-3"
            >
              <Plus size={14} />
              Cavab əlavə et
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
