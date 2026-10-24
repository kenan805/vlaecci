import { randomUUID } from 'crypto'
import { query } from './db'

export interface HairTypeOption {
  id: string
  label: string
  sortOrder: number
  isActive: boolean
}

export const HAIR_TYPE_LABEL_MAX = 40

/** Hair types in admin-defined order. */
export async function listHairTypes(onlyActive: boolean): Promise<HairTypeOption[]> {
  const result = await query<{ id: string; label: string; sort_order: number | null; is_active: boolean | null }>(
    `SELECT id, label, sort_order, is_active FROM hair_types
     ${onlyActive ? 'WHERE COALESCE(is_active, true) = true' : ''}
     ORDER BY sort_order ASC, created_at ASC`
  )
  return result.rows.map((r) => ({
    id: r.id,
    label: r.label,
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active ?? true,
  }))
}

export function parseHairTypeLabel(raw: unknown): { label: string } | { error: string } {
  const label = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
  if (!label) return { error: 'Saç tipinin adı boş ola bilməz' }
  if (label.length > HAIR_TYPE_LABEL_MAX) return { error: `Ad ən çox ${HAIR_TYPE_LABEL_MAX} simvol ola bilər` }
  return { label }
}

export async function createHairType(label: string): Promise<HairTypeOption> {
  const id = randomUUID()
  const result = await query<{ sort_order: number }>(
    `INSERT INTO hair_types (id, label, sort_order)
     VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM hair_types))
     RETURNING sort_order`,
    [id, label]
  )
  return { id, label, sortOrder: result.rows[0].sort_order, isActive: true }
}

/**
 * Removes a hair type. Reviews that used it keep the name as their own text, so they don't
 * end up showing an internal id.
 */
export async function deleteHairType(id: string): Promise<boolean> {
  const existing = await query<{ label: string }>('SELECT label FROM hair_types WHERE id = $1', [id])
  const label = existing.rows[0]?.label
  if (!label) return false
  await query('UPDATE product_reviews SET hair_type = $1 WHERE hair_type = $2', [label, id])
  await query('DELETE FROM hair_types WHERE id = $1', [id])
  return true
}
