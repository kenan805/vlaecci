'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Trash2, Sparkles, Mail } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { ConfirmModal } from './ConfirmModal'
import { useToast } from './Toast'
import { PageHeader, SearchInput, AdminModal, IconButton, Card, EmptyState } from './ui'

interface AnalysisLead {
  id: string
  email: string | null
  resultTitle: string
  answers: string[]
  answerCount: number
  createdAt?: string
}

interface AnalysisSessionsResponse {
  sessions: AnalysisLead[]
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('az-AZ')
}

export function AnalysisLeadsAdmin() {
  const { toast } = useToast()

  const [leads, setLeads] = useState<AnalysisLead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<AnalysisLead | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AnalysisLead | null>(null)

  const fetchLeads = async () => {
    try {
      const res = await apiFetch('/admin/analysis-sessions')
      const data: AnalysisSessionsResponse = await res.json()
      setLeads(Array.isArray(data.sessions) ? data.sessions : [])
    } catch {
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return leads
    return leads.filter(
      (l) =>
        (l.email || '').toLowerCase().includes(q) || l.resultTitle.toLowerCase().includes(q)
    )
  }, [leads, search])

  const performDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/analysis-sessions/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Xəta')
      toast('Nəticə silindi')
      await fetchLeads()
    } catch {
      toast('Nəticə silinmədi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Analiz nəticələri"
        subtitle="Saç diaqnostikasından gələn müştəri lead-ləri"
      />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Nəticə və ya email axtar..."
        className="mb-4"
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-sand-200/70 bg-sand-200/25">
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Nəticə</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Email</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Cavablar</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Tarix</th>
                <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 text-right">
                  Əməliyyat
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-brown-100/60">
                    Yüklənir...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-4">
                    <EmptyState icon={<Sparkles size={24} />} title="Hələ analiz nəticəsi yoxdur" />
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-brown-300">{lead.resultTitle}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-brown-200 hover:text-brown-300 hover:underline"
                        >
                          {lead.email}
                        </a>
                      ) : (
                        <span className="text-brown-100/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => setViewing(lead)}
                        className="inline-flex items-center gap-1.5 text-brown-200 hover:text-brown-300"
                      >
                        <span className="tabular-nums">{lead.answerCount}</span>
                        <span className="text-xs text-brown-100/60 hover:underline">bax</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-brown-100 whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <IconButton onClick={() => setViewing(lead)} title="Bax" aria-label="Nəticəyə bax">
                          <Eye size={16} />
                        </IconButton>
                        <IconButton
                          danger
                          onClick={() => setDeleteTarget(lead)}
                          title="Sil"
                          aria-label="Nəticəni sil"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {viewing && (
        <AdminModal title="Analiz nəticəsi" onClose={() => setViewing(null)}>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-cream-100 border border-sand-200/60">
              <p className="text-[11px] text-brown-100/60 mb-1">Nəticə</p>
              <p className="text-lg font-semibold text-brown-300">{viewing.resultTitle}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-sand-200/50">
                <span className="text-brown-100/70">Email</span>
                {viewing.email ? (
                  <a
                    href={`mailto:${viewing.email}`}
                    className="inline-flex items-center gap-1.5 text-brown-300 font-medium hover:underline"
                  >
                    <Mail size={14} />
                    {viewing.email}
                  </a>
                ) : (
                  <span className="text-brown-100/40">—</span>
                )}
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-brown-100/70">Tarix</span>
                <span className="text-brown-300 font-medium">{formatDate(viewing.createdAt)}</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-brown-100/60 mb-2">
                Cavablar ({viewing.answerCount})
              </p>
              {viewing.answers.length === 0 ? (
                <p className="text-sm text-brown-100/50">Cavab yoxdur</p>
              ) : (
                <ol className="space-y-2">
                  {viewing.answers.map((answer, index) => (
                    <li
                      key={`${answer}-${index}`}
                      className="flex items-start gap-3 rounded-xl border border-sand-200/70 bg-white px-3 py-2.5 text-sm text-brown-300"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-sand-200/50 text-brown-100/70 text-xs font-medium inline-flex items-center justify-center tabular-nums">
                        {index + 1}
                      </span>
                      <span className="leading-snug">{answer}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu nəticəni silmək istədiyinizə əminsiniz?"
        onConfirm={performDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
