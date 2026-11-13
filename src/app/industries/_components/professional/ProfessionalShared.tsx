'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import styles from './ProfessionalWorkspace.module.css';

export async function authHeaders() {
  const { data } = await getSupabase().auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) h.Authorization = `Bearer ${data.session.access_token}`;
  return h;
}

export function naira(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

function pillColor(status: string) {
  const s = String(status || '').toLowerCase();
  if (['active', 'paid', 'done', 'completed', 'accepted', 'delivered'].includes(s))
    return { bg: '#ecfdf5', fg: '#059669' };
  if (['open', 'in_progress', 'sent', 'scheduled', 'logged', 'medium'].includes(s))
    return { bg: '#fff7ed', fg: '#d97706' };
  if (['overdue', 'cancelled', 'failed', 'high', 'blocked'].includes(s))
    return { bg: '#fef2f2', fg: '#dc2626' };
  return { bg: '#f1f5f9', fg: '#64748b' };
}

export function StatusPill({ status }: { status: string }) {
  const c = pillColor(status);
  return (
    <span className={styles.pill} style={{ background: c.bg, color: c.fg }}>
      {String(status || '—').replace(/_/g, ' ')}
    </span>
  );
}

export function Shell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Busmo Professional</p>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.sub}>{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export type Workspace = {
  metrics: Record<string, number>;
  clients: any[];
  tasks: any[];
  projects: any[];
  invoices: any[];
  timeEntries: any[];
  events: any[];
  deliverables: any[];
  expenses: any[];
  team?: any[];
  workload?: any[];
  payments?: any[];
  branding?: any;
};

export function useWorkspace() {
  const [data, setData] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const h = await authHeaders();
      const res = await fetch('/api/industries/professional/workspace', { headers: h });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load workspace');
      setData({
        metrics: json.metrics || {},
        clients: json.clients || [],
        tasks: json.tasks || [],
        projects: json.projects || [],
        invoices: json.invoices || [],
        timeEntries: json.timeEntries || [],
        events: json.events || [],
        deliverables: json.deliverables || [],
        expenses: json.expenses || [],
        team: json.team || [],
        workload: json.workload || [],
        payments: json.payments || [],
        branding: json.branding,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      const h = await authHeaders();
      const res = await fetch('/api/industries/professional/workspace', {
        method: 'POST',
        headers: h,
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Action failed');
      await load();
      return json;
    },
    [load]
  );

  return { data, error, loading, load, post };
}
