'use client'

import { useEffect, useState } from 'react'
import {
  Package,
  Eye,
  Users,
  MessageSquare,
  Tag,
  Sparkles,
  BarChart3,
  Globe,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { PageHeader, Card, EmptyState } from './ui'

/* ------------------------------------------------------------------ */
/* Types (mirror /api/admin/stats)                                    */
/* ------------------------------------------------------------------ */

type ProductStatus = 'active' | 'draft' | 'deactive'

interface StatsTotals {
  products: number
  activeProducts: number
  totalViews: number
  uniqueViews: number
  reviews: number
  quizResponses: number
  analysisSessions: number
  contactMessages: number
  discountCodes: number
  discountUsage: number
}

interface StatusSlice {
  status: ProductStatus
  count: number
}

interface TopProduct {
  name: string
  views: number
  uniqueViews: number
}

interface DayPoint {
  day: string
  count: number
}

interface CountrySlice {
  country: string
  count: number
}

interface StatsResponse {
  totals: StatsTotals
  statusDistribution: StatusSlice[]
  topProducts: TopProduct[]
  viewsByDay: DayPoint[]
  topCountries: CountrySlice[]
}

/* ------------------------------------------------------------------ */
/* Brand palette constants (used for inline SVG fills / strokes)       */
/* ------------------------------------------------------------------ */

const COLORS = {
  brown300: '#4A3D32',
  brown100: '#6B5344',
  sage: '#9CAF88',
  rose: '#C9A88E',
  sand400: '#A89885',
  sand200: '#DED5C8',
}

const STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Aktiv',
  draft: 'Qaralama',
  deactive: 'Deaktiv',
}

const STATUS_COLORS: Record<ProductStatus, string> = {
  active: COLORS.sage,
  draft: COLORS.sand400,
  deactive: 'rgba(107, 83, 68, 0.4)', // brown-100 / 40
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function nfmt(value: number): string {
  return new Intl.NumberFormat('az-AZ').format(value)
}

function shortDay(value: string): string {
  // 'YYYY-MM-DD' -> 'DD.MM'
  const parts = value.split('-')
  if (parts.length !== 3) return value
  return `${parts[2]}.${parts[1]}`
}

/** Catmull-Rom → cubic Bézier smoothing for a soft line. */
function buildSmoothLine(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

/* ------------------------------------------------------------------ */
/* Stat card                                                          */
/* ------------------------------------------------------------------ */

type Tint = 'brown' | 'sage' | 'rose' | 'sand'

const TINT_CLASSES: Record<Tint, string> = {
  brown: 'bg-brown-300/10 text-brown-300',
  sage: 'bg-accent-sage/20 text-brown-200',
  rose: 'bg-accent-rose/20 text-brown-200',
  sand: 'bg-sand-200/70 text-brown-200',
}

function StatCard({
  label,
  value,
  icon,
  tint,
  hint,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tint: Tint
  hint?: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-brown-100/60 truncate">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-brown-300 tabular-nums">{nfmt(value)}</p>
          {hint && <p className="mt-0.5 text-[11px] text-brown-100/50 truncate">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TINT_CLASSES[tint]}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Views area chart (inline SVG)                                      */
/* ------------------------------------------------------------------ */

function ViewsAreaChart({ data }: { data: DayPoint[] }) {
  const points = data.length > 0 ? data : []
  const counts = points.map((d) => d.count)
  const total = counts.reduce((sum, n) => sum + n, 0)
  const max = Math.max(...counts, 1)

  const W = 560
  const H = 200
  const padX = 12
  const padTop = 16
  const padBottom = 26
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom
  const baseY = padTop + innerH

  const n = points.length
  const coords = points.map((d, i) => {
    const x = n <= 1 ? padX + innerW / 2 : padX + (i * innerW) / (n - 1)
    const y = baseY - (d.count / max) * innerH
    return { x, y }
  })

  const lineD = buildSmoothLine(coords)
  const areaD =
    coords.length > 0
      ? `${lineD} L ${coords[coords.length - 1].x.toFixed(2)} ${baseY} L ${coords[0].x.toFixed(2)} ${baseY} Z`
      : ''

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-brown-300/10 text-brown-300 flex items-center justify-center">
            <TrendingUp size={16} />
          </span>
          <h3 className="text-sm font-semibold text-brown-300">Baxışlar (son 14 gün)</h3>
        </div>
        <span className="text-sm font-semibold text-brown-300 tabular-nums">{nfmt(total)}</span>
      </div>

      {total === 0 ? (
        <div className="py-10">
          <EmptyState icon={<Eye size={22} />} title="Bu dövrdə baxış qeydə alınmayıb" />
        </div>
      ) : (
        <div className="mt-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Son 14 günün baxış qrafiki">
            <defs>
              <linearGradient id="viewsAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.brown300} stopOpacity="0.22" />
                <stop offset="100%" stopColor={COLORS.brown300} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* baseline */}
            <line x1={padX} y1={baseY} x2={W - padX} y2={baseY} stroke={COLORS.sand200} strokeWidth="1" />

            {areaD && <path d={areaD} fill="url(#viewsAreaFill)" />}
            {lineD && (
              <path d={lineD} fill="none" stroke={COLORS.brown300} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r="2.5" fill={COLORS.brown300} />
            ))}

            {points.map((d, i) =>
              i % 2 === 0 ? (
                <text
                  key={d.day}
                  x={coords[i].x}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={COLORS.brown100}
                  opacity="0.55"
                >
                  {shortDay(d.day)}
                </text>
              ) : null
            )}
          </svg>
        </div>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Status donut chart (inline SVG stroke-dasharray)                   */
/* ------------------------------------------------------------------ */

function StatusDonut({ data }: { data: StatusSlice[] }) {
  const slices = data.length > 0 ? data : []
  const total = slices.reduce((sum, s) => sum + s.count, 0)

  const size = 150
  const stroke = 20
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  let offsetAcc = 0

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-brown-300/10 text-brown-300 flex items-center justify-center">
          <Package size={16} />
        </span>
        <h3 className="text-sm font-semibold text-brown-300">Məhsul statusları</h3>
      </div>

      {total === 0 ? (
        <div className="py-8">
          <EmptyState icon={<Package size={22} />} title="Məhsul yoxdur" />
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label="Status paylanması">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={COLORS.sand200} strokeOpacity="0.5" strokeWidth={stroke} />
            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {slices.map((s) => {
                const frac = s.count / total
                const dash = frac * circumference
                const seg = (
                  <circle
                    key={s.status}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={STATUS_COLORS[s.status]}
                    strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offsetAcc}
                    strokeLinecap="butt"
                  />
                )
                offsetAcc += dash
                return s.count > 0 ? seg : null
              })}
            </g>
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="26" fontWeight="600" fill={COLORS.brown300}>
              {nfmt(total)}
            </text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize="10" fill={COLORS.brown100} opacity="0.6">
              məhsul
            </text>
          </svg>

          <ul className="flex-1 space-y-2 min-w-0">
            {slices.map((s) => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
              return (
                <li key={s.status} className="flex items-center gap-2.5 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.status] }} />
                  <span className="text-brown-100/80 flex-1 truncate">{STATUS_LABELS[s.status]}</span>
                  <span className="text-brown-300 font-medium tabular-nums">{nfmt(s.count)}</span>
                  <span className="text-brown-100/50 text-xs tabular-nums w-9 text-right">{pct}%</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Top products — horizontal bars (divs)                              */
/* ------------------------------------------------------------------ */

function TopProductsBars({ data }: { data: TopProduct[] }) {
  const rows = data.length > 0 ? data : []
  const max = Math.max(...rows.map((r) => r.views), 1)

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-brown-300/10 text-brown-300 flex items-center justify-center">
          <BarChart3 size={16} />
        </span>
        <h3 className="text-sm font-semibold text-brown-300">Ən çox baxılan məhsullar</h3>
      </div>

      {rows.length === 0 ? (
        <div className="py-6">
          <EmptyState icon={<BarChart3 size={22} />} title="Məlumat yoxdur" />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((p, i) => {
            const pct = Math.max(4, Math.round((p.views / max) * 100))
            return (
              <li key={`${p.name}-${i}`}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm text-brown-100/90 truncate">{p.name}</span>
                  <span className="text-xs font-medium text-brown-300 tabular-nums shrink-0">{nfmt(p.views)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-sand-200/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brown-300 transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Top countries — mini bar list                                      */
/* ------------------------------------------------------------------ */

function TopCountries({ data }: { data: CountrySlice[] }) {
  const rows = data.length > 0 ? data : []
  const max = Math.max(...rows.map((r) => r.count), 1)

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-brown-300/10 text-brown-300 flex items-center justify-center">
          <Globe size={16} />
        </span>
        <h3 className="text-sm font-semibold text-brown-300">Ölkələr</h3>
      </div>

      {rows.length === 0 ? (
        <div className="py-6">
          <EmptyState icon={<Globe size={22} />} title="Ölkə məlumatı yoxdur" />
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((cRow, i) => {
            const pct = Math.max(4, Math.round((cRow.count / max) * 100))
            return (
              <li key={`${cRow.country}-${i}`} className="flex items-center gap-3">
                <span className="text-sm text-brown-100/90 w-24 truncate shrink-0">{cRow.country}</span>
                <div className="flex-1 h-2 rounded-full bg-sand-200/50 overflow-hidden">
                  <div className="h-full rounded-full bg-accent-rose" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-medium text-brown-300 tabular-nums w-8 text-right shrink-0">
                  {nfmt(cRow.count)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Main dashboard                                                     */
/* ------------------------------------------------------------------ */

export function StatsDashboard() {
  const [data, setData] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(false)
    apiFetch('/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error('request failed')
        return r.json() as Promise<StatsResponse>
      })
      .then((d) => {
        if (active) setData(d)
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div>
        <PageHeader title="İdarə paneli" subtitle="Ümumi statistika və analitika" />
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-brown-100/60">
          <Loader2 size={26} className="animate-spin text-brown-300" />
          <p className="text-sm">Yüklənir...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="İdarə paneli" subtitle="Ümumi statistika və analitika" />
        <Card className="p-6">
          <EmptyState icon={<BarChart3 size={24} />} title="Statistika yüklənə bilmədi" />
        </Card>
      </div>
    )
  }

  const totals = data.totals
  const statusDistribution = data.statusDistribution ?? []
  const topProducts = data.topProducts ?? []
  const viewsByDay = data.viewsByDay ?? []
  const topCountries = data.topCountries ?? []

  const statCards: { label: string; value: number; icon: React.ReactNode; tint: Tint; hint?: string }[] = [
    {
      label: 'Ümumi məhsul',
      value: totals.products,
      icon: <Package size={18} />,
      tint: 'brown',
      hint: `${nfmt(totals.activeProducts)} aktiv`,
    },
    { label: 'Ümumi baxış', value: totals.totalViews, icon: <Eye size={18} />, tint: 'sage' },
    { label: 'Unikal baxış', value: totals.uniqueViews, icon: <Users size={18} />, tint: 'rose' },
    { label: 'Rəylər', value: totals.reviews, icon: <MessageSquare size={18} />, tint: 'sand' },
    { label: 'Endirim istifadəsi', value: totals.discountUsage, icon: <Tag size={18} />, tint: 'sage' },
    { label: 'Quiz cavabları', value: totals.quizResponses, icon: <Sparkles size={18} />, tint: 'rose' },
    { label: 'Analiz sessiyaları', value: totals.analysisSessions, icon: <Sparkles size={18} />, tint: 'sand' },
  ]

  return (
    <div>
      <PageHeader title="İdarə paneli" subtitle="Ümumi statistika və analitika" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} tint={s.tint} hint={s.hint} />
        ))}
      </div>

      {/* Row A: views area + status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <ViewsAreaChart data={viewsByDay} />
        </div>
        <div>
          <StatusDonut data={statusDistribution} />
        </div>
      </div>

      {/* Row B: top products + countries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2">
          <TopProductsBars data={topProducts} />
        </div>
        <div>
          <TopCountries data={topCountries} />
        </div>
      </div>
    </div>
  )
}
