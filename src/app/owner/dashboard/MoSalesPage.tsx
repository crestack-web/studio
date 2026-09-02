'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  launchWhatsAppEmbeddedSignup,
  mapEmbeddedSignupError,
  type EmbeddedSignupPublicConfig,
} from '@/lib/meta/embedded-signup-client';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { getSupabase } from '@/lib/supabase';
import styles from './MoSalesPage.module.css';
import { MOLoadingSpinner } from '@/components/MOLoadingSpinner';

type View = 'home' | 'inbox' | 'credits' | 'settings';

type ConvoRow = {
  id: string;
  customerPhone: string;
  customerName: string | null;
  agentStatus: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
};

type Overview = {
  connection: null | {
    id: string;
    sender: string;
    status: string;
    moEnabled: boolean;
    settings: {
      personality: string;
      maxDiscountPct: number;
      allowNegotiate: boolean;
      humanHandoff: boolean;
      language: string;
    };
  };
  productReadiness: {
    activeProducts: number;
    missingPrice: number;
    inventoryConnected: boolean;
  };
  metrics: {
    salesGenerated: number | null;
    ordersCount: number | null;
    customersHandled: number;
    conversationsTotal: number;
    messagesTotal: number;
    inboundMessages: number;
    needsYou: number;
    moHandling: number;
    conversionRate: number | null;
  };
  recentConversations: ConvoRow[];
  health: 'healthy' | 'needs_attention' | 'not_connected';
  credits?: null | {
    available: number;
    status: string;
    trialRemaining: number;
  };
};

type Message = {
  id: string;
  direction: string;
  text: string | null;
  createdAt: string;
};

type CreditsSummary = {
  trialCredits: number;
  trialCreditsUsed: number;
  trialCreditsRemaining: number;
  purchasedCredits: number;
  purchasedCreditsUsed: number;
  purchasedCreditsRemaining: number;
  usedCredits: number;
  availableCredits: number;
  usageThisMonth: number;
  usageToday: number;
  status: string;
  estimatedResponsesRemaining: number;
  creditsPerResponse: number;
  currency: string;
  packages: Array<{
    id: string;
    name: string;
    credits: number;
    priceKobo: number;
    currency: string;
    description: string | null;
    priceDisplay: string;
  }>;
};

type UsageItem = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
  customerMasked: string | null;
};

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabase();
  let { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    const { data } = await supabase.auth.refreshSession();
    session = data.session;
  }
  const token = session?.access_token;
  if (!token) throw new Error('Please sign in again');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function formatPhone(phone: string) {
  const d = String(phone || '');
  if (d.length < 6) return d;
  return `+${d}`;
}

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function statusLabel(agentStatus: string, stylesMap: typeof styles) {
  if (agentStatus === 'human_active') return { text: 'Needs you', cls: stylesMap.stYou };
  return { text: 'MO handling', cls: stylesMap.stMo };
}


function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function MoSalesPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const businessId = user?.businessId;

  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const [overview, setOverview] = useState<Overview | null>(null);
  const [credits, setCredits] = useState<CreditsSummary | null>(null);
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const [inboxFilter, setInboxFilter] = useState<'all' | 'needs_you' | 'mo_handling'>('all');
  const [inboxQ, setInboxQ] = useState('');
  const [inbox, setInbox] = useState<ConvoRow[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<ConvoRow | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);

  const [connectOpen, setConnectOpen] = useState(false);
  const [waNumber, setWaNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const [personality, setPersonality] = useState('friendly');
  const [maxDiscount, setMaxDiscount] = useState(0);
  const [allowNegotiate, setAllowNegotiate] = useState(false);
  const [humanHandoff, setHumanHandoff] = useState(true);

  const [betaDismissed, setBetaDismissed] = useState(false);
  const [testQuestion, setTestQuestion] = useState('Do you have black sneakers?');
  const [testReply, setTestReply] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [embeddedConfigured, setEmbeddedConfigured] = useState(false);
  const [embeddedConfig, setEmbeddedConfig] = useState<EmbeddedSignupPublicConfig | null>(null);
  const [onboardingPhase, setOnboardingPhase] = useState<string | null>(null);
  const [onboardingBusy, setOnboardingBusy] = useState(false);
  const [onboardingHint, setOnboardingHint] = useState<string | null>(null);


  const loadOverview = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/mo-sales/overview?businessId=${encodeURIComponent(businessId)}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setOverview(json);
      if (json.connection?.settings) {
        setPersonality(json.connection.settings.personality || 'friendly');
        setMaxDiscount(json.connection.settings.maxDiscountPct || 0);
        setAllowNegotiate(!!json.connection.settings.allowNegotiate);
        setHumanHandoff(json.connection.settings.humanHandoff !== false);
      }
      try {
        const st = await fetch(
          `/api/mo-sales/whatsapp/onboarding/status?businessId=${encodeURIComponent(businessId)}`,
          { headers }
        );
        const stJson = await st.json().catch(() => ({}));
        if (st.ok) {
          setEmbeddedConfigured(Boolean(stJson?.embeddedSignup?.configured));
          if (stJson?.embeddedSignup) setEmbeddedConfig(stJson.embeddedSignup as EmbeddedSignupPublicConfig);
        }
      } catch {
        /* non-fatal */
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load MO Sales');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const loadCredits = useCallback(async () => {
    if (!businessId) return;
    setCreditsLoading(true);
    try {
      const headers = await authHeaders();
      const [cRes, uRes] = await Promise.all([
        fetch(`/api/mo-sales/credits?businessId=${encodeURIComponent(businessId)}`, { headers }),
        fetch(`/api/mo-sales/credits/usage?businessId=${encodeURIComponent(businessId)}&limit=30`, { headers }),
      ]);
      const cJson = await cRes.json();
      const uJson = await uRes.json();
      if (cRes.ok) setCredits(cJson);
      if (uRes.ok) setUsageItems(uJson.items || []);
    } catch {
      /* keep previous */
    } finally {
      setCreditsLoading(false);
    }
  }, [businessId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { if (view === 'credits' || view === 'home') loadCredits(); }, [view, loadCredits]);

  // After Paystack redirect (?moCredits=1&reference=...)
  useEffect(() => {
    if (!businessId || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('moCredits') !== '1') return;
    const reference = params.get('reference') || params.get('trxref');
    if (!reference) return;
    (async () => {
      try {
        const headers = await authHeaders();
        await fetch('/api/mo-sales/credits/verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({ businessId, reference }),
        });
        await loadCredits();
        setView('credits');
      } catch { /* ignore */ }
      const url = new URL(window.location.href);
      url.searchParams.delete('moCredits');
      url.searchParams.delete('reference');
      url.searchParams.delete('trxref');
      window.history.replaceState({}, '', url.pathname + url.search);
    })();
  }, [businessId, loadCredits]);

  const loadInbox = useCallback(async () => {
    if (!businessId) return;
    setInboxLoading(true);
    try {
      const headers = await authHeaders();
      const params = new URLSearchParams({ businessId, filter: inboxFilter, q: inboxQ });
      const res = await fetch(`/api/mo-sales/conversations?${params}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setInbox(json.conversations || []);
    } catch (e: any) {
      showToast(e?.message || 'Could not load conversations');
    } finally {
      setInboxLoading(false);
    }
  }, [businessId, inboxFilter, inboxQ, showToast]);

  useEffect(() => { if (view === 'inbox') loadInbox(); }, [view, loadInbox]);

  const openThread = async (row: ConvoRow) => {
    if (!businessId) return;
    setSelectedId(row.id);
    setSelectedMeta(row);
    setThreadLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(
        `/api/mo-sales/conversations/${row.id}?businessId=${encodeURIComponent(businessId)}`,
        { headers }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMessages(json.messages || []);
      if (json.conversation) {
        setSelectedMeta({
          ...row,
          agentStatus: json.conversation.agentStatus,
          customerPhone: json.conversation.customerPhone,
          customerName: json.conversation.customerName,
        });
      }
    } catch (e: any) {
      showToast(e?.message || 'Could not open conversation');
    } finally {
      setThreadLoading(false);
    }
  };

  const setAgentStatus = async (status: 'ai_active' | 'human_active') => {
    if (!businessId || !selectedId) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/mo-sales/conversations/${selectedId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ businessId, agentStatus: status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setSelectedMeta((m) => (m ? { ...m, agentStatus: status } : m));
      setInbox((rows) => rows.map((r) => (r.id === selectedId ? { ...r, agentStatus: status } : r)));
      showToast(status === 'human_active' ? 'You are handling this chat' : 'MO is handling again');
      loadOverview();
    } catch (e: any) {
      showToast(e?.message || 'Could not update');
    } finally {
      setSaving(false);
    }
  };

  const patchSettings = async (patch: Record<string, unknown>) => {
    if (!businessId) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/mo-sales/settings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ businessId, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      showToast('Saved');
      await loadOverview();
    } catch (e: any) {
      showToast(e?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const requestConnect = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/mo-sales/settings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ businessId, action: 'request_connect', whatsappNumber: waNumber }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Request failed');
      showToast(json.message || 'Request sent');
      setConnectOpen(false);
      setWaNumber('');
      await loadOverview();
    } catch (e: any) {
      showToast(e?.message || 'Could not connect');
    } finally {
      setSaving(false);
    }
  };


  const runTestMo = async () => {
    if (!businessId || !testQuestion.trim()) return;
    setTestLoading(true);
    setTestReply(null);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/mo-sales/test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ businessId, message: testQuestion.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Test failed');
      setTestReply(json.reply || 'No response');
    } catch (e: any) {
      setTestReply(null);
      showToast(e?.message || 'Could not test MO');
    } finally {
      setTestLoading(false);
    }
  };

  const connStatus = overview?.connection?.status || '';
  const connected = connStatus === 'active';
  const pending = connStatus === 'pending';
  const failed = connStatus === 'failed';
  const moOn = Boolean(connected && overview?.connection?.moEnabled);

  if (!businessId) {
    // User profile may still be resolving businessId after sign-in
    if (!user?.id || user?.shortName === 'User' || user?.initials === '..') {
      return (
        <div className={styles.wrap} role="status" aria-live="polite" aria-busy="true">
          <div className={styles.header}>
            <h1 className={styles.title}>MO Sales</h1>
            <p className={styles.subtitle}>Loading your business…</p>
          </div>
          <div className={styles.moLoadingCenter}>
            <MOLoadingSpinner size={120} />
          </div>
        </div>
      );
    }
    return (
      <div className={styles.wrap}>
        <div className={styles.errorBox}>
          <p>Finish setting up your business to use MO Sales.</p>
          <p className={styles.muted}>MO needs a business account before it can sell on WhatsApp.</p>
          <button type="button" className={styles.btnPrimary} onClick={() => navigateTo('settings' as any)}>
            Go to settings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.wrap} role="status" aria-live="polite" aria-busy="true">
        <div className={styles.header}>
          <h1 className={styles.title}>MO Sales</h1>
          <p className={styles.subtitle}>Loading your WhatsApp sales agent…</p>
        </div>
        <div className={styles.moLoadingCenter}>
          <MOLoadingSpinner size={120} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <div className={styles.errorBox}>
          <p>We could not load MO Sales.</p>
          <p className={styles.muted}>{error}</p>
          <button type="button" className={styles.btnPrimary} onClick={loadOverview}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>MO Sales Agent</h1>
          <p className={styles.subtitle}>
            Your AI salesperson for WhatsApp. MO talks to customers, recommends your products
            and helps turn chats into sales — even when you are busy.
          </p>
        </div>
        <div className={styles.headerActions}>
          {connected && moOn && <span className={styles.pillLive}>MO is selling</span>}
          {!connected && (
            <button type="button" className={`${styles.btnPrimary} ${styles.btnWhatsApp}`} onClick={() => setConnectOpen(true)}>
              <WhatsAppIcon className={styles.waIcon} />
              Connect WhatsApp
            </button>
          )}
          {connected && !moOn && (
            <>
              <span className={styles.pillPaused}>MO is paused</span>
              <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => patchSettings({ moEnabled: true })}>
                Turn MO on
              </button>
            </>
          )}
          {connected && moOn && (
            <button
              type="button"
              className={styles.btnGhost}
              disabled={saving}
              onClick={() => {
                if (confirm('Pause MO? Customers will not get automatic replies until you turn MO back on.')) {
                  patchSettings({ moEnabled: false });
                }
              }}
            >
              Pause MO
            </button>
          )}
        </div>
      </header>

      {!betaDismissed && (
        <div className={styles.betaBanner} role="note">
          <div>
            <strong>MO Sales is currently in beta.</strong>
            <span className={styles.muted}> We&apos;re working closely with a small number of businesses to make MO even better.</span>
          </div>
          <button type="button" className={styles.btnGhost} onClick={() => setBetaDismissed(true)}>Dismiss</button>
        </div>
      )}

      <nav className={styles.tabs} aria-label="MO Sales sections">
        {([
          { id: 'home' as View, full: 'Overview', short: 'Overview' },
          { id: 'inbox' as View, full: 'Conversations', short: 'Chats' },
          { id: 'credits' as View, full: 'Credits & Usage', short: 'Credits' },
          { id: 'settings' as View, full: 'Settings', short: 'Settings' },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={view === tab.id ? styles.tabActive : styles.tab}
            onClick={() => setView(tab.id)}
            aria-label={tab.full}
          >
            <span className={styles.tabLabelFull}>{tab.full}</span>
            <span className={styles.tabLabelShort}>{tab.short}</span>
            {tab.id === 'inbox' && (overview?.metrics.needsYou || 0) > 0 ? (
              <span className={styles.badge}>{overview?.metrics.needsYou}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {view === 'home' && (
        <>
          {(!connected || (overview?.metrics.conversationsTotal || 0) === 0) && (
            <section className={styles.heroCard} aria-label="How MO Sales works">
              <img
                src="/mo-sales-hero.jpg"
                alt="MO Sales: MO chats with your customers on WhatsApp, answers questions, shares info and collects orders — just like a real human."
                className={styles.heroImage}
                width={1200}
                height={675}
              />
            </section>
          )}
          <section className={styles.card}>
            {!connected && !pending && (
              <>
                <h2 className={styles.cardTitle}>Connect your WhatsApp</h2>
                <p className={styles.muted}>
                  Let MO respond to customers on WhatsApp and help you close more sales.
                </p>
                <ul className={styles.bullets}>
                  <li>Customers message your business number normally</li>
                  <li>MO answers with your real products and prices</li>
                  <li>You can take over any conversation instantly</li>
                </ul>
                <button type="button" className={`${styles.btnPrimary} ${styles.btnWhatsApp}`} onClick={() => setConnectOpen(true)}>
                  <WhatsAppIcon className={styles.waIcon} />
                  Connect WhatsApp
                </button>
              </>
            )}
            {pending && (
              <>
                <h2 className={styles.cardTitle}>Setup in progress</h2>
                <p className={styles.statusLine}><span className={styles.dotAmber} /> Pending</p>
                <p className={styles.muted}>We&apos;re connecting your WhatsApp to MO.</p>
                <p className={styles.muted}>
                  Number: <strong>{formatPhone(overview?.connection?.sender || '')}</strong>
                </p>
                <p className={styles.muted}>
                  This usually requires a quick setup on our side. We&apos;ll let you know when MO is ready.
                  WhatsApp is not connected until status is Active.
                </p>
              </>
            )}
            {failed && (
              <>
                <h2 className={styles.cardTitle}>We couldn&apos;t complete your WhatsApp setup</h2>
                <p className={styles.statusLine}><span className={styles.dotAmber} /> Failed</p>
                <p className={styles.muted}>
                  Please try connecting again or contact support so we can finish setup for you.
                </p>
                <button type="button" className={`${styles.btnPrimary} ${styles.btnWhatsApp}`} onClick={() => setConnectOpen(true)}>
                  <WhatsAppIcon className={styles.waIcon} />
                  Try again
                </button>
              </>
            )}
            {connected && (
              <div className={styles.rowBetween}>
                <div>
                  <h2 className={styles.cardTitle}>WhatsApp connected</h2>
                  <p className={styles.statusLine}>
                    <span className={styles.dotGreen} /> Connected · {formatPhone(overview?.connection?.sender || '')}
                  </p>
                </div>
                <p className={styles.statusLine}>
                  {moOn ? (<><span className={styles.dotGreen} /> MO is active</>) : (<><span className={styles.dotAmber} /> MO is paused</>)}
                </p>
              </div>
            )}
          </section>

          <section className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitleSm}>Status</h3>
              {overview?.health === 'healthy' && (
                <p className={styles.statusLine}><span className={styles.dotGreen} /> MO is ready · WhatsApp connected · Product data available</p>
              )}
              {overview?.health === 'not_connected' && (
                <p className={styles.statusLine}><span className={styles.dotGray} /> MO is not connected yet</p>
              )}
              {overview?.health === 'needs_attention' && (
                <p className={styles.statusLine}>
                  <span className={styles.dotAmber} /> MO needs attention
                  {(overview?.productReadiness.missingPrice || 0) > 0
                    ? ` · ${overview?.productReadiness.missingPrice} products missing prices`
                    : !moOn ? ' · MO is paused' : ''}
                </p>
              )}
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitleSm}>MO product knowledge</h3>
              <ul className={styles.checkList}>
                <li>{(overview?.productReadiness.activeProducts || 0) > 0 ? '✓' : '⚠'} {overview?.productReadiness.activeProducts || 0} active products</li>
                <li>
                  {(overview?.productReadiness.missingPrice || 0) === 0 ? '✓' : '⚠'}{' '}
                  {(overview?.productReadiness.missingPrice || 0) === 0
                    ? 'Prices available'
                    : `${overview?.productReadiness.missingPrice} products without prices`}
                </li>
                <li>✓ Inventory connected</li>
              </ul>
              {(overview?.productReadiness.missingPrice || 0) > 0 && (
                <button type="button" className={styles.btnLink} onClick={() => navigateTo('inventory' as any)}>
                  Fix product information
                </button>
              )}
            </div>
          </section>

          {overview?.credits && (
            <section className={styles.card}>
              <div className={styles.creditLabel}>MO Credits</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1.25rem' }}>{overview.credits.available.toLocaleString()}</strong>
                  <span className={styles.muted}> available</span>
                  {overview.credits.status === 'trial' && (
                    <span className={styles.muted}> · FREE TRIAL ({overview.credits.trialRemaining} left)</span>
                  )}
                  {overview.credits.status === 'empty' && (
                    <div className={styles.creditWarn} style={{ marginTop: 8 }}>
                      MO is paused — your credits have finished.
                    </div>
                  )}
                  {(overview.credits.status === 'low' || overview.credits.status === 'critical') && (
                    <div className={styles.creditWarn} style={{ marginTop: 8 }}>
                      You’re running low on MO credits.
                    </div>
                  )}
                </div>
                <button type="button" className={styles.btnPrimary} onClick={() => setView('credits')}>
                  Credits & Usage
                </button>
              </div>
            </section>
          )}

          <section className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Customers handled</div>
              <div className={styles.metricValue}>{overview?.metrics.customersHandled ?? 0}</div>
              <div className={styles.metricSub}>Conversations on WhatsApp</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Messages</div>
              <div className={styles.metricValue}>{overview?.metrics.messagesTotal ?? 0}</div>
              <div className={styles.metricSub}>In and out</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Needs you</div>
              <div className={styles.metricValue}>{overview?.metrics.needsYou ?? 0}</div>
              <div className={styles.metricSub}>Chats waiting for you</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Sales generated by MO</div>
              <div className={styles.metricValue}>
                {overview?.metrics.salesGenerated == null ? '—' : formatMoney(overview.metrics.salesGenerated)}
              </div>
              <div className={styles.metricSub}>
                {overview?.metrics.salesGenerated == null ? 'Not enough data yet' : ''}
              </div>
            </div>
          </section>

          {(overview?.metrics.conversationsTotal || 0) === 0 ? (
            <section className={styles.empty}>
              <h3>MO has not made its first sale yet</h3>
              <p className={styles.muted}>Once customers start chatting with MO, you will see conversations and activity here.</p>
              {!connected ? (
                <button type="button" className={`${styles.btnPrimary} ${styles.btnWhatsApp}`} onClick={() => setConnectOpen(true)}>
                  <WhatsAppIcon className={styles.waIcon} />
                  Connect WhatsApp
                </button>
              ) : (
                <button type="button" className={styles.btnPrimary} onClick={() => setView('inbox')}>View conversations</button>
              )}
            </section>
          ) : (
            <section className={styles.card}>
              <div className={styles.rowBetween}>
                <h2 className={styles.cardTitle}>Recent conversations</h2>
                <button type="button" className={styles.btnLink} onClick={() => setView('inbox')}>See all</button>
              </div>
              <ul className={styles.convoList}>
                {(overview?.recentConversations || []).map((c) => {
                  const st = statusLabel(c.agentStatus, styles);
                  return (
                    <li key={c.id}>
                      <button type="button" className={styles.convoRow} onClick={() => { setView('inbox'); openThread(c); }}>
                        <div className={styles.convoMain}>
                          <strong>{c.customerName || formatPhone(c.customerPhone)}</strong>
                          <span className={styles.muted}>{c.lastMessage ? `"${c.lastMessage}"` : 'No messages yet'}</span>
                        </div>
                        <div className={styles.convoMeta}>
                          <span className={styles.time}>{timeAgo(c.lastMessageAt)}</span>
                          <span className={st.cls}>{st.text}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className={styles.card}>
            <h3 className={styles.cardTitleSm}>MO readiness</h3>
            <ul className={styles.checkList}>
              <li>{connected ? '✓' : '○'} WhatsApp connection {connected ? 'active' : pending ? 'pending' : 'not connected'}</li>
              <li>{(overview?.productReadiness.activeProducts || 0) > 0 ? '✓' : '○'} Products available ({overview?.productReadiness.activeProducts || 0})</li>
              <li>
                {(overview?.productReadiness.missingPrice || 0) === 0 && (overview?.productReadiness.activeProducts || 0) > 0 ? '✓' : '○'}{' '}
                {(overview?.productReadiness.missingPrice || 0) === 0
                  ? 'Products have prices'
                  : `${overview?.productReadiness.missingPrice} products need prices`}
              </li>
              <li>✓ Inventory information available where set on products</li>
            </ul>
            {connected && (overview?.productReadiness.missingPrice || 0) > 0 && (
              <>
                <p className={styles.muted} style={{ marginTop: 8 }}>
                  MO isn&apos;t fully ready yet — fix product prices so MO can answer accurately.
                </p>
                <button type="button" className={styles.btnLink} onClick={() => navigateTo('inventory' as any)}>
                  Fix products
                </button>
              </>
            )}
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitleSm}>MO can</h3>
            <ul className={styles.checkList}>
              <li>✓ Answer product questions</li>
              <li>✓ Check available products</li>
              <li>✓ Explain prices (when set)</li>
              <li>✓ Handle common objections</li>
              <li>✓ Recommend products from your catalog</li>
              <li>✓ Continue conversations naturally</li>
              <li>✓ Hand conversations back to you</li>
            </ul>
            <p className={styles.muted} style={{ marginTop: 8 }}>
              MO cannot take payments, create orders, or arrange delivery yet.
            </p>
          </section>

          <section className={styles.card}>
            <h3 className={styles.cardTitleSm}>Test MO</h3>
            <p className={styles.muted}>
              See how MO would respond to your customers using your real products.
              This is a preview — it won&apos;t send a message to anyone.
            </p>
            <input
              className={styles.search}
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="e.g. Do you have black sneakers?"
            />
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={testLoading || !testQuestion.trim()}
              onClick={runTestMo}
            >
              {testLoading ? 'Asking MO…' : 'Run test'}
            </button>
            {testReply && (
              <div className={styles.testReply}>
                <strong>MO says</strong>
                <p>{testReply}</p>
              </div>
            )}
          </section>

        </>
      )}

      {view === 'inbox' && (
        <section className={styles.inbox}>
          <div className={styles.inboxList}>
            <input
              className={styles.search}
              placeholder="Search customers..."
              value={inboxQ}
              onChange={(e) => setInboxQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadInbox()}
              aria-label="Search conversations"
            />
            <div className={styles.filterRow}>
              {([['all', 'All'], ['needs_you', 'Needs you'], ['mo_handling', 'MO handling']] as const).map(([k, label]) => (
                <button key={k} type="button" className={inboxFilter === k ? styles.chipActive : styles.chip} onClick={() => setInboxFilter(k)}>
                  {label}
                </button>
              ))}
            </div>
            {inboxLoading ? (
              <div className={styles.listSkeleton} role="status" aria-live="polite" aria-busy="true">
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
                <div className={styles.skeletonRow} />
                <p className={styles.loadingTextSm}>Loading conversations…</p>
              </div>
            ) : inbox.length === 0 ? (
              <p className={styles.muted}>No conversations yet.</p>
            ) : (
              <ul className={styles.convoList}>
                {inbox.map((c) => {
                  const st = statusLabel(c.agentStatus, styles);
                  return (
                    <li key={c.id}>
                      <button type="button" className={selectedId === c.id ? styles.convoRowActive : styles.convoRow} onClick={() => openThread(c)}>
                        <div className={styles.convoMain}>
                          <strong>{c.customerName || formatPhone(c.customerPhone)}</strong>
                          <span className={styles.muted}>{c.lastMessage ? `"${c.lastMessage}"` : ''}</span>
                        </div>
                        <div className={styles.convoMeta}>
                          <span className={styles.time}>{timeAgo(c.lastMessageAt)}</span>
                          <span className={st.cls}>{st.text}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={styles.inboxThread}>
            {!selectedId && (
              <div className={styles.threadEmpty}><p className={styles.muted}>Select a conversation</p></div>
            )}
            {selectedId && selectedMeta && (
              <>
                <div className={styles.threadHeader}>
                  <div>
                    <strong>{selectedMeta.customerName || formatPhone(selectedMeta.customerPhone)}</strong>
                    <div className={styles.muted}>{formatPhone(selectedMeta.customerPhone)}</div>
                    <span className={statusLabel(selectedMeta.agentStatus, styles).cls}>
                      {statusLabel(selectedMeta.agentStatus, styles).text}
                    </span>
                  </div>
                  <div className={styles.threadActions}>
                    {selectedMeta.agentStatus === 'ai_active' ? (
                      <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => setAgentStatus('human_active')}>
                        Take over conversation
                      </button>
                    ) : (
                      <button type="button" className={styles.btnGhost} disabled={saving} onClick={() => setAgentStatus('ai_active')}>
                        Return to MO
                      </button>
                    )}
                  </div>
                </div>
                {selectedMeta.agentStatus === 'human_active' && (
                  <div className={styles.bannerYou}>You are now handling this conversation.</div>
                )}
                <div className={styles.messages}>
                  {threadLoading ? (
                    <div className={styles.listSkeleton} role="status" aria-live="polite" aria-busy="true">
                      <div className={styles.skeletonBubble} />
                      <div className={`${styles.skeletonBubble} ${styles.skeletonBubbleOut}`} />
                      <div className={styles.skeletonBubble} />
                      <p className={styles.loadingTextSm}>Loading messages…</p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={m.direction === 'inbound' ? styles.bubbleIn : styles.bubbleOut}>
                        <div className={styles.bubbleLabel}>{m.direction === 'inbound' ? 'Customer' : 'MO'}</div>
                        <div>{m.text}</div>
                        <div className={styles.bubbleTime}>{new Date(m.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}


      {view === 'credits' && (
        <section className={styles.creditsSection}>
          {creditsLoading && !credits ? (
            <div className={styles.muted}>Loading credits…</div>
          ) : !credits || (credits.availableCredits === 0 && credits.usedCredits === 0 && credits.trialCredits === 0) ? (
            <div className={styles.empty}>
              <h2>Your MO Sales credits are waiting</h2>
              <p>Start your free MO Sales trial and see how MO handles customer conversations for your business.</p>
              <button type="button" className={styles.btnPrimary} onClick={() => loadCredits()}>
                Start free trial
              </button>
              <p className={styles.muted} style={{ marginTop: 12 }}>
                MO Credits are used when MO handles customer conversations automatically. Usage depends on how many customers message you.
              </p>
            </div>
          ) : credits.status === 'empty' && credits.trialCreditsUsed >= credits.trialCredits && credits.purchasedCredits === 0 ? (
            <div className={styles.empty}>
              <h2>Your MO Sales trial is complete</h2>
              <p>MO handled your customer conversations during your trial. Add credits to keep MO responding automatically.</p>
              <p className={styles.muted}>Trial credits used: {credits.trialCreditsUsed}</p>
              <button type="button" className={styles.btnPrimary} onClick={() => setBuyOpen(true)}>Buy MO Credits</button>
              <button type="button" className={styles.btnGhost} style={{ marginLeft: 8 }} onClick={() => setView('inbox')}>View conversations</button>
            </div>
          ) : (
            <>
              <div className={styles.creditHero}>
                <div>
                  <div className={styles.creditLabel}>MO Credits</div>
                  <div className={styles.creditBalance}>{credits.availableCredits.toLocaleString()}</div>
                  <div className={styles.muted}>
                    ≈ {credits.estimatedResponsesRemaining.toLocaleString()} automatic replies remaining
                    {credits.status === 'trial' ? ' · FREE TRIAL' : ''}
                  </div>
                </div>
                <div className={styles.headerActions}>
                  <button type="button" className={styles.btnPrimary} onClick={() => setBuyOpen(true)}>Buy Credits</button>
                  <button type="button" className={styles.btnGhost} onClick={() => loadCredits()}>Refresh</button>
                </div>
              </div>

              {(credits.status === 'low' || credits.status === 'critical') && (
                <div className={styles.creditWarn}>
                  {credits.status === 'critical'
                    ? 'MO Sales is almost out of credits.'
                    : 'You’re running low on MO credits.'}
                  {' '}
                  <button type="button" className={styles.linkBtn} onClick={() => setBuyOpen(true)}>Buy Credits</button>
                </div>
              )}
              {credits.status === 'empty' && (
                <div className={styles.creditWarn}>
                  MO Sales has stopped responding automatically because your credits are finished.
                  {' '}
                  <button type="button" className={styles.linkBtn} onClick={() => setBuyOpen(true)}>Buy Credits</button>
                </div>
              )}

              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{credits.availableCredits.toLocaleString()}</div>
                  <div className={styles.metricSub}>Available</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{credits.usageThisMonth.toLocaleString()}</div>
                  <div className={styles.metricSub}>Used this month</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{credits.trialCreditsUsed.toLocaleString()}</div>
                  <div className={styles.metricSub}>Trial used</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{credits.purchasedCredits.toLocaleString()}</div>
                  <div className={styles.metricSub}>Purchased</div>
                </div>
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>How credits work</h3>
                <p className={styles.muted}>
                  MO Credits are used when MO handles customer conversations automatically.
                  Your actual usage depends on how many customers message your business and how often MO responds.
                  One customer may send several messages.
                </p>
                {credits.trialCredits > 0 && (
                  <p className={styles.muted}>
                    FREE TRIAL: {credits.trialCreditsRemaining} / {credits.trialCredits} trial credits remaining
                  </p>
                )}
              </div>

              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Recent usage</h3>
                {usageItems.length === 0 ? (
                  <p className={styles.muted}>No usage yet. When MO replies to a customer, it will show up here.</p>
                ) : (
                  <div className={styles.usageTable}>
                    <div className={styles.usageHead}>
                      <span>Date</span><span>Activity</span><span>Customer</span><span>Credits</span>
                    </div>
                    {usageItems.map((u) => (
                      <div key={u.id} className={styles.usageRow}>
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        <span>{u.type === 'message_usage' ? 'MO response' : u.type === 'trial_grant' ? 'Trial grant' : u.type === 'purchase' ? 'Purchase' : u.type}</span>
                        <span>{u.customerMasked || '—'}</span>
                        <span>{u.amount > 0 ? `+${u.amount}` : u.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {buyOpen && (
            <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
              <div className={styles.modal}>
                <h3>Buy MO Credits</h3>
                <p className={styles.muted}>Pay Busmo — credits are added after payment is verified.</p>
                <div className={styles.packageList}>
                  {(credits?.packages || []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={styles.packageCard}
                      disabled={checkoutBusy}
                      onClick={async () => {
                        if (!businessId) return;
                        setCheckoutBusy(true);
                        try {
                          const headers = await authHeaders();
                          const res = await fetch('/api/mo-sales/credits/checkout', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ businessId, packageId: p.id }),
                          });
                          const json = await res.json();
                          if (!res.ok) throw new Error(json.error || 'Checkout failed');
                          if (json.authorizationUrl) {
                            window.location.href = json.authorizationUrl;
                          }
                        } catch (e: any) {
                          alert(e?.message || 'Could not start payment');
                        } finally {
                          setCheckoutBusy(false);
                        }
                      }}
                    >
                      <strong>{p.name}</strong>
                      <div>{p.credits.toLocaleString()} credits</div>
                      <div className={styles.muted}>{p.priceDisplay}</div>
                      {p.description && <div className={styles.muted}>{p.description}</div>}
                    </button>
                  ))}
                </div>
                <button type="button" className={styles.btnGhost} onClick={() => setBuyOpen(false)}>Close</button>
              </div>
            </div>
          )}
        </section>
      )}

      {view === 'settings' && (
        <section className={styles.settings}>
          <div className={styles.card}>
            <p className={styles.muted}>
              MO Sales uses WhatsApp to automatically answer your customers, recommend products and help turn conversations into sales.
              You do not need an Infobip account — Busmo operates the messaging infrastructure.
            </p>
            <p className={styles.muted}>
              If you are testing with the shared Busmo demo number, you are in the <strong>Busmo MO Sales Demo / Trial</strong> environment — this is not a permanent number for your business.
            </p>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>WhatsApp</h2>
            {connected ? (
              <p className={styles.statusLine}>
                <span className={styles.dotGreen} /> Connected · {formatPhone(overview?.connection?.sender || '')}
              </p>
            ) : (
              <button type="button" className={`${styles.btnPrimary} ${styles.btnWhatsApp}`} onClick={() => setConnectOpen(true)}>
                <WhatsAppIcon className={styles.waIcon} />
                Connect WhatsApp
              </button>
            )}
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>How MO should sound</h2>
            <p className={styles.muted}>Choose how MO talks to your customers.</p>
            <div className={styles.personalityGrid}>
              {(['friendly', 'professional', 'casual', 'persuasive'] as const).map((p) => (
                <button key={p} type="button" className={personality === p ? styles.persActive : styles.pers} onClick={() => setPersonality(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Sales behaviour</h2>
            <label className={styles.field}>
              <span>Maximum discount MO can offer (%)</span>
              <input type="number" min={0} max={100} value={maxDiscount} onChange={(e) => setMaxDiscount(Number(e.target.value))} />
              <span className={styles.muted}>MO will never offer more than this without asking you.</span>
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={allowNegotiate} onChange={(e) => setAllowNegotiate(e.target.checked)} />
              <span>Allow MO to negotiate within your discount limit</span>
            </label>
            <label className={styles.toggle}>
              <input type="checkbox" checked={humanHandoff} onChange={(e) => setHumanHandoff(e.target.checked)} />
              <span>Hand over difficult conversations to you</span>
            </label>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={saving}
              onClick={() => patchSettings({ personality, maxDiscountPct: maxDiscount, allowNegotiate, humanHandoff })}
            >
              Save settings
            </button>
          </div>

          {connected && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>MO power</h2>
              {moOn ? (
                <button type="button" className={styles.btnGhost} disabled={saving} onClick={() => patchSettings({ moEnabled: false })}>Pause MO</button>
              ) : (
                <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => patchSettings({ moEnabled: true })}>Turn MO On</button>
              )}
            </div>
          )}
        </section>
      )}

      {connectOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h2>Connect your WhatsApp</h2>
            <p className={styles.muted}>
              Connect securely through Meta. You will connect your WhatsApp Business account,
              choose your business, verify your phone number, and give Busmo permission to manage messaging.
            </p>
            <ul className={styles.bullets}>
              <li>Connect your WhatsApp Business account</li>
              <li>Choose your business</li>
              <li>Verify your phone number</li>
              <li>Give Busmo permission to manage messaging</li>
            </ul>
            {onboardingPhase && (
              <p className={styles.muted} role="status" aria-live="polite">
                <strong>{onboardingPhase}</strong>
              </p>
            )}
            {onboardingHint && <p className={styles.muted}>{onboardingHint}</p>}
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhost} onClick={() => setConnectOpen(false)} disabled={onboardingBusy}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.btnWhatsApp}`}
                disabled={onboardingBusy}
                onClick={async () => {
                  if (!businessId) return;
                  setOnboardingBusy(true);
                  setOnboardingHint(null);
                  setOnboardingPhase('Starting secure connection…');
                  try {
                    const headers = await authHeaders();
                    const res = await fetch('/api/mo-sales/whatsapp/onboarding/start', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ businessId }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (res.status === 503 || json.error === 'embedded_signup_not_configured') {
                      setOnboardingPhase(null);
                      setOnboardingHint(
                        'Meta Embedded Signup is not enabled for Busmo yet (Meta app + configuration ID required). Use manual beta setup below, or contact support.'
                      );
                      return;
                    }
                    if (!res.ok) throw new Error(json.error || json.message || 'Could not start onboarding');

                    const cfg = (json.config || embeddedConfig) as EmbeddedSignupPublicConfig;
                    if (!cfg?.metaAppId || !cfg?.metaConfigId) {
                      setOnboardingPhase(null);
                      setOnboardingHint('Embedded Signup config incomplete. Contact support.');
                      return;
                    }

                    setOnboardingPhase('Opening Meta signup… Complete the steps in the popup.');
                    let loginResult;
                    try {
                      loginResult = await launchWhatsAppEmbeddedSignup(cfg);
                    } catch (launchErr) {
                      const mapped = mapEmbeddedSignupError(launchErr);
                      // User cancelled / closed
                      await fetch('/api/mo-sales/whatsapp/onboarding/callback', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ businessId, event: 'CANCEL' }),
                      }).catch(() => {});
                      setOnboardingPhase(null);
                      setOnboardingHint(mapped);
                      return;
                    }

                    const session = loginResult.session;
                    if (session?.event && String(session.event).toUpperCase().includes('CANCEL')) {
                      await fetch('/api/mo-sales/whatsapp/onboarding/callback', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ businessId, event: 'CANCEL' }),
                      });
                      setOnboardingPhase(null);
                      setOnboardingHint('Signup cancelled. You can try again when ready.');
                      return;
                    }

                    if (!session?.wabaId) {
                      setOnboardingPhase(null);
                      setOnboardingHint(
                        'Meta did not return a WhatsApp Business Account ID. Finish every step in the Meta window (including phone verification), then try again.'
                      );
                      return;
                    }

                    setOnboardingPhase('Registering WhatsApp sender with Infobip…');
                    const cbRes = await fetch('/api/mo-sales/whatsapp/onboarding/callback', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({
                        businessId,
                        event: 'FINISH',
                        wabaId: session.wabaId,
                        phoneNumberId: session.phoneNumberId,
                        metaBusinessId: session.metaBusinessId,
                        displayPhoneNumber: session.displayPhoneNumber,
                        // Auth code is not a long-lived secret; still never log it. Server may ignore.
                        hasAuthCode: Boolean(loginResult.login?.authResponse?.code),
                      }),
                    });
                    const cbJson = await cbRes.json().catch(() => ({}));
                    if (cbRes.status === 409 || cbJson.error === 'number_belongs_to_another_business') {
                      setOnboardingPhase(null);
                      setOnboardingHint(
                        'This WhatsApp number is already connected to another Busmo business. Use a different number or contact support.'
                      );
                      return;
                    }
                    if (!cbRes.ok || cbJson.ok === false) {
                      setOnboardingPhase(null);
                      setOnboardingHint(
                        cbJson.message ||
                          cbJson.error ||
                          'Infobip registration failed. Please try again or contact support.'
                      );
                      return;
                    }

                    setOnboardingPhase('Finishing setup… waiting for provider confirmation');
                    setOnboardingHint(
                      cbJson.message ||
                        'Registration submitted. WhatsApp will show as Connected only after the provider confirms the sender is ready.'
                    );

                    // Poll status a few times (does not claim Connected early)
                    for (let i = 0; i < 5; i++) {
                      await new Promise((r) => setTimeout(r, 2000));
                      await loadOverview();
                      const stRes = await fetch(
                        `/api/mo-sales/whatsapp/onboarding/status?businessId=${encodeURIComponent(businessId)}`,
                        { headers }
                      );
                      const stJson = await stRes.json().catch(() => ({}));
                      const os = stJson?.connection?.onboardingStatus;
                      if (os === 'active') {
                        setOnboardingPhase('WhatsApp connected');
                        setOnboardingHint(null);
                        showToast('WhatsApp connected. You can turn MO on.');
                        setConnectOpen(false);
                        break;
                      }
                      if (os === 'failed') {
                        setOnboardingPhase(null);
                        setOnboardingHint(stJson?.connection?.error || 'Registration failed.');
                        break;
                      }
                      setOnboardingPhase(
                        os === 'sender_registration_pending'
                          ? 'Sender registration pending…'
                          : 'Verifying with provider…'
                      );
                    }
                    await loadOverview();
                  } catch (e: any) {
                    setOnboardingPhase(null);
                    setOnboardingHint(e?.message || 'Could not connect WhatsApp');
                  } finally {
                    setOnboardingBusy(false);
                  }
                }}
              >
                <WhatsAppIcon className={styles.waIcon} />
                {onboardingBusy ? 'Working…' : 'Continue with Facebook'}
              </button>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border, #e5e7eb)', margin: '16px 0' }} />
            <p className={styles.muted}>
              Manual beta setup (operator-assisted trial numbers only, including the Infobip trial sender):
            </p>
            <input
              className={styles.search}
              placeholder="e.g. 2348012345678"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              inputMode="tel"
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhost} disabled={saving || !waNumber.trim()} onClick={requestConnect}>
                Request manual setup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
