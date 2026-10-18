'use client'

import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { ImageUploadButton } from '@/components/ImageUploadButton'
import { VARIANT_UNITS, type ProductVariant, type VariantUnit } from '@/lib/variants'
import { Toggle } from './ui'

/** Editable copy of a variant; numbers are kept as strings while the admin types. */
export interface VariantDraft {
  key: string
  id?: string
  amount: string
  unit: VariantUnit
  label: string
  price: string
  image: string
  isActive: boolean
}

export function toDrafts(variants: ProductVariant[] | undefined): VariantDraft[] {
  return (variants ?? []).map((v) => ({
    key: v.id,
    id: v.id,
    amount: String(v.amount),
    unit: v.unit,
    label: v.label,
    price: String(v.price),
    image: v.images[0] ?? '',
    isActive: v.isActive,
  }))
}

export function fromDrafts(drafts: VariantDraft[], perVariantImages: boolean) {
  return drafts.map((d) => ({
    id: d.id,
    amount: Number(d.amount.replace(',', '.')),
    unit: d.unit,
    label: d.label.trim(),
    price: Math.round(Number(d.price.replace(',', '.')) * 100) / 100,
    images: perVariantImages && d.image ? [d.image] : [],
    isActive: d.isActive,
  }))
}

/** Returns a validation message, or null when the drafts can be saved. */
export function validateDrafts(drafts: VariantDraft[]): string | null {
  for (const d of drafts) {
    const amount = Number(d.amount.replace(',', '.'))
    const price = Number(d.price.replace(',', '.'))
    if (!d.amount || !Number.isFinite(amount) || amount <= 0) return 'Hər variant üçün həcmi daxil edin'
    if (d.price === '' || !Number.isFinite(price) || price < 0) return 'Hər variant üçün qiyməti daxil edin'
  }
  if (drafts.length > 0 && !drafts.some((d) => d.isActive)) return 'Ən azı bir variant aktiv olmalıdır'
  return null
}

const PRESETS: { amount: string; unit: VariantUnit; label: string }[] = [
  { amount: '20', unit: 'ml', label: 'Test versiya' },
  { amount: '30', unit: 'ml', label: '' },
  { amount: '50', unit: 'ml', label: '' },
]

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-sand-200 bg-white text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/50'

const decimalOk = (v: string) => v === '' || /^\d*[.,]?\d{0,2}$/.test(v)

export function VariantEditor({
  drafts,
  onChange,
  perVariantImages,
  onPerVariantImagesChange,
}: {
  drafts: VariantDraft[]
  onChange: (next: VariantDraft[]) => void
  perVariantImages: boolean
  onPerVariantImagesChange: (next: boolean) => void
}) {
  const update = (key: string, patch: Partial<VariantDraft>) =>
    onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  const add = (preset?: Partial<VariantDraft>) =>
    onChange([
      ...drafts,
      {
        key: crypto.randomUUID(),
        amount: '',
        unit: drafts[drafts.length - 1]?.unit ?? 'ml',
        label: '',
        price: '',
        image: '',
        isActive: true,
        ...preset,
      },
    ])

  const move = (index: number, delta: number) => {
    const next = [...drafts]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    onChange(next)
  }

  const usedPreset = (p: (typeof PRESETS)[number]) =>
    drafts.some((d) => d.amount === p.amount && d.unit === p.unit)

  return (
    <div className="rounded-2xl border border-sand-200/80 bg-white/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-brown-300">Həcm / ölçü variantları</p>
          <p className="text-xs text-brown-100/60 mt-0.5">
            {drafts.length === 0
              ? 'Məhsulun bir neçə həcmi varsa, burada əlavə edin. Əks halda yuxarıdakı qiymət istifadə olunur.'
              : 'Hər həcmin öz qiyməti var. Müştəri həcmi məhsul kartında və səhifəsində seçir.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.filter((p) => !usedPreset(p)).map((p) => (
            <button
              key={`${p.amount}${p.unit}`}
              type="button"
              onClick={() => add(p)}
              className="inline-flex items-center gap-1 rounded-full border border-sand-200 bg-cream-50 px-2.5 py-1 text-xs font-medium text-brown-200 hover:border-brown-300/50"
            >
              <Plus size={12} />
              {p.amount} {p.unit}
              {p.label && <span className="text-brown-100/50">· test</span>}
            </button>
          ))}
        </div>
      </div>

      {drafts.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-cream-100/70 px-3 py-2.5">
            <div>
              <p className="text-sm text-brown-300">Hər həcm üçün ayrıca şəkil</p>
              <p className="text-xs text-brown-100/60">
                {perVariantImages
                  ? 'Şəkli olmayan həcmlərdə əsas məhsul şəkli göstərilir.'
                  : 'Bütün həcmlər əsas məhsul şəklini istifadə edir.'}
              </p>
            </div>
            <Toggle checked={perVariantImages} onChange={onPerVariantImagesChange} label="Hər həcm üçün ayrıca şəkil" />
          </div>

          <div className="mt-3 space-y-2">
            {drafts.map((d, i) => (
              <div
                key={d.key}
                className={`rounded-xl border border-sand-200/80 bg-cream-50 p-3 ${d.isActive ? '' : 'opacity-60'}`}
              >
                <div className="flex gap-3">
                  {perVariantImages && (
                    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border border-sand-200 bg-sand-200/30 flex items-center justify-center">
                      {d.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={d.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => update(d.key, { image: '' })}
                            className="absolute top-1 right-1 rounded-md bg-white/90 p-0.5 text-brown-300 shadow"
                            aria-label="Şəkli sil"
                          >
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <ImageUploadButton onUploaded={(url) => update(d.key, { image: url })} />
                      )}
                    </div>
                  )}

                  <div className="grid flex-1 min-w-0 grid-cols-2 sm:grid-cols-[90px_90px_minmax(0,1fr)_100px] items-center content-center gap-2">
                    <input
                      inputMode="decimal"
                      value={d.amount}
                      onChange={(e) => decimalOk(e.target.value) && update(d.key, { amount: e.target.value })}
                      placeholder="Həcm"
                      aria-label="Həcm"
                      className={inputCls}
                    />
                    <select
                      value={d.unit}
                      onChange={(e) => update(d.key, { unit: e.target.value as VariantUnit })}
                      aria-label="Vahid"
                      className={inputCls}
                    >
                      {VARIANT_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={d.label}
                      onChange={(e) => update(d.key, { label: e.target.value })}
                      placeholder="Etiket (məs. Test versiya)"
                      aria-label="Etiket"
                      maxLength={60}
                      className={`${inputCls} col-span-2 sm:col-span-1`}
                    />
                    <div className="relative col-span-2 sm:col-span-1">
                      <input
                        inputMode="decimal"
                        value={d.price}
                        onChange={(e) => decimalOk(e.target.value) && update(d.key, { price: e.target.value })}
                        placeholder="Qiymət"
                        aria-label="Qiymət"
                        className={`${inputCls} pr-7`}
                      />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-brown-100/50">
                        ₼
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Toggle checked={d.isActive} onChange={(v) => update(d.key, { isActive: v })} label="Aktiv" />
                    <span className={`text-xs ${d.isActive ? 'text-accent-sage' : 'text-brown-100/50'}`}>
                      {d.isActive ? 'Satışda' : 'Gizli'}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="p-1.5 rounded-md text-brown-100/60 hover:bg-sand-200/50 disabled:opacity-30"
                      aria-label="Yuxarı"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={i === drafts.length - 1}
                      onClick={() => move(i, 1)}
                      className="p-1.5 rounded-md text-brown-100/60 hover:bg-sand-200/50 disabled:opacity-30"
                      aria-label="Aşağı"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(drafts.filter((x) => x.key !== d.key))}
                      className="p-1.5 rounded-md text-brown-100/60 hover:bg-red-50 hover:text-red-500"
                      aria-label="Variantı sil"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => add()}
        className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-sand-300 px-3 py-2 text-sm font-medium text-brown-200 hover:border-brown-300/50 hover:bg-sand-200/20"
      >
        <Plus size={15} />
        Variant əlavə et
      </button>
    </div>
  )
}
