'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { getSupabase } from '@/lib/supabase';
import { ExternalLink, Link2, RefreshCw, Store } from 'lucide-react';

type Payload = {
  linked: boolean;
  configured?: boolean;
  connectUrl?: string;
  message?: string;
  busmoBusinessId?: string;
  moSellBusinessId?: string | null;
  moSellStoreUrl?: string | null;
  linkedAt?: string | null;
  store?: {
    name: string;
    slug: string | null;
    mode: string | null;
    billingModel: string | null;
    commissionRate: number;
    publicStoreUrl: string | null;
    publicBioUrl: string | null;
  } | null;
  metrics?: {
    orders30d: number;
    gmv30d: number;
    commission30d: number;
    net30d: number;
    productCount: number;
    orderCountAll: number;
  } | null;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    commissionAmount: number;
    netAmount: number;
    status: string;
    createdAt: string;
  }>;
  earnings: Array<{
    id: string;
    orderNumber: string;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    status: string;
    currency: string;
    createdAt: string;
  }>;
};

const money = (n: number) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const date = (iso?: string | null) => {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

export default function MoSellPage() {
  const { user, showToast } = useApp();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'orders' | 'earnings'>('orders');

  const load = useCallback(async () => {
    if (!user.businessId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch(
        `/api/owner/mo-sell/activity?businessId=${encodeURIComponent(user.businessId)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json as Payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to load Mo-sell activity');
    } finally {
      setLoading(false);
    }
  }, [user.businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const connect = () => {
    const url =
      data?.connectUrl ||
      (user.businessId
        ? `https://mo-sell.store/dashboard/settings?connectFromBusmo=1&busmoBusinessId=${encodeURIComponent(user.businessId)}`
        : null);
    if (!url) {
      showToast('Business not loaded yet');
      return;
    }
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = url;
    showToast('Finish connecting in Mo-sell (same email works best)');
  };

  const m = data?.metrics;

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden p-1 sm:p-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mo-sell</h1>
          <p className="text-sm text-slate-500">Track your online store activity from Busmo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          {data?.linked && data?.moSellStoreUrl ? (
            <a
              href={data.moSellStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Open Mo-sell <ExternalLink size={14} />
            </a>
          ) : (
            <button
              type="button"
              onClick={connect}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <Link2 size={14} /> Connect Mo-sell
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        </div>
      ) : !data?.linked ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <Store size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Connect your online store</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Link Mo-sell to this Busmo business to import physical products, sell online, and track
            orders and earnings here. Use the same email on both apps for a smooth connect.
          </p>
          <button
            type="button"
            onClick={connect}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Link2 size={16} /> Connect Mo-sell
          </button>
        </div>
      ) : (
        <>
          {data.message && !data.configured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {data.message}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked store</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {data.store?.name || data.moSellBusinessId}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {data.store?.mode ? `Mode: ${data.store.mode}` : ''}
                  {data.store?.billingModel ? ` \u00b7 ${data.store.billingModel}` : ''}
                  {data.linkedAt ? ` \u00b7 Linked ${date(data.linkedAt)}` : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {data.store?.publicBioUrl && (
                  <a
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-violet-700 hover:bg-slate-50"
                    href={data.store.publicBioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Link in bio
                  </a>
                )}
                {data.store?.publicStoreUrl && (
                  <a
                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-violet-700 hover:bg-slate-50"
                    href={data.store.publicStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Storefront
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'GMV 30d', value: money(m?.gmv30d || 0) },
              { label: 'Orders 30d', value: String(m?.orders30d || 0) },
              { label: 'Your net 30d', value: money(m?.net30d || 0) },
              { label: 'Fees 30d', value: money(m?.commission30d || 0) },
              { label: 'Products', value: String(m?.productCount || 0) },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{c.label}</div>
                <div className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(['orders', 'earnings'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                  tab === id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {id === 'orders' ? 'Orders' : 'Earnings'}
              </button>
            ))}
          </div>

          {tab === 'orders' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Order</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Gross</th>
                      <th className="px-4 py-2">Fee</th>
                      <th className="px-4 py-2">Net</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.recentOrders || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">No online orders yet</td>
                      </tr>
                    ) : (
                      data.recentOrders.map((o) => (
                        <tr key={o.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-mono text-xs">{o.orderNumber || o.id}</td>
                          <td className="px-4 py-2">
                            <div className="font-medium">{o.customerName || '\u2014'}</div>
                            <div className="text-xs text-slate-500">{o.customerEmail}</div>
                          </td>
                          <td className="px-4 py-2 tabular-nums font-semibold">{money(o.total)}</td>
                          <td className="px-4 py-2 tabular-nums text-violet-700">{money(o.commissionAmount)}</td>
                          <td className="px-4 py-2 tabular-nums">{money(o.netAmount)}</td>
                          <td className="px-4 py-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{o.status || '\u2014'}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(o.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'earnings' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Order</th>
                      <th className="px-4 py-2">Gross</th>
                      <th className="px-4 py-2">Fee</th>
                      <th className="px-4 py-2">Net</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.earnings || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No earnings yet</td>
                      </tr>
                    ) : (
                      data.earnings.map((e) => (
                        <tr key={e.id} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-mono text-xs">{e.orderNumber || '\u2014'}</td>
                          <td className="px-4 py-2 tabular-nums">{money(e.grossAmount)}</td>
                          <td className="px-4 py-2 tabular-nums text-violet-700">{money(e.commissionAmount)}</td>
                          <td className="px-4 py-2 tabular-nums font-semibold">{money(e.netAmount)} {e.currency}</td>
                          <td className="px-4 py-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{e.status}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(e.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
