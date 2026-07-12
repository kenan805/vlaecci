'use client'

import { useEffect, useRef, useState } from 'react'
import { User, Upload, Trash2, Loader2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { compressImageFile } from '@/lib/compress-image'
import { isValidImageUrl } from '@/lib/parse-image-urls'
import { PageHeader, Card, PrimaryButton, fieldClassName, labelClassName } from './ui'
import { useToast } from './Toast'

interface ProfileResponse {
  email: string
  avatarUrl: string | null
}

const MAX_AVATAR_SIZE = 4 * 1024 * 1024

export function ProfileSettings({ onUpdated }: { onUpdated?: () => void }) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    let active = true
    apiFetch('/admin/profile')
      .then((r) => r.json())
      .then((data: ProfileResponse) => {
        if (!active) return
        setEmail(data.email || '')
        setAvatarUrl(data.avatarUrl ?? null)
      })
      .catch(() => {
        if (active) toast('Profil məlumatı yüklənmədi', 'error')
      })
    return () => {
      active = false
    }
  }, [toast])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Yalnız şəkil faylları (jpg, png, webp)', 'error')
      e.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast('Maksimum ölçü: 4MB', 'error')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const compressed = await compressImageFile(file)
      const formData = new FormData()
      formData.append('file', compressed)
      const res = await apiFetch('/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Yükləmə uğursuz')
      const url = typeof data.url === 'string' ? data.url.trim() : ''
      if (!isValidImageUrl(url)) throw new Error('Server link qaytarmadı')

      const saveRes = await apiFetch('/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok) throw new Error(saveData.error || 'Yadda saxlanmadı')

      setAvatarUrl(url)
      onUpdated?.()
      toast('Profil şəkli yeniləndi')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Yükləmə uğursuz', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setRemoving(true)
    try {
      const res = await apiFetch('/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Xəta')
      setAvatarUrl(null)
      onUpdated?.()
      toast('Profil şəkli silindi')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Şəkil silinmədi', 'error')
    } finally {
      setRemoving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      toast('Cari parolu daxil edin', 'error')
      return
    }
    if (newPassword.length < 6) {
      toast('Yeni parol ən azı 6 simvol olmalıdır', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('Yeni parollar uyğun gəlmir', 'error')
      return
    }

    setSavingPassword(true)
    try {
      const res = await apiFetch('/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Parol dəyişdirilmədi')
      toast('Parol dəyişdirildi')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Parol dəyişdirilmədi', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div>
      <PageHeader title="Profil" subtitle="Hesab məlumatlarını idarə et" />

      <div className="space-y-4 max-w-2xl">
        {/* Account: avatar + identity + upload */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-sand-200/60 to-cream-200 border border-sand-200/70 flex items-center justify-center shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profil şəkli" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-brown-100/45" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-serif text-lg font-medium text-brown-300 truncate">{email || '—'}</p>
              <span className="inline-flex items-center gap-1.5 mt-0.5 text-xs text-brown-100/60">
                <Mail size={12} />
                Administrator
              </span>

              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || removing}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-brown-300 text-cream-50 hover:bg-brown-400 disabled:opacity-50 disabled:pointer-events-none transition-colors shadow-sm"
                >
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {uploading ? 'Yüklənir...' : 'Şəkil yüklə'}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={uploading || removing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-brown-100 border border-sand-200/70 bg-white hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {removing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    Sil
                  </button>
                )}
                <span className="text-[11px] text-brown-100/45">JPG, PNG, WEBP · maks. 4MB</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Parolu dəyiş */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg bg-sand-200/50 text-brown-300 flex items-center justify-center shrink-0">
              <Lock size={16} />
            </span>
            <h3 className="font-serif text-lg font-medium text-brown-300">Parolu dəyiş</h3>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-password" className={labelClassName}>
                Cari parol
              </label>
              <input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={fieldClassName}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-password" className={labelClassName}>
                  Yeni parol
                </label>
                <input
                  id="new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className={fieldClassName}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className={labelClassName}>
                  Yeni parol təkrar
                </label>
                <input
                  id="confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={fieldClassName}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brown-100/70 hover:text-brown-300 transition-colors"
              >
                {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPasswords ? 'Parolları gizlət' : 'Parolları göstər'}
              </button>
              <PrimaryButton type="submit" disabled={savingPassword}>
                {savingPassword && <Loader2 size={16} className="animate-spin" />}
                {savingPassword ? 'Saxlanılır...' : 'Parolu dəyiş'}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
