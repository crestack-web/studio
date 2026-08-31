'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Metrics = {
  totalStores: number; totalOrders: number; orders7d: number; orders30d: number;
  gmv30d: number; gmvAll: number; totalProducts: number; totalUsers: number; linkedToBusmo: number;
  commission30d: number; commissionAll: number; netToMerchants30d: number;
  availableEarnings: number; pendingPayouts: number; paidOut: number;
  linkBioStores: number; storefrontStores: number; bothModeStores: number;
  paygStores: number; monthlyStores: number; newStores7d: number; newStores30d: number;
};

type Payload = {
  configured: boolean; message?: string; generatedAt: string; metrics: Metrics;
  links: any[]; stores: any[]; recentOrders: any[]; topStores: any[]; recentUsers: any[];
  earnings: any[]; payouts: any[]; bioPages: any[];
  billingBreakdown: Record<string, number>; modeBreakdown: Record<string, number>;
  monthlyRollup: Array<{ month: string; revenue: number; commission: number; orders: number }>;
  productTypeBreakdown: Record<string, number>;
};

type Section = 'overview' | 'orders' | 'earnings' | 'payouts' | 'bio' | 'stores' | 'users' | 'links';

const fmt = (n: number) => Number(n || 0).toLocaleString();
const money = (n: number) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const date = (iso?: string | null) => {
  if (!iso) return '\u2014';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};
const pct = (r: number) => (!r ? '\u2014' : `${(r * 100).toFixed(r >= 0.1 ? 0 : 1)}%`);

function Card({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</div>
      <div className={`mt-1 break-all text-xl font-bold tabular-nums leading-tight sm:text-2xl ${accent || 'text-slate-900'}`}>{value}</div>
      {sub ? <div className="mt-1 line-clamp-2 text-[11px] text-slate-500 sm:text-xs">{sub}</div> : null}
    </div>
  );
}

function Bars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(...entries.map((e) => e[1]), 1);
  if (!entries.length) return <p className="px-4 py-6 text-center text-sm text-slate-400">No data</p>;
  return (
    <ul className="space-y-2 p-4">
      {entries.map(([k, v]) => (
        <li key={k}>
          <div className="mb-0.5 flex justify-between text-xs">
            <span className="font-medium text-slate-700">{k || 'unknown'}</span>
            <span className="tabular-nums text-slate-500">{fmt(v)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${(v / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'overview', label: 'Growth' },
  { id: 'orders', label: 'Orders' },
  { id: 'earnings', label: 'Earnings & fees' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'bio', label: 'Link in bio' },
  { id: 'stores', label: 'Stores' },
  { id: 'users', label: 'Users' },
  { id: 'links', label: 'Busmo links' },
];

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

  useEffect(() => { load(); }, [load]);

  const s = q.trim().toLowerCase();
  const match = (vals: Array<string | null | undefined>) => !s || vals.some((v) => v?.toLowerCase().includes(s));

  const orders = useMemo(() => (data?.recentOrders || []).filter((o) => match([o.orderNumber, o.storeName, o.customerEmail, o.customerName])), [data, s]);
  const earnings = useMemo(() => (data?.earnings || []).filter((e) => match([e.storeName, e.orderNumber, e.customerName])), [data, s]);
  const payouts = useMemo(() => (data?.payouts || []).filter((p) => match([p.storeName, p.accountName, p.status])), [data, s]);
  const bios = useMemo(() => (data?.bioPages || []).filter((b) => match([b.name, b.slug, b.email, b.bioName])), [data, s]);
  const stores = useMemo(() => (data?.stores || []).filter((r) => match([r.name, r.email, r.slug, r.mode])), [data, s]);
  const users = useMemo(() => (data?.recentUsers || []).filter((u) => match([u.email, u.id])), [data, s]);
  const links = useMemo(() => (data?.links || []).filter((l) => match([l.busmoName, l.email, l.moSellBusinessId])), [data, s]);

  const m = data?.metrics;
  const th = 'bg-slate-50 text-xs uppercase text-slate-500';
  const box = 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm';

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mo-sell intelligence</h2>
          <p className="text-sm text-slate-500">
            Parent view \u00b7 GMV, commission, earnings, link-in-bio & growth
            {data?.generatedAt ? ` \u00b7 ${date(data.generatedAt)}` : ''}
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50">
          Refresh
        </button>
      </div>

      {data && !data.configured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Live Mo-sell data not connected.</strong> {data.message} Busmo links still load.
        </div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      {loading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Platform economics</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Card label="GMV 30d" value={money(m?.gmv30d || 0)} accent="text-emerald-700" />
              <Card label="Our commission 30d" value={money(m?.commission30d || 0)} sub="Platform fee" accent="text-violet-700" />
              <Card label="Commission tracked" value={money(m?.commissionAll || 0)} sub="Earnings ledger" />
              <Card label="Merchant net 30d" value={money(m?.netToMerchants30d || 0)} />
              <Card label="Available earnings" value={money(m?.availableEarnings || 0)} sub="Not paid out" />
              <Card label="Payouts pending" value={money(m?.pendingPayouts || 0)} sub={`Paid: ${money(m?.paidOut || 0)}`} accent="text-amber-700" />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Footprint & growth</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <Card label="Stores" value={fmt(m?.totalStores || 0)} />
              <Card label="Users" value={fmt(m?.totalUsers || 0)} />
              <Card label="Products" value={fmt(m?.totalProducts || 0)} />
              <Card label="Orders" value={fmt(m?.totalOrders || 0)} />
              <Card label="Orders 7d" value={fmt(m?.orders7d || 0)} accent="text-violet-700" />
              <Card label="New stores 7d" value={fmt(m?.newStores7d || 0)} />
              <Card label="New stores 30d" value={fmt(m?.newStores30d || 0)} />
              <Card label="Linked Busmo" value={fmt(m?.linkedToBusmo || 0)} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Product mix</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Card label="Link-in-bio" value={fmt(m?.linkBioStores || 0)} />
              <Card label="Storefront" value={fmt(m?.storefrontStores || 0)} />
              <Card label="Both" value={fmt(m?.bothModeStores || 0)} />
              <Card label="Pay-as-you-go" value={fmt(m?.paygStores || 0)} />
              <Card label="Monthly plans" value={fmt(m?.monthlyStores || 0)} />
              <Card label="Orders 30d" value={fmt(m?.orders30d || 0)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SECTIONS.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setSection(id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${section === id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search\u2026"
              className="ml-auto min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm sm:max-w-xs" />
          </div>

          {section === 'overview' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className={box}>
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Top stores by GMV (30d)</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className={th}><tr><th className="px-4 py-2">Store</th><th className="px-4 py-2">Orders</th><th className="px-4 py-2">GMV</th><th className="px-4 py-2">Our fee</th></tr></thead>
                    <tbody>
                      {(data?.topStores || []).length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No recent orders</td></tr>
                      ) : (data?.topStores || []).map((t) => (
                        <tr key={t.businessId} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-medium">{t.name}</td>
                          <td className="px-4 py-2 tabular-nums">{fmt(t.orders30d)}</td>
                          <td className="px-4 py-2 tabular-nums">{money(t.gmv30d)}</td>
                          <td className="px-4 py-2 tabular-nums text-violet-700">{money(t.commission30d)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={box}>
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Monthly revenue rollup</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className={th}><tr><th className="px-4 py-2">Month</th><th className="px-4 py-2">GMV</th><th className="px-4 py-2">Commission</th><th className="px-4 py-2">Orders</th></tr></thead>
                    <tbody>
                      {(data?.monthlyRollup || []).length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No rollup yet</td></tr>
                      ) : (data?.monthlyRollup || []).map((r) => (
                        <tr key={r.month} className="border-t border-slate-100">
                          <td className="px-4 py-2 font-medium">{r.month}</td>
                          <td className="px-4 py-2 tabular-nums">{money(r.revenue)}</td>
                          <td className="px-4 py-2 tabular-nums text-violet-700">{money(r.commission)}</td>
                          <td className="px-4 py-2 tabular-nums">{fmt(r.orders)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className={box}><div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Mode mix</div><Bars data={data?.modeBreakdown || {}} /></div>
              <div className={box}><div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Billing model mix</div><Bars data={data?.billingBreakdown || {}} /></div>
              <div className={`${box} lg:col-span-2`}><div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Product types</div><Bars data={data?.productTypeBreakdown || {}} /></div>
            </div>
          )}

          {section === 'orders' && (
            <div className={box}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr>
                    <th className="px-4 py-2">Order</th><th className="px-4 py-2">Store</th><th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Gross</th><th className="px-4 py-2">Our fee</th><th className="px-4 py-2">Net</th>
                    <th className="px-4 py-2">Status</th><th className="px-4 py-2">When</th>
                  </tr></thead>
                  <tbody>
                    {orders.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No matching orders</td></tr> :
                      orders.map((o) => (
                        <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-mono text-xs">{o.orderNumber || o.id}</td>
                          <td className="px-4 py-2">{o.storeName}</td>
                          <td className="px-4 py-2"><div className="font-medium">{o.customerName || '\u2014'}</div><div className="text-xs text-slate-500">{o.customerEmail}</div></td>
                          <td className="px-4 py-2 tabular-nums font-semibold">{money(o.total)}</td>
                          <td className="px-4 py-2 tabular-nums text-violet-700">{money(o.commissionAmount)}<div className="text-[10px] text-slate-400">{pct(o.commissionRate)}</div></td>
                          <td className="px-4 py-2 tabular-nums">{money(o.netAmount)}</td>
                          <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{o.paymentStatus || o.status || '\u2014'}</span></td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(o.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'earnings' && (
            <div className={box}>
              <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">Merchant earnings \u00b7 gross, platform commission, net</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr>
                    <th className="px-4 py-2">Store</th><th className="px-4 py-2">Order</th><th className="px-4 py-2">Gross</th>
                    <th className="px-4 py-2">Rate</th><th className="px-4 py-2">Our fee</th><th className="px-4 py-2">Net</th>
                    <th className="px-4 py-2">Status</th><th className="px-4 py-2">When</th>
                  </tr></thead>
                  <tbody>
                    {earnings.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No earnings rows</td></tr> :
                      earnings.map((e) => (
                        <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-medium">{e.storeName}</td>
                          <td className="px-4 py-2 font-mono text-xs">{e.orderNumber || '\u2014'}</td>
                          <td className="px-4 py-2 tabular-nums">{money(e.grossAmount)}</td>
                          <td className="px-4 py-2 tabular-nums">{pct(e.commissionRate)}</td>
                          <td className="px-4 py-2 tabular-nums text-violet-700">{money(e.commissionAmount)}</td>
                          <td className="px-4 py-2 tabular-nums font-semibold">{money(e.netAmount)}</td>
                          <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{e.status}</span></td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(e.createdAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'payouts' && (
            <div className={box}>
              <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">Payout requests \u00b7 pending vs completed</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr>
                    <th className="px-4 py-2">Store</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Bank</th>
                    <th className="px-4 py-2">Account</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Requested</th><th className="px-4 py-2">Processed</th>
                  </tr></thead>
                  <tbody>
                    {payouts.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No payout requests</td></tr> :
                      payouts.map((p) => (
                        <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-medium">{p.storeName}</td>
                          <td className="px-4 py-2 tabular-nums font-semibold">{money(p.amount)} {p.currency}</td>
                          <td className="px-4 py-2">{p.bankName || '\u2014'}</td>
                          <td className="px-4 py-2">{p.accountName || '\u2014'}</td>
                          <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{p.status}</span></td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(p.createdAt)}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(p.processedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'bio' && (
            <div className={box}>
              <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">Link-in-bio pages \u00b7 mo-sell.store/&#123;slug&#125;</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr>
                    <th className="px-4 py-2">Page</th><th className="px-4 py-2">URL</th><th className="px-4 py-2">Socials</th>
                    <th className="px-4 py-2">Links</th><th className="px-4 py-2">Mode</th><th className="px-4 py-2">Theme</th><th className="px-4 py-2">Updated</th>
                  </tr></thead>
                  <tbody>
                    {bios.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No link-in-bio pages</td></tr> :
                      bios.map((b) => (
                        <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2">
                            <div className="font-medium">{b.bioName || b.name}</div>
                            {b.bioText ? <div className="line-clamp-1 text-xs text-slate-500">{b.bioText}</div> : null}
                            <div className="text-xs text-slate-400">{b.email}</div>
                          </td>
                          <td className="px-4 py-2">
                            {b.publicUrl ? (
                              <a href={b.publicUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-violet-600 hover:underline">/{b.slug}</a>
                            ) : <span className="font-mono text-xs text-slate-400">{b.slug || '\u2014'}</span>}
                          </td>
                          <td className="px-4 py-2 tabular-nums">{fmt(b.socialsCount)}</td>
                          <td className="px-4 py-2 tabular-nums">{fmt(b.customLinksCount)}</td>
                          <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{b.mode || '\u2014'}</span></td>
                          <td className="px-4 py-2 text-xs">{b.theme || '\u2014'}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(b.updatedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'stores' && (
            <div className={box}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr>
                    <th className="px-4 py-2">Store</th><th className="px-4 py-2">Mode</th><th className="px-4 py-2">Billing</th>
                    <th className="px-4 py-2">Fee</th><th className="px-4 py-2">Busmo</th><th className="px-4 py-2">Links</th><th className="px-4 py-2">Updated</th>
                  </tr></thead>
                  <tbody>
                    {stores.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No stores</td></tr> :
                      stores.map((st) => (
                        <tr key={st.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2">
                            <div className="font-medium">{st.name}</div>
                            <div className="text-xs text-slate-500">{st.email}</div>
                            <div className="font-mono text-[11px] text-slate-400">{st.slug || st.id}</div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{st.mode || '\u2014'}</span>
                            {st.hasLinkBio ? <div className="mt-0.5 text-[10px] text-emerald-600">has bio</div> : null}
                          </td>
                          <td className="px-4 py-2 text-xs"><div>{st.billingModel || st.plan || '\u2014'}</div><div className="text-slate-400">{st.billingStatus || ''}</div></td>
                          <td className="px-4 py-2 tabular-nums text-xs">{pct(st.commissionRate)}</td>
                          <td className="px-4 py-2">{st.busmoBusinessId ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Linked</span> : <span className="text-xs text-slate-400">\u2014</span>}</td>
                          <td className="px-4 py-2 text-xs">
                            {st.publicBioUrl ? <a className="block text-violet-600 hover:underline" href={st.publicBioUrl} target="_blank" rel="noopener noreferrer">Bio</a> : null}
                            {st.publicStoreUrl ? <a className="block text-violet-600 hover:underline" href={st.publicStoreUrl} target="_blank" rel="noopener noreferrer">Store</a> : null}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(st.updatedAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'users' && (
            <div className={box}>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr><th className="px-4 py-2">Email</th><th className="px-4 py-2">User id</th><th className="px-4 py-2">Created</th><th className="px-4 py-2">Last sign-in</th></tr></thead>
                  <tbody>
                    {users.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">{data?.configured ? 'No users in sample' : 'Connect Mo-sell Supabase'}</td></tr> :
                      users.map((u) => (
                        <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                          <td className="px-4 py-2 font-medium">{u.email || '\u2014'}</td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{u.id}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(u.createdAt)}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(u.lastSignInAt)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'links' && (
            <div className={box}>
              <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">Busmo \u2194 Mo-sell links (from Busmo DB)</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className={th}><tr><th className="px-4 py-2">Busmo business</th><th className="px-4 py-2">Mo-sell id</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Linked</th></tr></thead>
                  <tbody>
                    {links.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No links yet</td></tr> :
                      links.map((l) => (
                        <tr key={`${l.busmoBusinessId}-${l.moSellBusinessId}`} className="border-t border-slate-100">
                          <td className="px-4 py-2"><div className="font-medium">{l.busmoName}</div><div className="font-mono text-[11px] text-slate-400">{l.busmoBusinessId}</div></td>
                          <td className="px-4 py-2 font-mono text-xs">{l.moSellBusinessId}</td>
                          <td className="px-4 py-2">{l.email || '\u2014'}</td>
                          <td className="px-4 py-2 text-xs text-slate-500">{date(l.linkedAt)}</td>
                        </tr>
                      ))}
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
