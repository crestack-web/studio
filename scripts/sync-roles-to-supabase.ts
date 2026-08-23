/**
 * One-time script: Sync user roles from Supabase users table → auth user_metadata.
 * Run: npx tsx scripts/sync-roles-to-supabase.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // Get all auth users
  const authUsers: { id: string; email: string; metadata: Record<string, any> }[] = [];
  let page = 1;
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (!data.users.length) break;
    authUsers.push(...data.users.map((u) => ({
      id: u.id,
      email: u.email || '',
      metadata: u.user_metadata || {},
    })));
    if (data.users.length < 1000) break;
    page++;
  }

  console.log(`Found ${authUsers.length} auth users`);

  // Get roles from public.users table
  const { data: tableUsers, error: tableErr } = await supabase
    .from('users')
    .select('id, email, role');

  if (tableErr) {
    console.error('Error reading users table:', tableErr);
    process.exit(1);
  }

  console.log(`Found ${tableUsers?.length || 0} users in public.users table`);

  const roleMap = new Map<string, string>();
  for (const u of tableUsers || []) {
    if (u.role) roleMap.set(u.id, u.role);
  }

  let updated = 0;
  let skipped = 0;

  for (const user of authUsers) {
    const role = roleMap.get(user.id);
    if (!role) {
      console.log(`SKIP (no role in users table): ${user.email}`);
      skipped++;
      continue;
    }

    if (user.metadata.role === role) {
      console.log(`SKIP (already synced): ${user.email} role=${role}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.metadata, role },
    });

    if (error) {
      console.error(`ERROR: ${user.email} - ${error.message}`);
    } else {
      console.log(`UPDATED: ${user.email} → role=${role}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main();
