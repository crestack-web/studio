'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Risk = {
  id: string;
  email: string | null;
  fullName: string | null;
  plan: string;
  status: string;
  businessId: string | null;
  createdAt: string | null;
  lastSeenAt: string | null;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  daysInactive: number | null;
};

const badge: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-700',
};

export default function ChurnDetection() {
  const [summary, setSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0, totalFlagged: 0 });
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/churn', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setSummary(json.summary);
      setRisks(json.risks || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load churn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter === 'all' ? risks : risks.filter((r) => r.riskLevel === filter);

  return (
    <div className="min-w-0 space-y overflow-x-hidden-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Churn & inactivity</h2>
          <p className="text-sm text-slate-500">Supabase identity signals · inactivity, suspension, missing business</p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">
          Refresh
        </button>
      </div>

      {loading && !risks.length ? (
        <p className="text-sm text-slate-500">Scanning users…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {(['critical', 'high', 'medium', 'low'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`rounded-2xl border p-4 text-left ${filter === k ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200 bg-white'}`}
              >
                <div className="text-xs font-semibold uppercase text-slate-500">{k}</div>
                <div className="text-2xl font-bold tabular-nums">{summary[k]}</div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-2xl border p-4 text-left ${filter === 'all' ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200 bg-white'}`}
            >
              <div className="text-xs font-semibold uppercase text-slate-500">Flagged</div>
              <div className="text-2xl font-bold tabular-nums">{summary.totalFlagged}</div>
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Inactive</th>
                  <th className="px-4 py-3">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.fullName || '—'}</div>
                      <div className="text-xs text-slate-500">{r.email || r.id.slice(0, 8)}</div>
                      <div className="text-xs capitalize text-slate-400">{r.plan} · {r.status}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge[r.riskLevel]}`}>
                        {r.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.daysInactive != null ? `${r.daysInactive}d` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.reasons.join(' · ')}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      No users match this risk filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
