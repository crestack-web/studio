/**
 * One-time migration: auto-confirm all existing Supabase users
 * whose emails are not confirmed.
 *
 * Run: npx tsx scripts/confirm-existing-users.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  let page = 1;
  const perPage = 100;
  let totalConfirmed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('Error listing users:', error.message);
      process.exit(1);
    }

    const users = data.users;
    if (!users.length) break;

    for (const user of users) {
      if (user.email_confirmed_at) {
        totalSkipped++;
        continue;
      }

      console.log(`Confirming: ${user.email} (${user.id})`);
      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (updateError) {
        console.error(`  ERROR: ${updateError.message}`);
        totalErrors++;
      } else {
        totalConfirmed++;
      }
    }

    if (users.length < perPage) break;
    page++;
  }

  console.log(`\nDone. Confirmed: ${totalConfirmed}, Already confirmed: ${totalSkipped}, Errors: ${totalErrors}`);
}

main();
