#!/usr/bin/env node
/**
 * import-supabase.mjs
 * ============================================================
 * Imports the exported Firestore JSON files into Supabase via
 * PostgREST (no direct Postgres connection needed).
 * Run AFTER:
 *   1. node scripts/migrate/export-firestore.mjs
 *   2. node scripts/migrate/import-auth-users.mjs   (produces auth-users.json)
 *   3. supabase/migrations applied to the project   (0001, 0002)
 *
 * Usage:
 *   node scripts/migrate/import-supabase.mjs [table1 table2 ...]
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Behaviour:
 *   * Reads the table schema from PostgREST's OpenAPI endpoint.
 *   * Converts camelCase Firestore fields to snake_case columns.
 *   * Drops fields with no matching column (extras -> metadata if present).
 *   * Remaps firebase uids -> supabase uids in uuid columns using auth-users.json.
 *   * Upserts in batches with ON CONFLICT (primary key).
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA_DIR = path.join(ROOT, 'supabase', 'migration-data');
const BATCH = 200;

// Tables whose PK is not `id`.
const KEY_BY = {
  business_profiles: 'business_id',
  store: 'business_id',
  referral_stats: 'user_id',
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function camelToSnake(s) {
  return s
    .replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
    .replace(/-/g, '_')
    .replace(/^_/, '');
}

// PostgREST OpenAPI -> { table: { column: { type, format } } }
async function fetchSchema() {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/openapi+json',
    },
  });
  if (!res.ok) throw new Error(`OpenAPI schema fetch failed (${res.status})`);
  const doc = await res.json();
  const schemas = doc.components?.schemas || doc.definitions || {};
  const out = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const props = schema.properties || {};
    out[name.toLowerCase()] = Object.fromEntries(
      Object.entries(props).map(([col, meta]) => [col, { type: meta.type, format: meta.format }])
    );
  }
  return out;
}

function coerce(value, col) {
  if (value === null || value === undefined) return null;
  const fmt = col?.format;
  const type = col?.type;

  // uuid columns: keep the (already remapped) string
  if (fmt === 'uuid') return value;

  // array columns: pass the JSON array as-is so PostgREST casts it to a PG array
  if (type === 'array' && Array.isArray(value)) return value;

  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value);

  if (type === 'number' && typeof value === 'string') {
    return fmt === 'integer' || fmt === 'bigint' || fmt === 'smallint'
      ? parseInt(value, 10)
      : parseFloat(value);
  }
  if (type === 'boolean' && typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  if ((fmt === 'timestamp with time zone' || fmt === 'date' || fmt === 'timestamp without time zone') && typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return value;
}

async function main() {
  const requested = process.argv.slice(2);

  let authMapping = {};
  try {
    authMapping = JSON.parse(await readFile(path.join(DATA_DIR, 'auth-users.json'), 'utf8'));
    console.log(`Loaded auth-users mapping (${Object.keys(authMapping).length} users)`);
  } catch {
    console.warn('No auth-users.json found - uuid remapping will be skipped.');
  }

  console.log('Fetching schema from PostgREST...');
  const schema = await fetchSchema();

  const files = (await readdir(DATA_DIR))
    .filter((f) => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('auth-users'))
    .sort();

  const targets = requested.length ? requested.map((t) => `${t}.json`) : files;

  let totalRows = 0;
  let totalErrors = 0;

  for (const file of targets) {
    const table = camelToSnake(file.replace(/\.json$/, ''));
    const filePath = path.join(DATA_DIR, file);
    let docs;
    try {
      docs = JSON.parse(await readFile(filePath, 'utf8'));
    } catch (e) {
      console.warn(`SKIP ${table}: could not read (${e.message})`);
      continue;
    }
    if (!Array.isArray(docs) || docs.length === 0) {
      console.log(`SKIP ${table}: empty`);
      continue;
    }

    const columns = schema[table];
    if (!columns) {
      console.warn(`SKIP ${table}: table not found in schema`);
      continue;
    }

    const hasMetadata = 'metadata' in columns;
    const keyCol = KEY_BY[table] || 'id';

    const rows = docs.map((doc) => {
      const row = {};
      for (const [field, value] of Object.entries(doc)) {
        if (field === '_id') continue;
        if (field === '_businessId') {
          if ('business_id' in columns) row.business_id = value;
          continue;
        }
        if (field === '_userId') {
          if ('user_id' in columns) row.user_id = authMapping[value] || value;
          continue;
        }
        const col = camelToSnake(field);
        if (col in columns) {
          let v = value;
          if (columns[col].format === 'uuid' && typeof v === 'string') {
            v = authMapping[v] || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null);
          }
          row[col] = coerce(v, columns[col]);
        } else if (hasMetadata && !(col in row)) {
          row.metadata ??= {};
          row.metadata[camelToSnake(field)] = value;
        }
      }

      if (keyCol === 'id') {
        // users.id must be the supabase auth uid (uuid), not the firebase uid
        row.id = table === 'users' ? authMapping[doc._id] : doc._id;
      }
      if (keyCol === 'business_id') row.business_id = doc._businessId || doc._id;
      if (keyCol === 'user_id') row.user_id = authMapping[doc._id] || doc._id;

      for (const k of Object.keys(row)) {
        if (row[k] === null && k !== keyCol) delete row[k];
      }

      return row;
    }).filter((r) => {
      if (keyCol === 'id') return !!r.id;
      return Object.values(r).some((v) => v !== null && v !== undefined);
    });

    if (rows.length === 0) {
      console.log(`SKIP ${table}: no importable rows`);
      continue;
    }

    const conflictTarget = keyCol;

    const deduped = [...new Map(rows.map((r) => [r[conflictTarget], r])).values()];

    let errors = 0;
    for (let i = 0; i < deduped.length; i += BATCH) {
      const chunk = deduped.slice(i, i + BATCH);
      const { error } = await adminClient.from(table).upsert(chunk, {
        onConflict: conflictTarget,
        defaultToNull: false,
      });
      if (error) {
        errors++;
        console.warn(`  ERROR ${table} batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
      }
    }

    if (errors) totalErrors += errors;
    console.log(`OK ${table}: ${deduped.length} rows (${errors ? errors + ' batch errors' : 'clean'})`);
    totalRows += rows.length;
  }

  console.log(`\nDone. ${totalRows} rows attempted. ${totalErrors} batch errors.`);
}

main().catch((e) => {
  console.error('Import failed:', e);
  process.exit(1);
});
