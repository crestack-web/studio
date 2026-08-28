'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Insights = {
  generatedAt?: string;
  metrics: {
    paidSubscribers: number;
    trialUsers: number;
    lifetimeUsers: number;
    totalSales: number;
    totalUsers: number;
    newUsersThisWeek: number;
    newBusinessesThisMonth: number;
    retentionRate30: number;
    churnRisk: number;
  };
  planBreakdown: Record<string, number>;
  growthSeries: Array<{ date: string; newUsers: number; newBusinesses: number }>;
};

export default function AdminRevenue() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/insights', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <p className="text-sm text-slate-500">Loading revenue signals…</p>;
  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}{' '}
        <button type="button" className="font-semibold underline" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const m = data!.metrics;
  const plans = Object.entries(data!.planBreakdown || {}).sort((a, b) => b[1] - a[1]);
  const maxPlan = Math.max(1, ...plans.map(([, v]) => v));
  const weekUsers = (data!.growthSeries || []).slice(-7).reduce((s, d) => s + d.newUsers, 0);
  const weekBiz = (data!.growthSeries || []).slice(-7).reduce((s, d) => s + d.newBusinesses, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Revenue & monetization</h2>
          <p className="text-sm text-slate-500">
            Plan mix and growth signals from Supabase (not payment processor ledger)
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Paid signals</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{m.paidSubscribers.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Trial</div>
          <div className="mt-1 text-2xl font-bold text-violet-700">{m.trialUsers.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Lifetime</div>
          <div className="mt-1 text-2xl font-bold">{m.lifetimeUsers.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Sales volume (rows)</div>
          <div className="mt-1 text-2xl font-bold">{m.totalSales.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Plan breakdown</h3>
          <ul className="space-y-2">
            {plans.map(([k, v]) => (
              <li key={k}>
                <div className="mb-0.5 flex justify-between text-xs">
                  <span className="font-medium capitalize">{k || 'unknown'}</span>
                  <span className="tabular-nums text-slate-500">{v.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${Math.max(4, (v / maxPlan) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
            {!plans.length && <p className="text-sm text-slate-500">No plan data</p>}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Health of growth</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">New users (7d series)</span>
              <span className="font-semibold tabular-nums">{weekUsers.toLocaleString()}</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">New businesses (7d series)</span>
              <span className="font-semibold tabular-nums">{weekBiz.toLocaleString()}</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">New businesses this month</span>
              <span className="font-semibold tabular-nums">{m.newBusinessesThisMonth.toLocaleString()}</span>
            </li>
            <li className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">30d retention</span>
              <span className="font-semibold tabular-nums">{m.retentionRate30}%</span>
            </li>
            <li className="flex justify-between">
              <span className="text-slate-600">Churn-risk signals</span>
              <span className="font-semibold tabular-nums text-amber-700">{m.churnRisk.toLocaleString()}</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Naira revenue from Paystack is not aggregated here yet — this view tracks subscription plan mix and product
            sales activity in Supabase.
          </p>
        </div>
      </div>
    </div>
  );
}
