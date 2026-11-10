'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import type { IndustryConfig } from '@/lib/industries/types';
import { StaffDeskShell } from './StaffDeskShell';
import styles from './FrontDesk.module.css';

export function ProfessionalDesk({ config }: { config: IndustryConfig }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  const headers = useCallback(async () => {
    // TEMP: auth optional for QA
    const { data: s } = await getSupabase().auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (s.session?.access_token) headers.Authorization = `Bearer ${s.session.access_token}`;
    return headers;
  }, [config.loginPath, router]);

  const load = useCallback(async () => {
    try {
      const h = await headers();
      const res = await fetch('/api/industries/professional/desk', { headers: h });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const h = await headers();
      await fetch('/api/industries/professional/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'task', title: title.trim() }),
      });
      setTitle('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    try {
      const h = await headers();
      await fetch('/api/industries/professional/desk', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ action: 'update_task', id, status }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  const m = data?.metrics || {};
  const brand = data?.branding || {};

  return (
    <StaffDeskShell
      config={config}
      title="Staff workspace"
      subtitle="Tasks and clients for the team"
      brandName={brand.display_name || 'Firm workspace'}
      logoUrl={brand.logo_url}
      ownerHref={config.dashboardPath}
      nav={[
        { label: 'Workspace', href: '/industries/professional/front-desk', active: true },
        { label: 'Clients', href: `${config.dashboardPath}/clients` },
        { label: 'Tasks', href: `${config.dashboardPath}/tasks` },
      ]}
      metrics={[
        { label: 'Clients', value: m.clients ?? 0, hint: 'active accounts' },
        { label: 'Open tasks', value: m.openTasks ?? 0, hint: 'not started' },
        { label: 'In progress', value: m.inProgress ?? 0, hint: 'being worked' },
        { label: 'With due date', value: m.dueSoon ?? 0, hint: 'scheduled work' },
      ]}
      error={error}
      warning={null}
      actions={
        <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e8f0', minWidth: 180 }}
          />
          <button type="submit" disabled={busy} className={styles.primaryBtn} style={{ border: 'none', cursor: 'pointer' }}>
            Add task
          </button>
        </form>
      }
    >
      <div className={styles.grid2}>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>My open work</h2>
          </div>
          <ul className={styles.bookingList}>
            {(data?.tasks || []).length === 0 ? (
              <li className={styles.empty}>No open tasks.</li>
            ) : (
              (data?.tasks || []).map((t: any) => (
                <li key={t.id} className={styles.bookingRow}>
                  <div>
                    <div className={styles.guestName}>{t.title}</div>
                    <div className={styles.bookingMeta}>
                      {t.client_name || 'Internal'}
                      {t.due_date ? ` · due ${t.due_date}` : ''}
                    </div>
                  </div>
                  <div className={styles.bookingActions}>
                    <span className={styles.statusPill}>{t.status.replace('_', ' ')}</span>
                    {t.status !== 'done' ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(t.id, 'done')}>
                        Done
                      </button>
                    ) : null}
                    {t.status === 'open' ? (
                      <button type="button" disabled={busy} onClick={() => setStatus(t.id, 'in_progress')}>
                        Start
                      </button>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2>Clients</h2>
          </div>
          <ul className={styles.bookingList}>
            {(data?.clients || []).slice(0, 15).map((c: any) => (
              <li key={c.id} className={styles.bookingRow}>
                <div className={styles.guestName}>{c.name}</div>
              </li>
            ))}
            {(data?.clients || []).length === 0 ? (
              <li className={styles.empty}>No clients yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </StaffDeskShell>
  );
}
