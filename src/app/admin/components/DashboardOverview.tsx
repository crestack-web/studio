'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Insights = {
  generatedAt: string;
  source: string;
  metrics: {
    totalUsers: number;
    totalBusinesses: number;
    activeUsers: number;
    suspendedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newBusinessesThisMonth: number;
    activeBusinesses7Days: number;
    activeBusinesses30Days: number;
    paidSubscribers: number;
    trialUsers: number;
    lifetimeUsers: number;
    totalSales: number;
    totalProducts: number;
    totalExpenses: number;
    totalStaff: number;
    totalSuppliers: number;
    moConversations: number;
    moMessages: number;
    waConnections: number;
    churnRisk: number;
    retentionRate30: number;
    moCreditsGranted: number;
    moCreditsUsed: number;
  };
  planBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  growthSeries: Array<{ date: string; newUsers: number; newBusinesses: number }>;
  recentUsers: Array<{
    id: string;
    email: string | null;
    fullName: string | null;
    phone: string | null;
    plan: string;
    status: string;
    businessId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  recentBusinesses: Array<{
    id: string;
    name: string | null;
    category: string | null;
    location: string | null;
    status: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString();
}

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${accent || 'text-slate-900'}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function BarList({ data, maxItems = 6 }: { data: Record<string, number>; maxItems?: number }) {
  const entries = Object.entries(data || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (!entries.length) return <p className="text-sm text-slate-500">No data yet</p>;
  return (
    <ul className="space-y-2">
      {entries.map(([k, v]) => (
        <li key={k}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="font-medium capitalize text-slate-700">{k || 'unknown'}</span>
            <span className="tabular-nums text-slate-500">{fmt(v)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
              style={{ width: `${Math.max(4, (v / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function MiniSpark({ series }: { series: Insights['growthSeries'] }) {
  const max = Math.max(1, ...series.map((s) => s.newUsers + s.newBusinesses));
  return (
    <div className="flex h-16 items-end gap-0.5">
      {series.map((s) => {
        const h = ((s.newUsers + s.newBusinesses) / max) * 100;
        return (
          <div
            key={s.date}
            title={`${s.date}: ${s.newUsers} users, ${s.newBusinesses} businesses`}
            className="flex-1 rounded-t bg-violet-400/80 hover:bg-violet-600"
            style={{ height: `${Math.max(4, h)}%` }}
          />
        );
      })}
    </div>
  );
}

export default function DashboardOverview() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/insights', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
          <p className="text-sm text-slate-600">Loading live Busmo metrics from Supabase…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800">Could not load admin insights</p>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const m = data!.metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Company growth</h2>
          <p className="text-sm text-slate-500">
            Live Supabase data · generated {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
        <MetricCard label="Users" value={fmt(m.totalUsers)} sub={`+${fmt(m.newUsersToday)} today · +${fmt(m.newUsersThisWeek)} / 7d`} accent="text-violet-700" />
        <MetricCard label="Businesses" value={fmt(m.totalBusinesses)} sub={`+${fmt(m.newBusinessesThisMonth)} this month`} accent="text-indigo-700" />
        <MetricCard label="Active (users)" value={fmt(m.activeUsers)} sub={`${fmt(m.suspendedUsers)} suspended`} />
        <MetricCard label="30d retention" value={`${m.retentionRate30}%`} sub={`${fmt(m.churnRisk)} churn-risk signals`} accent="text-emerald-700" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Paid / plan signals" value={fmt(m.paidSubscribers)} sub={`${fmt(m.trialUsers)} trial · ${fmt(m.lifetimeUsers)} lifetime`} />
        <MetricCard label="Biz active 7d" value={fmt(m.activeBusinesses7Days)} sub={`${fmt(m.activeBusinesses30Days)} in 30 days`} />
        <MetricCard label="Sales recorded" value={fmt(m.totalSales)} sub={`${fmt(m.totalProducts)} products`} />
        <MetricCard label="MO Sales" value={fmt(m.moConversations)} sub={`${fmt(m.moMessages)} msgs · ${fmt(m.waConnections)} WA links`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Signups · last 30 days</h3>
            <span className="text-xs text-slate-500">Users + businesses</span>
          </div>
          <MiniSpark series={data!.growthSeries || []} />
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>{data!.growthSeries?.[0]?.date}</span>
            <span>{data!.growthSeries?.[data!.growthSeries.length - 1]?.date}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Plans</h3>
          <BarList data={data!.planBreakdown} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">User status</h3>
          <BarList data={data!.statusBreakdown} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Business categories</h3>
          <BarList data={data!.categoryBreakdown} />
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Operations volume</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex justify-between"><span>Expenses</span><span className="font-semibold tabular-nums">{fmt(m.totalExpenses)}</span></li>
            <li className="flex justify-between"><span>Staff</span><span className="font-semibold tabular-nums">{fmt(m.totalStaff)}</span></li>
            <li className="flex justify-between"><span>Suppliers</span><span className="font-semibold tabular-nums">{fmt(m.totalSuppliers)}</span></li>
            <li className="flex justify-between"><span>MO credits granted</span><span className="font-semibold tabular-nums">{fmt(m.moCreditsGranted)}</span></li>
            <li className="flex justify-between"><span>MO credits used</span><span className="font-semibold tabular-nums">{fmt(m.moCreditsUsed)}</span></li>
          </ul>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Recent users</h3>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-2">Identity</th>
                  <th className="py-2 pr-2">Plan</th>
                  <th className="py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(data!.recentUsers || []).map((u) => (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-slate-900">{u.fullName || '—'}</div>
                      <div className="text-xs text-slate-500">{u.email || u.phone || u.id.slice(0, 8)}</div>
                    </td>
                    <td className="py-2 pr-2 capitalize">{u.plan}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-900">Recent businesses</h3>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-2">Business</th>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {(data!.recentBusinesses || []).map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="py-2 pr-2">
                      <div className="font-medium text-slate-900">{b.name || b.id}</div>
                      <div className="text-xs text-slate-500">{b.location || '—'}</div>
                    </td>
                    <td className="py-2 pr-2 capitalize">{b.category || '—'}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
