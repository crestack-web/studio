'use client';

/** After password login, route using authoritative org session. */
export async function redirectAfterLogin(accessToken?: string | null) {
  try {
    if (accessToken) {
      const r = await fetch('/api/industries/session', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (r.ok) {
        const j = await r.json();
        const path = j.dashboardPath || '/owner';
        window.location.href = path === '/owner/dashboard' ? '/owner' : path;
        return;
      }
    }
  } catch {
    /* fall through */
  }
  window.location.href = '/owner';
}
