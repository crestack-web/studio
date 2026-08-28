'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type RevenuePayload = {
  generatedAt: string;
  plans: Array<{
    id: string;
    name: string;
    tagline: string;
    monthlyPrice: number;
    yearlyPrice: number;
    monthlyPriceLabel: string;
    yearlyPriceLabel: string;
    popular?: boolean;
    paymentsCount: number;
    revenue: number;
  }>;
  metrics: {
    totalRevenue: number;
    revenueThisMonth: number;
    revenue30d: number;
    successfulPayments: number;
    byBilling: Record<string, number>;
  };
  recentPayments: Array<{
    id: string;
    reference: string | null;
    amount: number;
    currency: string;
    planName: string;
    billing: string;
    email: string | null;
    createdAt: string;
  }>;
};

function naira(n: number) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`;
}

export default function AdminRevenue() {
  const [data, setData] = useState<RevenuePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/revenue', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load revenue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return <p className="text-sm text-slate-500">Loading subscription revenue…</p>;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Revenue</h2>
          <p className="text-sm text-slate-500">
            Successful Paystack subscription payments · plans from pricing page (Start / Control / Scale)
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Total revenue</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{naira(m.totalRevenue)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">This month</div>
          <div className="mt-1 text-2xl font-bold">{naira(m.revenueThisMonth)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Last 30 days</div>
          <div className="mt-1 text-2xl font-bold">{naira(m.revenue30d)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Successful payments</div>
          <div className="mt-1 text-2xl font-bold">{m.successfulPayments.toLocaleString()}</div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-slate-900">Pricing plans</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {data!.plans.map((pl) => (
            <div
              key={pl.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm ${pl.popular ? 'border-violet-300 ring-1 ring-violet-200' : 'border-slate-200'}`}
            >
              {pl.popular && (
                <span className="mb-2 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-800">
                  Popular
                </span>
              )}
              <div className="text-lg font-bold text-slate-900">{pl.name}</div>
              <p className="mt-1 text-xs text-slate-500">{pl.tagline}</p>
              <div className="mt-3 text-2xl font-bold text-slate-900">
                {pl.monthlyPriceLabel}
                <span className="text-sm font-medium text-slate-500">/mo</span>
              </div>
              <div className="text-xs text-slate-500">{pl.yearlyPriceLabel}/yr</div>
              <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-600">Payments</span>
                <span className="font-semibold tabular-nums">{pl.paymentsCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Revenue</span>
                <span className="font-semibold tabular-nums text-emerald-700">{naira(pl.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Monthly billing revenue</div>
          <div className="mt-1 text-xl font-bold">{naira(m.byBilling?.monthly || 0)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-slate-500">Yearly billing revenue</div>
          <div className="mt-1 text-xl font-bold">{naira(m.byBilling?.yearly || 0)}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 font-semibold">Recent successful payments</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Plan</th>
                <th className="px-4 py-2">Billing</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              {data!.recentPayments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-2 font-medium">{p.planName}</td>
                  <td className="px-4 py-2 capitalize">{p.billing}</td>
                  <td className="px-4 py-2 font-semibold tabular-nums text-emerald-700">{naira(p.amount)}</td>
                  <td className="px-4 py-2 text-xs text-slate-600">{p.email || '—'}</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-slate-500">{p.reference || '—'}</td>
                </tr>
              ))}
              {!data!.recentPayments.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No successful subscription payments recorded yet. Payments verify via Paystack and land here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
