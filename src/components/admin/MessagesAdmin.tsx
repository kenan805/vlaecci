'use client'

import { useEffect, useMemo, useState } from 'react'
import { Inbox, Trash2, Phone, Mail, MessageCircle, Eye } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToast } from './Toast'
import { ConfirmModal } from './ConfirmModal'
import { PageHeader, SearchInput, AdminModal, IconButton, Card, EmptyState } from './ui'

interface Message {
  id: string
  name: string
  contact: string
  messageType: string
  message: string
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  suggestion: 'Təklif',
  complaint: 'Şikayət',
  order: 'Sifariş sorğusu',
  other: 'Digər',
}

const TYPE_STYLES: Record<string, string> = {
  suggestion: 'bg-accent-sage/15 text-accent-sage',
  complaint: 'bg-red-50 text-red-600',
  order: 'bg-accent-rose/15 text-accent-rose',
  other: 'bg-sand-200/60 text-brown-200',
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Builds tel / WhatsApp / mailto links from the free-text contact field. */
function contactLinks(contact: string) {
  const value = contact.trim()
  if (/^\S+@\S+\.\S+$/.test(value)) return { email: `mailto:${value}` }
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7) return {}
  let intl = digits
  if (intl.startsWith('0')) intl = `994${intl.slice(1)}`
  else if (!intl.startsWith('994') && intl.length === 9) intl = `994${intl}`
  return { tel: `tel:+${intl}`, whatsapp: `https://wa.me/${intl}` }
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[type] ?? TYPE_STYLES.other}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  )
}

function ContactActions({ contact }: { contact: string }) {
  const links = contactLinks(contact)
  const cls =
    'w-9 h-9 inline-flex items-center justify-center rounded-lg text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300 transition-colors'
  return (
    <>
      {links.tel && (
        <a href={links.tel} className={cls} title="Zəng et" aria-label="Zəng et">
          <Phone size={16} />
        </a>
      )}
      {links.whatsapp && (
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={cls} title="WhatsApp" aria-label="WhatsApp">
          <MessageCircle size={16} />
        </a>
      )}
      {links.email && (
        <a href={links.email} className={cls} title="Email yaz" aria-label="Email yaz">
          <Mail size={16} />
        </a>
      )}
    </>
  )
}

export function MessagesAdmin() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [open, setOpen] = useState<Message | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)

  const fetchMessages = async () => {
    try {
      const res = await apiFetch('/admin/messages')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      toast('Mesajlar yüklənmədi', 'error')
    }
  }

  useEffect(() => {
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: messages.length }
    for (const m of messages) c[m.messageType] = (c[m.messageType] || 0) + 1
    return c
  }, [messages])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return messages.filter((m) => {
      if (typeFilter !== 'all' && m.messageType !== typeFilter) return false
      if (!q) return true
      return (
        m.name.toLowerCase().includes(q) || m.contact.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)
      )
    })
  }, [messages, search, typeFilter])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await apiFetch(`/admin/messages/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Xəta')
      toast('Mesaj silindi')
      if (open?.id === deleteTarget.id) setOpen(null)
      await fetchMessages()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Xəta baş verdi', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  const filters = ['all', 'suggestion', 'complaint', 'order', 'other']

  return (
    <div>
      <PageHeader title="Mesajlar" subtitle="Saytdakı “Əlaqə” formundan gələn mesajlar" />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Ad, əlaqə və ya mətn ilə axtar..."
          className="flex-1"
        />
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`px-3 h-9 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === f
                  ? 'bg-brown-300 text-cream-50'
                  : 'bg-white border border-sand-200/70 text-brown-100 hover:bg-sand-200/40'
              }`}
            >
              {f === 'all' ? 'Hamısı' : TYPE_LABELS[f]}
              <span className="ml-1.5 opacity-60 tabular-nums">{counts[f] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={<Inbox size={24} />} title="Mesaj tapılmadı" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-sand-200/70 bg-sand-200/25">
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Göndərən</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Növ</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Mesaj</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60">Tarix</th>
                  <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-brown-100/60 text-right">
                    Əməliyyat
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setOpen(m)}
                    className="border-b border-sand-200/40 last:border-0 hover:bg-cream-100/70 transition-colors cursor-pointer align-top"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-brown-300">{m.name}</p>
                      <p className="text-xs text-brown-100/60">{m.contact}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={m.messageType} />
                    </td>
                    <td className="px-4 py-3.5 max-w-[360px]">
                      <p className="text-brown-100/90 line-clamp-2">{m.message}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-brown-100/60 whitespace-nowrap">{formatDate(m.createdAt)}</td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <ContactActions contact={m.contact} />
                        <IconButton onClick={() => setOpen(m)} aria-label="Bax" title="Bax">
                          <Eye size={16} />
                        </IconButton>
                        <IconButton danger onClick={() => setDeleteTarget(m)} aria-label="Sil" title="Sil">
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {open && (
        <AdminModal title="Mesaj" onClose={() => setOpen(null)}>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-brown-300">{open.name}</p>
                <p className="text-sm text-brown-100/70">{open.contact}</p>
                <p className="text-xs text-brown-100/50 mt-1">{formatDate(open.createdAt)}</p>
              </div>
              <TypeBadge type={open.messageType} />
            </div>
            <p className="whitespace-pre-wrap rounded-xl bg-white border border-sand-200/70 p-4 text-sm leading-relaxed text-brown-300">
              {open.message}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <ContactActions contact={open.contact} />
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(open)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
                Sil
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        message="Bu mesajı silmək istədiyinizə əminsiniz?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
