import { get } from '@vercel/blob'

export const dynamic = 'force-dynamic'

async function fetchBlob(pathname: string) {
  for (const access of ['private', 'public'] as const) {
    try {
      const result = await get(pathname, { access })
      if (result?.stream) return result
    } catch {
      // try next access mode
    }
  }
  return null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const pathname = path.join('/')

  if (!pathname.startsWith('products/')) {
    return new Response('Not found', { status: 404 })
  }

  try {
    const result = await fetchBlob(pathname)
    if (!result?.stream) {
      return new Response('Not found', { status: 404 })
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err) {
    console.error('Media proxy error:', err)
    return new Response('Not found', { status: 404 })
  }
}
