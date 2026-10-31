'use client';

import React, { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Row = {
  id: string;
  full_name: string;
  business_name: string;
  phone: string;
  email: string;
  business_type?: string;
  city_or_state?: string;
  quantity: number;
  status: string;
  promotion_eligible: boolean;
  promotion_code?: string;
  message?: string;
  created_at: string;
};

export default function BusmoOnePreorders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const sb = getSupabase();
        const { data: sess } = await sb.auth.getSession();
        const token = sess.session?.access_token;
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch('/api/busmo-one/preorder?limit=100', { headers });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        setRows(json.submissions || []);
      } catch (e: any) {
        setError(e?.message || 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-slate-600">Loading Busmo One pre-orders…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Busmo One pre-orders</h2>
        <p className="text-sm text-slate-600">
          Interest registrations only — not paid orders. Promotion eligibility is recorded; Scale is not auto-activated.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Business</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Offer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 font-medium">{r.full_name}</td>
                <td className="px-3 py-2">
                  {r.business_name}
                  {r.business_type ? <div className="text-xs text-slate-500">{r.business_type}</div> : null}
                  {r.city_or_state ? <div className="text-xs text-slate-500">{r.city_or_state}</div> : null}
                </td>
                <td className="px-3 py-2">
                  <div>{r.phone}</div>
                  <div className="text-xs text-slate-500">{r.email}</div>
                </td>
                <td className="px-3 py-2">{r.quantity}</td>
                <td className="px-3 py-2">{r.status}</td>
                <td className="px-3 py-2 text-xs">
                  {r.promotion_eligible ? 'Scale 2mo eligible' : '—'}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                  No pre-order registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
