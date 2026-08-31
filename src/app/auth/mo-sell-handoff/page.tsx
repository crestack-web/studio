'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

/**
 * Bridge page: user must be logged into Busmo, then we issue a handoff token
 * and send them to Mo-sell to complete signup/login with the same email.
 */
export default function MoSellHandoffPage() {
  const [status, setStatus] = useState('Connecting to Mo-sell…');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          const returnTo = encodeURIComponent('/auth/mo-sell-handoff');
          window.location.href = `/login/form?returnTo=${returnTo}`;
          return;
        }
        const res = await fetch('/api/integrations/mo-sell/handoff', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json.redirectUrl) {
          setStatus(json.error || 'Could not start Mo-sell connection. Try again from settings.');
          return;
        }
        window.location.href = json.redirectUrl as string;
      } catch (e) {
        console.error(e);
        if (!cancelled) setStatus('Something went wrong. Please try again.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        <p className="text-sm font-medium text-slate-700">{status}</p>
      </div>
    </div>
  );
}
