import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is required in .env.local')
    process.exit(1)
  }

  const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations')
  const pool = new pkg.Pool({ connectionString: databaseUrl })

  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, run_at TIMESTAMPTZ DEFAULT NOW())`)

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
    const res = await pool.query('SELECT name FROM migrations')
    const applied = new Set(res.rows.map(r => r.name))

    for (const file of files) {
      if (applied.has(file)) continue
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log('Running', file)
      await pool.query(sql)
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file])
    }

    console.log('Migrations complete')
  } catch (err) {
    console.error('Migration error', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
}
