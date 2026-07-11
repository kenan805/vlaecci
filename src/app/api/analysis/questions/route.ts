import { NextResponse } from 'next/server'
import { getAnalysisQuestions } from '@/lib/analysis'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const questions = await getAnalysisQuestions()
    return NextResponse.json({ questions })
  } catch (err) {
    console.error('Analysis questions error:', err)
    return NextResponse.json({ questions: [] })
  }
}
