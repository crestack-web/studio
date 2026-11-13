'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { CREW_AGENTS, getAgent } from '@/lib/crew/agents';
import styles from './Crew.module.css';

type Tab = 'home' | 'chat' | 'tasks' | 'activity';
type Msg = { from: string; text: string };

const GREETING: Record<string, string> = {
  mo: "I'm the Crew Manager. Ask about sales, stock, or who owes you — I'll bring Tally, Bin, or Ledger.",
};

function greetingFor(room: string) {
  if (room === 'mo') return GREETING.mo;
  const a = getAgent(room);
  if (!a) return GREETING.mo;
  if (!a.live) return `${a.name} joins in a later phase. Tally, Bin and Ledger are on duty now.`;
  return `I'm ${a.name}. ${a.blurb}`;
}

export default function CrewApp() {
  const [tab, setTab] = useState<Tab>('home');
  const [room, setRoom] = useState<string>('mo');
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Record<string, Msg[]>>({
    mo: [{ from: 'mo', text: GREETING.mo }],
  });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const token = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token || '';
  }, []);

  const loadHome = useCallback(async () => {
    setError(null);
    try {
      const t = await token();
      if (!t) {
        setBrief({ error: 'Sign in on Busmo first, then open Crew.' });
        setLoading(false);
        return;
      }
      const res = await fetch('/api/crew', { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBrief({ error: json.error || 'Could not load your business' });
      } else {
        setBrief(json);
        setTasks(Array.isArray(json.tasks) ? json.tasks : []);
        setActivities(Array.isArray(json.activities) ? json.activities : []);
      }
    } catch (e: any) {
      setBrief({ error: e?.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  function newChat() {
    setRoom('mo');
    setTab('chat');
    setChat((c) => ({
      ...c,
      mo: [{ from: 'mo', text: GREETING.mo }],
    }));
    setDraft('');
    setSidebarOpen(false);
  }

  async function ask(text: string, which = room) {
    const q = text.trim();
    if (!q || busy) return;
    setChat((c) => ({ ...c, [which]: [...(c[which] || []), { from: 'me', text: q }] }));
    setDraft('');
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch('/api/crew', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${t}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'chat', room: which, message: q }),
      });
      const json = await res.json().catch(() => ({}));
      const replies: Msg[] = (json.replies || [
        { agent: 'mo', text: json.error || 'I could not check the books just now.' },
      ]).map((r: any) => ({ from: r.agent, text: r.text }));
      setChat((c) => ({ ...c, [which]: [...(c[which] || []), ...replies] }));
      if (/restock|follow|debt|prepare|draft/i.test(q)) {
        const home = await fetch('/api/crew?view=tasks', {
          headers: { Authorization: `Bearer ${t}` },
        })
          .then((r) => r.json())
          .catch(() => ({}));
        if (Array.isArray(home.tasks)) setTasks(home.tasks);
      }
    } finally {
      setBusy(false);
    }
  }

  async function setTaskStatus(taskId: string, status: string) {
    const t = await token();
    const res = await fetch('/api/crew', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'update_task', taskId, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.task) {
      setTasks((prev) => prev.map((x) => (x.id === taskId ? json.task : x)));
    } else {
      setError(json.error || 'Could not update task');
    }
  }

  function openAgent(id: string) {
    setRoom(id);
    setChat((c) => {
      if (c[id]?.length) return c;
      return { ...c, [id]: [{ from: id, text: greetingFor(id) }] };
    });
    setTab('chat');
    setSidebarOpen(false);
  }

  function goTab(id: Tab) {
    setTab(id);
    setSidebarOpen(false);
  }

  const liveAgents = CREW_AGENTS.filter((a) => a.live);
  const comingAgents = CREW_AGENTS.filter((a) => !a.live);
  const roomAgent = room === 'mo' ? null : getAgent(room);
  const name = brief?.businessName || 'your business';
  const chatTitle = room === 'mo' ? 'Crew' : roomAgent?.name || 'Crew';
  const chatSub =
    room === 'mo' ? 'Manager · routes Tally, Bin, Ledger' : roomAgent?.role || '';

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sideTop}>
          <div className={styles.brandRow}>
            <a className={styles.brand} href="/owner">
              Busmo
            </a>
          </div>
          <button type="button" className={styles.newChat} onClick={newChat}>
            + New chat
          </button>
        </div>

        <div className={styles.sideNav}>
          {(
            [
              ['home', 'Home'],
              ['chat', 'Chat'],
              ['tasks', 'Tasks'],
              ['activity', 'Activity'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${styles.sideNavBtn} ${tab === id ? styles.sideNavBtnAct : ''}`}
              onClick={() => goTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.sideSection}>Crew</div>
        <div className={styles.agentList}>
          <button
            type="button"
            className={`${styles.agentRow} ${room === 'mo' && tab === 'chat' ? styles.agentRowAct : ''}`}
            onClick={() => openAgent('mo')}
          >
            <img src="/crew/tally.png" alt="" />
            <div>
              <strong>Crew Manager</strong>
              <span>All agents</span>
            </div>
          </button>
          {CREW_AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`${styles.agentRow} ${room === a.id && tab === 'chat' ? styles.agentRowAct : ''}`}
              onClick={() => openAgent(a.id)}
            >
              <img src={a.avatar} alt="" />
              <div>
                <strong>{a.name}</strong>
                <span>{a.role}</span>
              </div>
              {a.live && <span className={styles.liveDot} title="Live" />}
            </button>
          ))}
        </div>

        <div className={styles.sideFoot}>
          <a className={styles.dashLink} href="/owner">
            ← Dashboard
          </a>
        </div>
      </aside>

      <div className={styles.stage}>
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <strong style={{ flex: 1, fontSize: 15 }}>{tab === 'chat' ? chatTitle : 'Busmo Crew'}</strong>
          <button type="button" className={styles.menuBtn} onClick={newChat} aria-label="New chat">
            +
          </button>
        </div>

        <main className={styles.main}>
          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <p className={styles.empty}>Loading your crew…</p>
          ) : brief?.error ? (
            <div className={styles.error}>{brief.error}</div>
          ) : null}

          {tab === 'home' && !loading && !brief?.error && (
            <>
              <div className={styles.hero}>
                <img src="/crew/tally.png" alt="" className={styles.heroAvatar} />
                <h1 className={styles.heroTitle}>Your crew for {name}</h1>
                <p className={styles.heroSub}>
                  A team that never clocks out — reading your real books, not the internet.
                </p>
              </div>

              <div className={styles.chips}>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => {
                    openAgent('tally');
                    setTimeout(() => ask('How much did we make today?', 'tally'), 0);
                  }}
                >
                  Today&apos;s sales
                </button>
                <button type="button" className={styles.chip} onClick={() => openAgent('bin')}>
                  Stock check
                </button>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => {
                    openAgent('ledger');
                    setTimeout(() => ask('Who owes me?', 'ledger'), 0);
                  }}
                >
                  Who owes me?
                </button>
              </div>

              <div className={styles.sectionLabel}>On duty</div>
              <div className={styles.grid}>
                {liveAgents.map((a) => (
                  <button key={a.id} type="button" className={styles.agentCard} onClick={() => openAgent(a.id)}>
                    <img src={a.avatar} alt={a.name} />
                    <strong>{a.name}</strong>
                    <span>{a.role}</span>
                    <span className={styles.badge}>Live</span>
                  </button>
                ))}
              </div>

              <div className={styles.sectionLabel}>Signals</div>
              <div className={styles.signalList}>
                {(brief?.signals || []).map((s: any, i: number) => {
                  const a = getAgent(s.agent);
                  return (
                    <button key={i} type="button" className={styles.signal} onClick={() => openAgent(s.agent)}>
                      <img src={a?.avatar || '/crew/tally.png'} alt="" />
                      <div>
                        <strong>{s.title}</strong>
                        <small>
                          {a?.name} · {s.detail}
                        </small>
                      </div>
                    </button>
                  );
                })}
                {!(brief?.signals || []).length && (
                  <p className={styles.empty}>No signals yet — record a sale or add stock levels.</p>
                )}
              </div>

              <div className={styles.sectionLabel}>Coming online</div>
              <div className={styles.grid}>
                {comingAgents.map((a) => (
                  <button key={a.id} type="button" className={styles.agentCard} onClick={() => openAgent(a.id)}>
                    <img src={a.avatar} alt={a.name} />
                    <strong>{a.name}</strong>
                    <span>{a.role}</span>
                    <span className={`${styles.badge} ${styles.badgeSoon}`}>Soon</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'chat' && (
            <>
              <div className={styles.chatHeader}>
                <img
                  src={roomAgent?.avatar || '/crew/tally.png'}
                  alt=""
                />
                <div>
                  <strong>{chatTitle}</strong>
                  <span>{chatSub}</span>
                </div>
              </div>

              <div className={styles.chatWrap}>
                {(chat[room] || []).map((m, i) => {
                  const mine = m.from === 'me';
                  const ag = getAgent(m.from);
                  return (
                    <div key={i} className={`${styles.msgRow} ${mine ? styles.msgRowMe : ''}`}>
                      {!mine && (
                        <img
                          className={styles.msgAvatar}
                          src={ag?.avatar || '/crew/tally.png'}
                          alt=""
                        />
                      )}
                      <div className={`${styles.msgBubble} ${mine ? styles.msgBubbleMe : ''}`}>
                        {!mine && (
                          <span className={styles.agentTag}>
                            {m.from === 'mo' ? 'Crew Manager' : ag?.name || m.from}
                          </span>
                        )}
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(room === 'bin' || room === 'mo') &&
                (brief?.signals || []).some((s: any) => s.agent === 'bin' && s.status === 'alert') && (
                  <div className={styles.chips}>
                    <button
                      type="button"
                      className={styles.chip}
                      onClick={() => ask('Prepare a restock list', 'bin')}
                    >
                      Ask Bin to draft restock
                    </button>
                  </div>
                )}
            </>
          )}

          {tab === 'tasks' && (
            <>
              <div className={styles.hero} style={{ paddingTop: 8 }}>
                <h1 className={styles.heroTitle} style={{ fontSize: 20 }}>
                  Tasks
                </h1>
                <p className={styles.heroSub}>Drafts need your approval before anything changes.</p>
              </div>
              {tasks.length === 0 ? (
                <p className={styles.empty}>No tasks yet. Ask Bin to prepare a restock list.</p>
              ) : (
                tasks.map((t) => {
                  const a = getAgent(t.agent_id);
                  return (
                    <div key={t.id} className={styles.taskCard}>
                      <strong>{t.title}</strong>
                      <div className={styles.meta}>
                        {a?.name || t.agent_id} · {t.status}
                      </div>
                      {(t.status === 'awaiting' || t.status === 'draft') && (
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={`${styles.btnSm} ${styles.btnPrimary}`}
                            onClick={() => setTaskStatus(t.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={`${styles.btnSm} ${styles.btnGhost}`}
                            onClick={() => setTaskStatus(t.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'activity' && (
            <>
              <div className={styles.hero} style={{ paddingTop: 8 }}>
                <h1 className={styles.heroTitle} style={{ fontSize: 20 }}>
                  Activity
                </h1>
                <p className={styles.heroSub}>What the crew has been doing — nothing silent.</p>
              </div>
              {activities.length === 0 ? (
                <p className={styles.empty}>No activity logged yet.</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className={styles.actCard}>
                    <strong>{a.summary}</strong>
                    <div className={styles.meta}>
                      {getAgent(a.agent_id)?.name || a.agent_id || 'Crew'} · {a.type} ·{' '}
                      {a.created_at ? new Date(a.created_at).toLocaleString() : ''}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </main>

        {(tab === 'chat' || tab === 'home') && (
          <div className={styles.composer}>
            <form
              className={styles.composerInner}
              onSubmit={(e) => {
                e.preventDefault();
                if (tab !== 'chat') setTab('chat');
                ask(draft, tab === 'chat' ? room : 'mo');
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  roomAgent ? `Message ${roomAgent.name}…` : 'Ask the crew about sales, stock, credit…'
                }
                disabled={busy}
                aria-label="Message"
              />
              <button className={styles.sendBtn} type="submit" disabled={busy || !draft.trim()} aria-label="Send">
                ↑
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
