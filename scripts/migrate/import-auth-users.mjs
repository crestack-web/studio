#!/usr/bin/env node
/**
 * import-auth-users.mjs
 * ============================================================
 * Recreates Firebase Auth users as Supabase Auth users (step 1
 * of the migration). Must run BEFORE import-supabase.mjs so the
 * public.users FK (id -> auth.users) holds.
 *
 * Usage:
 *   node scripts/migrate/import-auth-users.mjs
 *
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Input:
 *   supabase/migration-data/users.json  (produced by export-firestore.mjs)
 *
 * Output:
 *   supabase/migration-data/auth-users.json
 *   { "<firebaseUid>": "<supabaseUid>", ... }
 *
 * NOTE: users get a random password and email_confirm=true. Tell
 * them to use "forgot password" on first sign-in.
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA_DIR = path.join(ROOT, 'supabase', 'migration-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OUT_FILE = path.join(DATA_DIR, 'auth-users.json');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function randomPassword() {
  // Avoid characters that could be stripped; meets common complexity rules.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  let pw = '';
  for (let i = 0; i < 16; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw + '!Aa1';
}

async function listAllUsers() {
  const all = [];
  let page = 1;
  for (;;) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 1000 || data.users.length === 0) break;
    page++;
  }
  return all;
}

async function main() {
  const users = JSON.parse(await readFile(USERS_FILE, 'utf8'));
  console.log(`Migrating ${users.length} users to Supabase Auth...`);

  // One-time fetch of existing auth users so we can reuse by email.
  const existingByEmail = new Map();
  try {
    const existing = await listAllUsers();
    for (const x of existing) existingByEmail.set((x.email || '').toLowerCase(), x.id);
    console.log(`Found ${existing.length} existing Supabase auth users`);
  } catch (e) {
    console.warn(`Could not list existing users (${e.message}); will try create only.`);
  }

  /** @type {Record<string, string>} */
  const mapping = {};
  let created = 0;
  let reused = 0;
  let skipped = 0;

  for (const u of users) {
    const firebaseUid = u._id;
    const email = (u.email || '').toLowerCase().trim();
    if (!firebaseUid || !email) {
      skipped++;
      console.warn(`  SKIP no uid/email: ${firebaseUid} ${email}`);
      continue;
    }

    try {
      const existingId = existingByEmail.get(email);
      if (existingId) {
        mapping[firebaseUid] = existingId;
        reused++;
        console.log(`  REUSE ${email} -> ${existingId}`);
        continue;
      }

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: { full_name: u.fullName || u.full_name || u.name || '', firebase_uid: firebaseUid },
      });
      if (error) {
        // Race: someone created it between the list and now.
        const { data: again, error: againErr } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (againErr) throw againErr;
        const rematch = again.users.find((x) => (x.email || '').toLowerCase() === email);
        if (rematch) {
          existingByEmail.set(email, rematch.id);
          mapping[firebaseUid] = rematch.id;
          reused++;
          console.log(`  REUSE(race) ${email} -> ${rematch.id}`);
        } else {
          skipped++;
          console.warn(`  SKIP create failed ${email}: ${error.message}`);
        }
        continue;
      }
      existingByEmail.set(email, data.user.id);
      mapping[firebaseUid] = data.user.id;
      created++;
      console.log(`  CREATE ${email} -> ${data.user.id}`);
    } catch (e) {
      skipped++;
      console.warn(`  SKIP ${email}: ${e.message}`);
    }
  }

  await writeFile(OUT_FILE, JSON.stringify(mapping, null, 2));
  console.log(`\nDone. created=${created} reused=${reused} skipped=${skipped}`);
  console.log('Mapping written to', OUT_FILE);
}

main().catch((e) => {
  console.error('Auth import failed:', e);
  process.exit(1);
});
