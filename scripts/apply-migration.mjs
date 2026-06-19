// Apply a SQL migration file to the database in DIRECT_URL / POSTGRES_URL_NON_POOLING.
// Usage: node --env-file=.env.local scripts/apply-migration.mjs supabase-migrations/010_*.sql
//
// Uses the direct (non-pooling) connection so multi-statement DDL runs cleanly.
// Whichever database the env file points at is the target — check before prod.
import { readFileSync } from 'node:fs';
import pg from 'pg';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node --env-file=.env.local scripts/apply-migration.mjs <path-to.sql>');
  process.exit(1);
}

const connectionString =
  process.env.POSTGRES_URL_NON_POOLING || process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('No POSTGRES_URL_NON_POOLING / DIRECT_URL / DATABASE_URL in env');
  process.exit(1);
}

// Strip sslmode from the URL so our explicit ssl option (which accepts
// Supabase's self-signed chain) isn't overridden by libpq verify-full semantics.
function relaxedUrl(cs) {
  const u = new URL(cs);
  u.searchParams.delete('sslmode');
  u.searchParams.delete('ssl');
  return u.toString();
}

const sql = readFileSync(file, 'utf8');
const client = new pg.Client({ connectionString: relaxedUrl(connectionString), ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  const host = new URL(connectionString.replace('postgres://', 'http://').replace('postgresql://', 'http://')).host;
  console.log(`Applying ${file}\n  → ${host}`);
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('✓ Applied successfully');
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('✗ Migration failed (rolled back):', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
