'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Row = {
  id: string;
  businessId: string;
  businessName: string;
  provider: string;
  whatsappNumber: string;
  status: string;
  moEnabled: boolean;
  onboardingError: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

async function adminHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
  }
  const token = session?.access_token;
  if (!token) throw new Error('Sign in with an admin Busmo account');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function MoSalesConnections() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminHeaders();
      const res = await fetch('/api/admin/mo-sales/connections', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setRows(json.connections || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const headers = await adminHeaders();
      const res = await fetch('/api/admin/mo-sales/connections', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ id, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      await load();
    } catch (e: any) {
      alert(e?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">MO Sales — WhatsApp connections</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manual beta onboarding. Activate only after Infobip sender is configured.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 p-3 text-sm mb-4">
          {error}
          <p className="mt-1 text-xs text-red-600">
            Use a Busmo account that is on the admin email whitelist, with a valid session.
          </p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-gray-500 text-sm">No WhatsApp connection requests yet.</p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pr-3">Business</th>
              <th className="py-2 pr-3">WhatsApp</th>
              <th className="py-2 pr-3">Provider</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">MO</th>
              <th className="py-2 pr-3">Updated</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-gray-100 align-top">
                <td className="py-3 pr-3">
                  <div className="font-medium text-gray-900">{r.businessName}</div>
                  <div className="text-xs text-gray-400 font-mono break-all">{r.businessId}</div>
                </td>
                <td className="py-3 pr-3 font-mono">+{r.whatsappNumber}</td>
                <td className="py-3 pr-3">{r.provider}</td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.onboardingError ? (
                    <div className="text-xs text-red-600 mt-1 max-w-[200px]">{String(r.onboardingError)}</div>
                  ) : null}
                </td>
                <td className="py-3 pr-3">{r.moEnabled ? 'On' : 'Paused'}</td>
                <td className="py-3 pr-3 text-xs text-gray-500">
                  {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {r.status !== 'active' && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => patch(r.id, { status: 'active', moEnabled: true })}
                        className="px-2 py-1 rounded bg-green-600 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    {r.status === 'active' && r.moEnabled && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => patch(r.id, { status: 'paused' })}
                        className="px-2 py-1 rounded border text-xs font-semibold disabled:opacity-50"
                      >
                        Pause MO
                      </button>
                    )}
                    {r.status === 'active' && !r.moEnabled && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => patch(r.id, { moEnabled: true })}
                        className="px-2 py-1 rounded bg-purple-600 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        Enable MO
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() =>
                          patch(r.id, {
                            status: 'failed',
                            error: 'Could not complete Infobip setup',
                          })
                        }
                        className="px-2 py-1 rounded border border-red-200 text-red-700 text-xs font-semibold disabled:opacity-50"
                      >
                        Mark failed
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
