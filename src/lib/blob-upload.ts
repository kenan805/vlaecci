import { put, BlobAccessError } from '@vercel/blob'

export function blobMediaUrl(pathname: string) {
  return `/api/media/${pathname}`
}

function isPrivateStoreError(err: unknown) {
  return (
    err instanceof BlobAccessError ||
    (err instanceof Error &&
      (err.message.includes('private store') || err.message.includes('public access')))
  )
}

export async function uploadProductImage(
  buffer: Buffer,
  pathname: string,
  contentType: string
): Promise<string> {
  try {
    await put(pathname, buffer, {
      access: 'public',
      contentType,
    })
  } catch (err) {
    if (!isPrivateStoreError(err)) throw err
    await put(pathname, buffer, {
      access: 'private',
      contentType,
    })
  }

  return blobMediaUrl(pathname)
}
