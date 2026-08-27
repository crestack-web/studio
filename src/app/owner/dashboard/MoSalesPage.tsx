'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { getSupabase } from '@/lib/supabase';
import styles from './MoSalesPage.module.css';

type View = 'home' | 'inbox' | 'settings';

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
};

type Message = {
  id: string;
  direction: string;
  text: string | null;
  createdAt: string;
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
  if (agentStatus === 'human_active') return { text: 'You are handling', cls: stylesMap.stYou };
  return { text: 'MO handling', cls: stylesMap.stMo };
}

export default function MoSalesPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const businessId = user?.businessId;

  const [view, setView] = useState<View>('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

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
    } catch (e: any) {
      setError(e?.message || 'Could not load MO Sales');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

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

  const connected = overview?.connection?.status === 'active';
  const pending = overview?.connection?.status === 'pending';
  const moOn = Boolean(connected && overview?.connection?.moEnabled);

  if (!businessId) {
    return (
      <div className={styles.wrap}>
        <p className={styles.muted}>Finish setting up your business to use MO Sales.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
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
            <button type="button" className={styles.btnPrimary} onClick={() => setConnectOpen(true)}>
              Connect WhatsApp
            </button>
          )}
          {connected && !moOn && (
            <button type="button" className={styles.btnPrimary} disabled={saving} onClick={() => patchSettings({ moEnabled: true })}>
              Turn MO On
            </button>
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

      <nav className={styles.tabs} aria-label="MO Sales sections">
        {(['home', 'inbox', 'settings'] as View[]).map((v) => (
          <button key={v} type="button" className={view === v ? styles.tabActive : styles.tab} onClick={() => setView(v)}>
            {v === 'home' ? 'Overview' : v === 'inbox' ? 'Conversations' : 'Settings'}
            {v === 'inbox' && (overview?.metrics.needsYou || 0) > 0 ? (
              <span className={styles.badge}>{overview?.metrics.needsYou}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {view === 'home' && (
        <>
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
                <button type="button" className={styles.btnPrimary} onClick={() => setConnectOpen(true)}>Connect WhatsApp</button>
              </>
            )}
            {pending && (
              <>
                <h2 className={styles.cardTitle}>WhatsApp setup in progress</h2>
                <p className={styles.muted}>
                  Number submitted: <strong>{formatPhone(overview?.connection?.sender || '')}</strong>
                </p>
                <p className={styles.muted}>Busmo is finishing the connection. You will see Connected when it is live.</p>
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
                <button type="button" className={styles.btnPrimary} onClick={() => setConnectOpen(true)}>Connect WhatsApp</button>
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
              <p className={styles.muted}>Loading…</p>
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
                    <p className={styles.muted}>Loading messages…</p>
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

      {view === 'settings' && (
        <section className={styles.settings}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>WhatsApp</h2>
            {connected ? (
              <p className={styles.statusLine}>
                <span className={styles.dotGreen} /> Connected · {formatPhone(overview?.connection?.sender || '')}
              </p>
            ) : (
              <button type="button" className={styles.btnPrimary} onClick={() => setConnectOpen(true)}>Connect WhatsApp</button>
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
            <h2>Connect WhatsApp</h2>
            <p className={styles.muted}>
              Enter the WhatsApp number customers already use to message your business (with country code).
            </p>
            <input
              className={styles.search}
              placeholder="e.g. 2348012345678"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              inputMode="tel"
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhost} onClick={() => setConnectOpen(false)}>Cancel</button>
              <button type="button" className={styles.btnPrimary} disabled={saving || !waNumber.trim()} onClick={requestConnect}>
                Submit number
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
