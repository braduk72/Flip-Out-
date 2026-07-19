import { readdir, readFile } from 'node:fs/promises'
import pg from 'pg'

const apply = process.argv.includes('--apply')
const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is required')
if (process.env.VERCEL_ENV !== 'preview') throw new Error(`Refusing database operation outside Vercel Preview (received ${process.env.VERCEL_ENV || 'unset'})`)

const migrationsUrl = new URL('../api/migrations/', import.meta.url)
const files = (await readdir(migrationsUrl)).filter(name => /^\d+_.+\.sql$/.test(name)).sort()
const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
await client.connect()

try {
  const url = new URL(connectionString)
  const identity = await client.query(`SELECT current_database() AS database,current_user AS db_user,current_schema() AS schema,pg_is_in_recovery() AS read_replica`)
  console.log(JSON.stringify({ action: apply ? 'apply' : 'check', environment: process.env.VERCEL_ENV, host: url.hostname, ...identity.rows[0], migrationFiles: files }, null, 2))

  if (apply) {
    await client.query(`CREATE TABLE IF NOT EXISTS fo_schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
    for (const filename of files) {
      const done = await client.query(`SELECT 1 FROM fo_schema_migrations WHERE filename=$1`, [filename])
      if (done.rowCount) { console.log(`Migration already applied: ${filename}`); continue }
      const sql = await readFile(new URL(filename, migrationsUrl), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(`INSERT INTO fo_schema_migrations(filename) VALUES($1)`, [filename])
        await client.query('COMMIT')
        console.log(`Migration committed: ${filename}`)
      } catch (error) {
        await client.query('ROLLBACK')
        console.error(`Migration rolled back: ${filename}`)
        throw error
      }
    }
  }

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'fo_%'
    ORDER BY table_name
  `)
  const migrations = await client.query(`SELECT to_regclass('public.fo_schema_migrations') AS name`)
  const applied = migrations.rows[0].name ? await client.query(`SELECT filename, applied_at FROM fo_schema_migrations ORDER BY filename`) : { rows: [] }
  const constraints = await client.query(`
    SELECT rel.relname AS table_name, con.conname AS constraint_name, con.contype AS constraint_type
    FROM pg_constraint con JOIN pg_class rel ON rel.oid=con.conrelid
    WHERE rel.relname LIKE 'fo_%' ORDER BY rel.relname,con.conname
  `)
  const indexes = await client.query(`SELECT tablename,indexname FROM pg_indexes WHERE schemaname='public' AND tablename LIKE 'fo_%' ORDER BY tablename,indexname`)
  const columns = await client.query(`SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE 'fo_%' ORDER BY table_name,ordinal_position`)
  console.log(JSON.stringify({ tables: tables.rows.map(row => row.table_name), appliedMigrations: applied.rows, columns: columns.rows, constraints: constraints.rows, indexes: indexes.rows }, null, 2))
} finally {
  await client.end()
}
