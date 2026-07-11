import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { runSeed } from '../src/lib/seed'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

async function seed() {
  const result = await runSeed()
  console.log(`Admin: ${result.adminEmail}`)
  console.log('Seed tamamlandı!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed xətası:', err)
  process.exit(1)
})
