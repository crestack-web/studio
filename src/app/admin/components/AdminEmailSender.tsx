'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  readiness: 'ready' | 'params_required';
  defaultSubject: string;
};

async function adminHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  let {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
  }
  const token = session?.access_token;
  if (!token) throw new Error('Sign in with an admin Busmo account');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminEmailSender() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [fromLabel, setFromLabel] = useState('Busmo <support@busmo.io>');
  const [resendConfigured, setResendConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState('mo_sales_announcement');
  const [audience, setAudience] = useState<'single' | 'list' | 'all_users'>('single');
  const [email, setEmail] = useState('crestack@gmail.com');
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [moBrief, setMoBrief] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await adminHeaders();
      const res = await fetch('/api/admin/emails/templates', { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load templates');
      setTemplates(json.templates || []);
      setFromLabel(json.from || fromLabel);
      setResendConfigured(Boolean(json.resendConfigured));
      if (json.templates?.length && !json.templates.find((t: Template) => t.id === templateId)) {
        setTemplateId(json.templates[0].id);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [fromLabel, templateId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selected?.defaultSubject && templateId === 'mo_sales_announcement') {
      setSubject(selected.defaultSubject);
    }
  }, [selected, templateId]);

  const draftWithMo = async () => {
    setDraftBusy(true);
    setError(null);
    setLastResult(null);
    try {
      const headers = await adminHeaders();
      const res = await fetch('/api/admin/emails/draft', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brief: moBrief, audience: 'Busmo business owners' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Draft failed');
      setSubject(json.subject || '');
      setBodyHtml(json.bodyHtml || '');
      setPreviewHtml(json.html || '');
      setTemplateId('custom_mo_draft');
      setLastResult('MO draft ready — review subject & body, then send.');
    } catch (e: any) {
      setError(e?.message || 'Draft failed');
    } finally {
      setDraftBusy(false);
    }
  };

  const send = async (dryRun = false) => {
    setBusy(true);
    setError(null);
    setLastResult(null);
    try {
      const headers = await adminHeaders();
      const payload: Record<string, unknown> = {
        templateId,
        audience,
        dryRun,
        confirmAll: audience === 'all_users' ? confirmAll : false,
        subject,
        bodyHtml,
        html: previewHtml || undefined,
      };
      if (audience === 'single') payload.email = email;
      if (audience === 'list') payload.emails = emails;

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Send failed');

      if (dryRun) {
        setLastResult(
          `Dry run: ${json.recipientCount} recipient(s). Sample: ${(json.sample || [])
            .map((s: any) => s.email)
            .join(', ')}`
        );
      } else {
        setLastResult(`Sent ${json.sent}/${json.total} (failed: ${json.failed})`);
      }
    } catch (e: any) {
      setError(e?.message || 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Email sender</h2>
            <p className="mt-1 text-sm text-slate-600">
              Send product announcements and manual emails using Busmo styling. From:{' '}
              <span className="font-medium text-slate-800">{fromLabel}</span>
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              resendConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {resendConfigured ? 'Resend configured' : 'RESEND_API_KEY missing'}
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </div>
        )}
        {lastResult && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {lastResult}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Template list */}
          <div className="lg:col-span-2 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {templates.map((t) => {
                const active = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-200'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                        {t.category}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{t.description}</p>
                    {t.readiness === 'params_required' && (
                      <p className="mt-1 text-[11px] font-medium text-amber-700">
                        Needs params — use Manual or Write with MO, or attach custom HTML
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Composer */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Audience
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['single', 'Single email'],
                    ['list', 'List'],
                    ['all_users', 'All users'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAudience(id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      audience === id
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {audience === 'single' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Recipient</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="user@example.com"
                />
              </div>
            )}

            {audience === 'list' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Recipients (comma or newline separated)
                </label>
                <textarea
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="a@x.com, b@y.com"
                />
              </div>
            )}

            {audience === 'all_users' && (
              <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={confirmAll}
                  onChange={(e) => setConfirmAll(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I confirm I want to email <strong>all users</strong> in Supabase. Prefer a dry run
                  first.
                </span>
              </label>
            )}

            {(templateId === 'custom_manual' ||
              templateId === 'custom_mo_draft' ||
              selected?.readiness === 'params_required') && (
              <>
                {templateId === 'custom_mo_draft' || templateId === 'custom_manual' ? (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                      Write with MO
                    </p>
                    <textarea
                      value={moBrief}
                      onChange={(e) => setMoBrief(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      placeholder="e.g. Announce MO Sales rollout on 15 Sep: WhatsApp replies, orders, payment links, full business data context..."
                    />
                    <button
                      type="button"
                      disabled={draftBusy || moBrief.trim().length < 10}
                      onClick={draftWithMo}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {draftBusy ? 'MO is writing…' : 'Draft with MO'}
                    </button>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    placeholder="Email subject"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Body HTML (fragment — auto-wrapped in Busmo style if full HTML preview empty)
                  </label>
                  <textarea
                    value={bodyHtml}
                    onChange={(e) => {
                      setBodyHtml(e.target.value);
                      setPreviewHtml('');
                    }}
                    rows={8}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    placeholder="<p>Hello...</p>"
                  />
                </div>
              </>
            )}

            {templateId === 'mo_sales_announcement' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Uses the fixed <strong>MO Sales announcement</strong> template (orders, payment links,
                WhatsApp, full business context). No body edit required.
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => send(true)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Dry run
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  !resendConfigured ||
                  (audience === 'all_users' && !confirmAll)
                }
                onClick={() => send(false)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {busy ? 'Sending…' : 'Send email'}
              </button>
            </div>

            {previewHtml && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Preview
                </p>
                <div className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <iframe
                    title="Email preview"
                    sandbox=""
                    srcDoc={previewHtml}
                    className="h-72 w-full rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
