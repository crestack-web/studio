'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type AdminBusinessRow = {
  id: string;
  name: string | null;
  category: string | null;
  location: string | null;
  status: string;
  plan: string;
  currency: string;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  products: number;
  sales: number;
  staff: number;
  expenses: number;
  createdAt: string;
  updatedAt: string;
};

function planBadge(plan: string) {
  const p = (plan || 'starter').toLowerCase();
  if (p === 'pro' || p === 'paid' || p === 'lifetime') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (p === 'standard' || p === 'trial') return 'bg-amber-50 text-amber-800 ring-amber-200';
  return 'bg-slate-50 text-slate-700 ring-slate-200';
}

function statusBadge(status: string) {
  const s = (status || 'active').toLowerCase();
  if (s === 'active') return 'bg-violet-50 text-violet-700 ring-violet-200';
  if (s === 'suspended' || s === 'inactive') return 'bg-red-50 text-red-700 ring-red-200';
  return 'bg-slate-50 text-slate-600 ring-slate-200';
}

export default function BusinessTimeline() {
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminBusinessRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const params = new URLSearchParams({ limit: '150' });
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/businesses?${params}`, { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setBusinesses(json.businesses || []);
      setTotal(json.total || 0);
      setCategories(Array.isArray(json.categories) ? json.categories : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, [q, category, status]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const summary = useMemo(() => {
    const active = businesses.filter((b) => String(b.status || '').toLowerCase() === 'active').length;
    const withSales = businesses.filter((b) => (b.sales || 0) > 0).length;
    const cats = new Set(businesses.map((b) => b.category).filter(Boolean)).size;
    return { active, withSales, cats };
  }, [businesses]);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Businesses</h2>
          <p className="text-sm text-slate-500">
            Live directory from Supabase · {total.toLocaleString()} businesses
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

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Listed</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-violet-700 sm:text-2xl">
            {businesses.length.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">of {total.toLocaleString()} total</div>
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Active status</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-emerald-700 sm:text-2xl">
            {summary.active.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">in this page</div>
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">With sales</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-indigo-700 sm:text-2xl">
            {summary.withSales.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">recorded activity</div>
        </div>
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Categories</div>
          <div className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
            {summary.cats.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">in this view</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, category, location, owner…"
          className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Business</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Activity</th>
                </tr>
              </thead>
              <tbody>
                {loading && !businesses.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      No businesses match these filters
                    </td>
                  </tr>
                ) : (
                  businesses.map((b) => (
                    <tr
                      key={b.id}
                      className={`cursor-pointer border-t border-slate-100 hover:bg-violet-50/50 ${
                        selected?.id === b.id ? 'bg-violet-50' : ''
                      }`}
                      onClick={() => setSelected(b)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900">{b.name || 'Unnamed business'}</div>
                        <div className="text-xs text-slate-500">
                          {[b.category, b.location].filter(Boolean).join(' · ') || b.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                            planBadge(b.plan)
                          }`}
                        >
                          {b.plan || 'starter'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${
                            statusBadge(b.status)
                          }`}
                        >
                          {b.status || 'active'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        <span className="tabular-nums">{b.sales}</span> sales ·{' '}
                        <span className="tabular-nums">{b.products}</span> products
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Business detail</h3>
          {!selected ? (
            <p className="mt-4 text-sm text-slate-500">
              Select a business to inspect owner, plan, and usage signals.
            </p>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-500">Name</dt>
                <dd className="font-medium text-slate-900">{selected.name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Business ID</dt>
                <dd className="break-all font-mono text-xs text-slate-600">{selected.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Category</dt>
                <dd className="capitalize">{selected.category || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Location</dt>
                <dd>{selected.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Plan / status</dt>
                <dd className="capitalize">
                  {selected.plan || 'starter'} · {selected.status || 'active'}
                  {selected.currency ? ` · ${selected.currency}` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Owner</dt>
                <dd>
                  {selected.ownerName || '—'}
                  {selected.ownerEmail ? (
                    <div className="break-all text-xs text-slate-500">{selected.ownerEmail}</div>
                  ) : null}
                  {selected.ownerId ? (
                    <div className="break-all font-mono text-[11px] text-slate-400">{selected.ownerId}</div>
                  ) : null}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Products</div>
                  <div className="text-lg font-bold tabular-nums text-slate-900">{selected.products}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Sales</div>
                  <div className="text-lg font-bold tabular-nums text-slate-900">{selected.sales}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Staff</div>
                  <div className="text-lg font-bold tabular-nums text-slate-900">{selected.staff}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Expenses</div>
                  <div className="text-lg font-bold tabular-nums text-slate-900">{selected.expenses}</div>
                </div>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Created</dt>
                <dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Last updated</dt>
                <dd>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : '—'}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
