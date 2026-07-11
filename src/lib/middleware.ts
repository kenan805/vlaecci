/**
 * Admin route protection - use in API routes that require auth
 */
import { getSession } from './auth'

export async function requireAdmin() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
