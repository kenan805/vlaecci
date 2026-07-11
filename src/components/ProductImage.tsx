import Image from 'next/image'

interface ProductImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
}

export function ProductImage({ src, alt, fill, className, sizes, priority }: ProductImageProps) {
  const isDataUrl = src.startsWith('data:')
  const isProxied = src.startsWith('/api/media/') || src.startsWith('/uploads/')

  if (isDataUrl || isProxied) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={fill ? `absolute inset-0 h-full w-full object-cover ${className || ''}` : className}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  )
}
