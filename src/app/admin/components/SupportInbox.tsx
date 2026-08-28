'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminAuthHeaders } from '@/lib/admin/client-auth';

type Ticket = {
  id: string;
  status: string;
  needsHuman: boolean;
  guestEmail: string | null;
  userId: string | null;
  businessId: string | null;
  category: string | null;
  lastMessage: string | null;
  subject: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  sessionId: string | null;
};

type Msg = {
  id: string;
  sender_role?: string;
  senderRole?: string;
  content: string;
  created_at?: string;
  createdAt?: string;
};

export default function SupportInbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'needs_human' | 'open'>('all');

  const loadInbox = useCallback(async () => {
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/support/inbox', { headers, cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setTickets(json.tickets || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (ticketId: string) => {
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch(`/api/admin/support/inbox?ticketId=${encodeURIComponent(ticketId)}`, {
        headers,
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMessages(json.messages || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load thread');
    }
  }, []);

  useEffect(() => {
    loadInbox();
    const t = setInterval(loadInbox, 5000);
    return () => clearInterval(t);
  }, [loadInbox]);

  useEffect(() => {
    if (!selectedId) return;
    loadThread(selectedId);
    const t = setInterval(() => loadThread(selectedId), 3000);
    return () => clearInterval(t);
  }, [selectedId, loadThread]);

  const filtered = useMemo(() => {
    if (filter === 'needs_human') return tickets.filter((t) => t.needsHuman || t.status === 'needs_human');
    if (filter === 'open') return tickets.filter((t) => t.status !== 'closed' && t.status !== 'resolved');
    return tickets;
  }, [tickets, filter]);

  const selected = tickets.find((t) => t.id === selectedId) || null;

  const sendReply = async () => {
    if (!selectedId || !reply.trim() || sending) return;
    const text = reply.trim();
    setSending(true);
    setError(null);
    // Optimistic bubble so the agent sees feedback immediately
    const optimisticId = `local-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        sender_role: 'admin',
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);
    setReply('');
    try {
      const headers = await adminAuthHeaders();
      const res = await fetch('/api/admin/support/reply', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ticketId: selectedId, message: text }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setReply(text);
        throw new Error(json.error || `Send failed (${res.status})`);
      }
      if (json.messages?.length) setMessages(json.messages);
      await loadInbox();
    } catch (e: any) {
      setError(e?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Support inbox</h2>
          <p className="text-sm text-slate-500">Live Supabase chat from the welcome MO widget · end-to-end</p>
        </div>
        <button type="button" onClick={loadInbox} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'needs_human', 'open'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === f ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {f === 'needs_human' ? 'Needs human' : f === 'open' ? 'Open' : 'All'}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !tickets.length && <p className="text-sm text-slate-500">Loading…</p>}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-auto">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full px-3 py-3 text-left hover:bg-violet-50 ${selectedId === t.id ? 'bg-violet-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {t.guestEmail || t.userId?.slice(0, 8) || 'Guest'}
                    </span>
                    {t.needsHuman && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        HUMAN
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{t.lastMessage || t.subject || '—'}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : ''}
                  </p>
                </button>
              </li>
            ))}
            {!filtered.length && !loading && (
              <li className="px-3 py-8 text-center text-sm text-slate-500">No conversations yet</li>
            )}
          </ul>
        </div>

        <div className="flex max-h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
              Select a conversation to reply as a human agent
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="font-semibold text-slate-900">{selected.guestEmail || 'Guest visitor'}</div>
                <div className="text-xs text-slate-500">
                  {selected.status} · {selected.source || 'widget'} · {selected.id.slice(0, 8)}…
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => {
                  const role = m.sender_role || m.senderRole || '';
                  const isUser = role === 'user';
                  const isAdmin = role === 'admin' || role === 'agent';
                  return (
                    <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          isUser
                            ? 'bg-violet-600 text-white'
                            : isAdmin
                              ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                              : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="text-[10px] font-semibold uppercase opacity-70 mb-0.5">{role || 'msg'}</div>
                        {m.content}
                        <div className="mt-1 text-[10px] opacity-60">
                          {m.created_at || m.createdAt
                            ? new Date(String(m.created_at || m.createdAt)).toLocaleString()
                            : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendReply();
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply as human agent…"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
