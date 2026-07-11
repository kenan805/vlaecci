import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vlaecci-dev-secret-change-me'
)

const COOKIE_NAME = 'vlaecci_admin_session'

export interface AdminSession {
  adminId: string
  email: string
}

export async function getAdminFromRequest(req: NextRequest): Promise<AdminSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

export async function requireAdmin(req: NextRequest): Promise<AdminSession | null> {
  return getAdminFromRequest(req)
}
