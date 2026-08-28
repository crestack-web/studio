'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Insights = {
  generatedAt?: string;
  metrics: {
    totalSales: number;
    totalProducts: number;
    totalExpenses: number;
    totalStaff: number;
    totalSuppliers: number;
    moConversations: number;
    moMessages: number;
    waConnections: number;
    activeBusinesses7Days: number;
    activeBusinesses30Days: number;
    totalBusinesses: number;
    totalUsers: number;
    moCreditsGranted: number;
    moCreditsUsed: number;
  };
  recentBusinesses?: Array<{
    id: string;
    name: string | null;
    category: string | null;
    location: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

function Card({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

export default function AdminOperations() {
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
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading operations…</p>;
  }
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
  const fmt = (n: number) => Number(n || 0).toLocaleString();

  return (
    <div className="min-w-0 space-y overflow-x-hidden-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Operations</h2>
          <p className="text-sm text-slate-500">
            Product usage volume across Busmo · {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : ''}
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <Card label="Sales recorded" value={fmt(m.totalSales)} />
        <Card label="Products" value={fmt(m.totalProducts)} />
        <Card label="Expenses" value={fmt(m.totalExpenses)} />
        <Card label="Staff records" value={fmt(m.totalStaff)} />
        <Card label="Suppliers" value={fmt(m.totalSuppliers)} />
        <Card label="Biz active 7d" value={fmt(m.activeBusinesses7Days)} sub={`${fmt(m.activeBusinesses30Days)} in 30 days`} />
        <Card label="WA connections" value={fmt(m.waConnections)} />
        <Card label="MO conversations" value={fmt(m.moConversations)} sub={`${fmt(m.moMessages)} messages`} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card label="MO credits granted" value={fmt(m.moCreditsGranted)} sub={`${fmt(m.moCreditsUsed)} used`} />
        <Card label="Platform scale" value={`${fmt(m.totalUsers)} users`} sub={`${fmt(m.totalBusinesses)} businesses`} />
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <h3 className="mb-3 font-semibold text-slate-900">Recently updated businesses</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Category</th>
                <th className="py-2">Last signal</th>
              </tr>
            </thead>
            <tbody>
              {(data!.recentBusinesses || []).map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="py-2 pr-2 font-medium">{b.name || b.id}</td>
                  <td className="py-2 pr-2 capitalize text-slate-600">{b.category || '—'}</td>
                  <td className="py-2 text-xs text-slate-500">
                    {b.updatedAt ? new Date(b.updatedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
