'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Metrics = {
  totalStores: number;
  totalOrders: number;
  orders7d: number;
  orders30d: number;
  gmv30d: number;
  totalProducts: number;
  totalUsers: number;
  linkedToBusmo: number;
};

type StoreRow = {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  plan: string | null;
  status: string | null;
  busmoBusinessId: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  businessId: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  reference: string;
  createdAt: string;
};

type LinkRow = {
  busmoBusinessId: string;
  busmoName: string;
  moSellBusinessId: string;
  moSellStoreUrl: string | null;
  linkedAt: string | null;
  email: string | null;
  category: string | null;
};

type TopStore = { businessId: string; name: string; orders30d: number; gmv30d: number };

type UserRow = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

type Payload = {
  configured: boolean;
  message?: string;
  generatedAt: string;
  metrics: Metrics;
  links: LinkRow[];
  stores: StoreRow[];
  recentOrders: OrderRow[];
  topStores: TopStore[];
  recentUsers: UserRow[];
};

function fmt(n: number) {
  return Number(n || 0).toLocaleString();
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
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
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </div>
      <div
        className={`mt-1 break-all text-xl font-bold tabular-nums leading-tight sm:text-2xl ${accent || 'text-slate-900'}`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500 sm:text-xs">{sub}</div>
      ) : null}
    </div>
  );
}

type Section = 'overview' | 'orders' | 'stores' | 'users' | 'links';

export default function MoSellActivity() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [section, setSection] = useState<Section>('overview');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/mo-sell/activity', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setData(json as Payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to load Mo-sell activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredOrders = useMemo(() => {
    const rows = data?.recentOrders || [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (o) =>
        o.orderNumber?.toLowerCase().includes(s) ||
        o.storeName?.toLowerCase().includes(s) ||
        o.customerEmail?.toLowerCase().includes(s) ||
        o.customerName?.toLowerCase().includes(s) ||
        o.reference?.toLowerCase().includes(s)
    );
  }, [data?.recentOrders, q]);

  const filteredStores = useMemo(() => {
    const rows = data?.stores || [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.name?.toLowerCase().includes(s) ||
        r.email?.toLowerCase().includes(s) ||
        r.slug?.toLowerCase().includes(s) ||
        r.id?.toLowerCase().includes(s)
    );
  }, [data?.stores, q]);

  const filteredUsers = useMemo(() => {
    const rows = data?.recentUsers || [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((u) => u.email?.toLowerCase().includes(s) || u.id.includes(s));
  }, [data?.recentUsers, q]);

  const filteredLinks = useMemo(() => {
    const rows = data?.links || [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (l) =>
        l.busmoName?.toLowerCase().includes(s) ||
        l.email?.toLowerCase().includes(s) ||
        l.moSellBusinessId?.toLowerCase().includes(s) ||
        l.busmoBusinessId?.toLowerCase().includes(s)
    );
  }, [data?.links, q]);

  const m = data?.metrics;

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mo-sell activity</h2>
          <p className="text-sm text-slate-500">
            Parent company view \u00b7 online store users, orders, and Busmo links
            {data?.generatedAt ? ` \u00b7 updated ${fmtDate(data.generatedAt)}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {data && !data.configured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Live Mo-sell data not connected.</strong>{' '}
          {data.message ||
            'Add MO_SELL_SUPABASE_URL and MO_SELL_SUPABASE_SERVICE_ROLE_KEY to the Busmo environment.'}{' '}
          Busmo\u2194Mo-sell links below still load from Busmo.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {loading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            <MetricCard label="Stores" value={fmt(m?.totalStores || 0)} />
            <MetricCard label="Users" value={fmt(m?.totalUsers || 0)} sub="Auth accounts (sample)" />
            <MetricCard label="Products" value={fmt(m?.totalProducts || 0)} />
            <MetricCard label="All orders" value={fmt(m?.totalOrders || 0)} />
            <MetricCard label="Orders 7d" value={fmt(m?.orders7d || 0)} accent="text-violet-700" />
            <MetricCard label="Orders 30d" value={fmt(m?.orders30d || 0)} accent="text-violet-700" />
            <MetricCard label="GMV 30d" value={fmtMoney(m?.gmv30d || 0)} sub="Order totals" accent="text-emerald-700" />
            <MetricCard label="Linked Busmo" value={fmt(m?.linkedToBusmo || 0)} sub="Cross-product links" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['overview', 'Overview'],
                ['orders', 'Orders'],
                ['stores', 'Stores'],
                ['users', 'Users'],
                ['links', 'Busmo links'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${
                  section === id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search\u2026"
              className="ml-auto min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm sm:max-w-xs"
            />
          </div>

          {section === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                  Top stores (30 days)
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Store</th>
                        <th className="px-4 py-2">Orders</th>
                        <th className="px-4 py-2">GMV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.topStores || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                            No recent store orders
                          </td>
                        </tr>
                      ) : (
                        (data?.topStores || []).map((t) => (
                          <tr key={t.businessId} className="border-t border-slate-100">
                            <td className="px-4 py-2 font-medium text-slate-900">{t.name}</td>
                            <td className="px-4 py-2 tabular-nums">{fmt(t.orders30d)}</td>
                            <td className="px-4 py-2 tabular-nums">{fmtMoney(t.gmv30d)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-800">
                  Latest orders
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">Order</th>
                        <th className="px-4 py-2">Store</th>
                        <th className="px-4 py-2">Total</th>
                        <th className="px-4 py-2">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentOrders || []).slice(0, 12).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                            No orders yet
                          </td>
                        </tr>
                      ) : (
                        (data?.recentOrders || []).slice(0, 12).map((o) => (
                          <tr key={o.id} className="border-t border-slate-100">
                            <td className="px-4 py-2 font-mono text-xs">{o.orderNumber || o.id.slice(0, 10)}</td>
                            <td className="px-4 py-2">{o.storeName}</td>
                            <td className="px-4 py-2 tabular-nums">{fmtMoney(o.total)}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(o.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {section === 'orders' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Order</th>
                      <th className="px-4 py-2">Store</th>
                      <th className="px-4 py-2">Customer</th>
                      <th className="px-4 py-2">Total</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                          No matching orders
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-mono text-xs">{o.orderNumber || o.id}</td>
                          <td className="px-4 py-2">{o.storeName}</td>
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-900">{o.customerName || '\u2014'}</div>
                            <div className="text-xs text-slate-500">{o.customerEmail}</div>
                          </td>
                          <td className="px-4 py-2 tabular-nums font-semibold">{fmtMoney(o.total)}</td>
                          <td className="px-4 py-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                              {o.paymentStatus || o.status || '\u2014'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(o.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'stores' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Store</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Plan</th>
                      <th className="px-4 py-2">Busmo link</th>
                      <th className="px-4 py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No stores
                        </td>
                      </tr>
                    ) : (
                      filteredStores.map((s) => (
                        <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-900">{s.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">{s.slug || s.id}</div>
                          </td>
                          <td className="px-4 py-2 text-slate-700">{s.email || '\u2014'}</td>
                          <td className="px-4 py-2">{s.plan || '\u2014'}</td>
                          <td className="px-4 py-2">
                            {s.busmoBusinessId ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                Linked
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">\u2014</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(s.updatedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'users' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">User id</th>
                      <th className="px-4 py-2">Created</th>
                      <th className="px-4 py-2">Last sign-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          {data?.configured
                            ? 'No users in sample'
                            : 'Connect Mo-sell Supabase to list auth users'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-medium text-slate-900">{u.email || '\u2014'}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{u.id}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(u.createdAt)}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(u.lastSignInAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'links' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                Busmo businesses connected to a Mo-sell store (read from Busmo)
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Busmo business</th>
                      <th className="px-4 py-2">Mo-sell id</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Linked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLinks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          No Busmo\u2194Mo-sell links yet
                        </td>
                      </tr>
                    ) : (
                      filteredLinks.map((l) => (
                        <tr key={`${l.busmoBusinessId}-${l.moSellBusinessId}`} className="border-t border-slate-100">
                          <td className="px-4 py-2">
                            <div className="font-medium text-slate-900">{l.busmoName}</div>
                            <div className="font-mono text-[11px] text-slate-400">{l.busmoBusinessId}</div>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{l.moSellBusinessId}</td>
                          <td className="px-4 py-2">{l.email || '\u2014'}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{fmtDate(l.linkedAt)}</td>
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
