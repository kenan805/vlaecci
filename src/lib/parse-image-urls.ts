export function isValidImageUrl(url: string) {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/api/media/') ||
    url.startsWith('/uploads/') ||
    url.startsWith('/products/')
  )
}

/** Extract image links from textarea. Ignores data: URLs. */
export function parseImageUrls(text: string): string[] {
  const fromLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(isValidImageUrl)

  const fromInline = [
    ...(text.match(/https?:\/\/[^\s\n]+/g) || []),
    ...(text.match(/\/api\/media\/[^\s\n]+/g) || []),
  ]

  const seen = new Set<string>()
  const result: string[] = []
  for (const url of [...fromLines, ...fromInline]) {
    const clean = url.replace(/[,\s]+$/, '')
    if (!seen.has(clean)) {
      seen.add(clean)
      result.push(clean)
    }
  }
  return result
}

export function sanitizeImageUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return []
  return urls.filter(
    (url): url is string => typeof url === 'string' && isValidImageUrl(url) && !url.startsWith('data:')
  )
}
