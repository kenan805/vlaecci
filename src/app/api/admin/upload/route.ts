import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireAdmin } from '@/lib/admin-guard'
import { uploadProductImage } from '@/lib/blob-upload'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 4 * 1024 * 1024

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Yalnız şəkil faylları qəbul edilir' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Şəkil çox böyükdür (maksimum 4MB)' }, { status: 400 })
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const pathname = `products/${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

    // Use Blob whenever it is configured — also locally, so images uploaded from localhost
    // against a shared (Neon) database are reachable from every environment.
    const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV)
    if (onVercel || process.env.BLOB_READ_WRITE_TOKEN) {
      const url = await uploadProductImage(buffer, pathname, contentType)
      return NextResponse.json({ url, pathname })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    const localName = `${randomUUID()}.${ext}`
    await writeFile(path.join(uploadsDir, localName), buffer)
    return NextResponse.json({ url: `/uploads/${localName}` })
  } catch (err) {
    console.error('Upload error:', err)
    const detail = err instanceof Error ? err.message : 'Yükləmə uğursuz'
    return NextResponse.json(
      {
        error: `Şəkil yüklənmədi: ${detail}. Blob-u layihəyə bağlayıb yenidən deploy edin.`,
      },
      { status: 500 }
    )
  }
}
