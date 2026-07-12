'use client'

import { useEffect } from 'react'
import { X, Search } from 'lucide-react'

/* ------------------------------------------------------------------ */
/* Shared form control styles (clean, brand palette)                  */
/* ------------------------------------------------------------------ */

export const fieldClassName =
  'w-full px-3.5 py-2.5 rounded-xl border border-sand-200/70 bg-white text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/40 transition-colors'

export const selectChevronStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B5344' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
}

export const modernSelectClassName = `${fieldClassName} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat cursor-pointer hover:border-brown-300/45`

export const labelClassName = 'block text-sm font-medium text-brown-100 mb-1.5'

/* ------------------------------------------------------------------ */
/* Page header — title + subtitle on the left, action on the right    */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-brown-300">{title}</h2>
        {subtitle && <p className="text-sm text-brown-100/70 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Primary / ghost buttons                                            */
/* ------------------------------------------------------------------ */

export function PrimaryButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 px-4 py-2.5 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium shadow-sm hover:bg-brown-400 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-brown-100 border border-sand-200/70 bg-white hover:bg-sand-200/40 hover:text-brown-300 disabled:opacity-50 disabled:pointer-events-none transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

/* Icon action button used inside table/card rows */
export function IconButton({
  children,
  danger = false,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors ${
        danger
          ? 'text-brown-100/50 hover:bg-red-50 hover:text-red-500'
          : 'text-brown-100/70 hover:bg-sand-200/60 hover:text-brown-300'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Search input (icon + clearable)                                    */
/* ------------------------------------------------------------------ */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Axtar...',
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-100/50 pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 rounded-xl border border-sand-200/70 bg-white text-sm text-brown-300 placeholder:text-brown-100/40 focus:outline-none focus:ring-2 focus:ring-brown-300/20 focus:border-brown-300/40 transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-brown-100/50 hover:text-brown-300 hover:bg-sand-200/50 transition-colors"
          aria-label="Təmizlə"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Active / inactive toggle switch                                    */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-accent-sage' : 'bg-sand-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Card surface + empty state                                         */
/* ------------------------------------------------------------------ */

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-sand-200/70 bg-white shadow-[0_1px_3px_rgba(74,61,50,0.05)] ${className}`}>
      {children}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-brown-100/60">
      <div className="w-14 h-14 rounded-2xl bg-sand-200/40 flex items-center justify-center text-sand-400">{icon}</div>
      <p className="text-sm">{title}</p>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal shell (matches Products page modals)                         */
/* ------------------------------------------------------------------ */

export function AdminModal({
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-brown-300/40 backdrop-blur-[2px]"
        aria-label="Bağla"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-xl'} max-h-[90vh] flex flex-col rounded-2xl bg-cream-50 shadow-xl border border-sand-200/80`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-200/60 shrink-0">
          <h3 className="font-serif text-lg font-medium text-brown-300">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-brown-100 hover:bg-sand-200/60 transition-colors"
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="shrink-0 px-5 py-4 border-t border-sand-200/60 bg-cream-50 rounded-b-2xl">{footer}</div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal footer with cancel + submit                                  */
/* ------------------------------------------------------------------ */

export function ModalFooter({
  onCancel,
  submitForm,
  submitLabel,
  loading = false,
  disabled = false,
}: {
  onCancel: () => void
  submitForm?: string
  submitLabel: string
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-brown-100 border border-sand-200 hover:bg-sand-200/40 transition-colors"
      >
        Ləğv et
      </button>
      <button
        type="submit"
        form={submitForm}
        disabled={loading || disabled}
        className="px-6 py-2.5 bg-brown-300 text-cream-50 rounded-xl text-sm font-medium hover:bg-brown-400 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? 'Saxlanılır...' : submitLabel}
      </button>
    </div>
  )
}
