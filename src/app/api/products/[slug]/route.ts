import { NextResponse } from 'next/server'
import { getProductBySlug } from '@/lib/products'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const product = await getProductBySlug(slug)

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (err) {
    console.error('Product detail error:', err)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
