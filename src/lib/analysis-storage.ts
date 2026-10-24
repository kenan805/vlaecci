import type { AnalysisProfile } from './analysis'

/**
 * The visitor's last hair analysis result, kept in the browser so it survives leaving the page
 * (e.g. opening a recommended product and coming back).
 */
export interface SavedAnalysis {
  sessionId: string
  profile: AnalysisProfile
  savedAt: string
}

const STORAGE_KEY = 'vlaecci-hair-analysis'
const MAX_AGE_DAYS = 30

export function loadSavedAnalysis(): SavedAnalysis | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedAnalysis
    if (!saved?.sessionId || !saved.profile || !Array.isArray(saved.profile.products)) return null
    const ageDays = (Date.now() - new Date(saved.savedAt).getTime()) / 86_400_000
    if (!(ageDays <= MAX_AGE_DAYS)) {
      clearSavedAnalysis()
      return null
    }
    return saved
  } catch {
    return null
  }
}

export function saveAnalysis(sessionId: string, profile: AnalysisProfile, savedAt = new Date().toISOString()) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, profile, savedAt } satisfies SavedAnalysis))
  } catch {
    /* storage full or blocked — the result just won't be restored */
  }
}

export function clearSavedAnalysis() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
