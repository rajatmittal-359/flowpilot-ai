const fs = require('fs')
const path = require('path')

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#][^=]*)=(.*)$/)
    if (!m) continue
    const k = m[1].trim()
    let v = m[2].trim()
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
    process.env[k] = v
  }
}

async function run() {
  loadDotEnv()
  const { Pool } = require('pg')
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set in environment or .env.local')
    process.exit(1)
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const r0 = await pool.query("SELECT to_regclass('public.migrations') as exists")
    const migrationsExists = r0.rows[0].exists !== null
    let applied = []
    let appliedFlag = false
    if (migrationsExists) {
      const r1 = await pool.query("SELECT name FROM migrations")
      applied = r1.rows.map(r => r.name)
      const check = '002_add_resolved_at_to_tickets.sql'
      appliedFlag = applied.includes(check)
    }
    const r2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='resolved_at'")
    const hasResolved = r2.rows.length > 0
    console.log(JSON.stringify({ migrationsExists, applied, appliedFlag, hasResolved }, null, 2))
  } catch (e) {
    console.error('ERROR', e.message)
    process.exit(2)
  } finally {
    await pool.end()
  }
}

run()
