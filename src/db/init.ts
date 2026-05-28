import { readdirSync, readFileSync } from "fs"
import { join } from "path"
import { query, queryOne } from "./index"

const MIGRATIONS_DIR = join(process.cwd(), "src", "db", "migrations")

export async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function appliedMigrations() {
  await ensureMigrationsTable()
  const rows = await query<{ name: string }>(`SELECT name FROM migrations`)
  return new Set(rows.map((r) => r.name))
}

export async function runMigrations() {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()
  const applied = await appliedMigrations()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
    console.log("Running migration:", file)
    await query(sql)
    await query("INSERT INTO migrations (name) VALUES ($1)", [file])
  }
}

if (require.main === module) {
  ;(async () => {
    try {
      await runMigrations()
      console.log("Migrations complete.")
      process.exit(0)
    } catch (err) {
      console.error("Migration failed", err)
      process.exit(1)
    }
  })()
}
