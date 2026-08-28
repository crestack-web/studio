'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type AdminUserRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: string | null;
  plan: string;
  status: string;
  businessId: string | null;
  businessName: string | null;
  subscriptionStatus: string | null;
  lifetimeAccess: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminAuthHeaders();
      const params = new URLSearchParams({ limit: '150' });
      if (q) params.set('q', q);
      if (plan) params.set('plan', plan);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/users?${params}`, { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setUsers(json.users || []);
      setTotal(json.total || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [q, plan, status]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Users & identity</h2>
          <p className="text-sm text-slate-500">
            Full directory from Supabase · {total.toLocaleString()} profiles
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email, name, phone, business…"
          className="min-w-[220px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">All plans</option>
          <option value="starter">Starter</option>
          <option value="standard">Standard</option>
          <option value="pro">Pro</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="max-h-[70vh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Business</th>
                </tr>
              </thead>
              <tbody>
                {loading && !users.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={`cursor-pointer border-t border-slate-100 hover:bg-violet-50/50 ${selected?.id === u.id ? 'bg-violet-50' : ''}`}
                      onClick={() => setSelected(u)}
                    >
                      <td className="px-3 py-2">
                        <div className="font-medium">{u.fullName || '—'}</div>
                        <div className="text-xs text-slate-500">{u.email || u.phone || '—'}</div>
                      </td>
                      <td className="px-3 py-2 capitalize">{u.plan}</td>
                      <td className="px-3 py-2 capitalize">{u.status}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{u.businessName || u.businessId || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-slate-900">Identity detail</h3>
          {!selected ? (
            <p className="mt-4 text-sm text-slate-500">Select a user to inspect identity, plan, and activity signals.</p>
          ) : (
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-500">Name</dt>
                <dd className="font-medium">{selected.fullName || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Email</dt>
                <dd className="break-all">{selected.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Phone</dt>
                <dd>{selected.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">User ID</dt>
                <dd className="break-all font-mono text-xs">{selected.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Role</dt>
                <dd className="capitalize">{selected.role || 'user'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Plan / subscription</dt>
                <dd className="capitalize">
                  {selected.plan}
                  {selected.subscriptionStatus ? ` · ${selected.subscriptionStatus}` : ''}
                  {selected.lifetimeAccess ? ' · lifetime' : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Business</dt>
                <dd>
                  {selected.businessName || '—'}
                  {selected.businessId ? (
                    <div className="font-mono text-xs text-slate-500">{selected.businessId}</div>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Joined</dt>
                <dd>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">Last activity signal</dt>
                <dd>{selected.lastSeenAt ? new Date(selected.lastSeenAt).toLocaleString() : '—'}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
