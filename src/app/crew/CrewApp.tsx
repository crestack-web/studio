'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { CREW_AGENTS, getAgent } from '@/lib/crew/agents';
import styles from './Crew.module.css';

type Tab = 'home' | 'chat' | 'tasks' | 'activity';
type Msg = { from: string; text: string };
type Session = { id: string; room: string; title: string; active?: boolean };

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

function sessionTitle(room: string, firstUserMsg?: string) {
  if (firstUserMsg) return firstUserMsg.slice(0, 36) + (firstUserMsg.length > 36 ? '…' : '');
  if (room === 'mo') return 'Crew chat';
  return getAgent(room)?.name || 'Chat';
}

export default function CrewApp() {
  const [tab, setTab] = useState<Tab>('home');
  const [room, setRoom] = useState<string>('mo');
  const [sessionId, setSessionId] = useState<string>('s-home');
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Record<string, Msg[]>>({
    's-home': [{ from: 'mo', text: GREETING.mo }],
  });
  const [sessions, setSessions] = useState<Session[]>([
    { id: 's-home', room: 'mo', title: 'Crew chat', active: true },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teammatesOpen, setTeammatesOpen] = useState(true);
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  const token = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    const email = data.session?.user?.email || '';
    if (email) setUserEmail(email);
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
    const id = `s-${Date.now()}`;
    setSessionId(id);
    setRoom('mo');
    setTab('chat');
    setChat((c) => ({
      ...c,
      [id]: [{ from: 'mo', text: GREETING.mo }],
    }));
    setSessions((prev) => [
      { id, room: 'mo', title: 'New chat', active: true },
      ...prev.map((s) => ({ ...s, active: false })),
    ]);
    setDraft('');
    setSidebarOpen(false);
  }

  function openSession(s: Session) {
    setSessionId(s.id);
    setRoom(s.room);
    setTab('chat');
    setSessions((prev) => prev.map((x) => ({ ...x, active: x.id === s.id })));
    setSidebarOpen(false);
  }

  async function ask(text: string, whichRoom = room) {
    const q = text.trim();
    if (!q || busy) return;
    const sid = sessionId;
    setChat((c) => ({ ...c, [sid]: [...(c[sid] || []), { from: 'me', text: q }] }));
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sid
          ? { ...s, title: s.title === 'New chat' || s.title === 'Crew chat' ? sessionTitle(whichRoom, q) : s.title, room: whichRoom }
          : s
      )
    );
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
        body: JSON.stringify({ action: 'chat', room: whichRoom, message: q }),
      });
      const json = await res.json().catch(() => ({}));
      const replies: Msg[] = (json.replies || [
        { agent: 'mo', text: json.error || 'I could not check the books just now.' },
      ]).map((r: any) => ({ from: r.agent, text: r.text }));
      setChat((c) => ({ ...c, [sid]: [...(c[sid] || []), ...replies] }));
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
    const sid = `s-${id}-${Date.now()}`;
    setSessionId(sid);
    setRoom(id);
    setChat((c) => ({
      ...c,
      [sid]: [{ from: id, text: greetingFor(id) }],
    }));
    setSessions((prev) => [
      { id: sid, room: id, title: getAgent(id)?.name || id, active: true },
      ...prev.map((s) => ({ ...s, active: false })),
    ]);
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
  const emailShort =
    userEmail.length > 18 ? userEmail.slice(0, 16) + '…' : userEmail || 'Signed in';

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sideHead}>
          <a className={styles.headIcon} href="/owner" title="Settings">
            ⚙
          </a>
          <a className={styles.headIcon} href="/owner" title="Notifications">
            🔔
          </a>
          <span className={styles.userChip} title={userEmail}>
            {emailShort}
          </span>
          <a className={styles.headIcon} href="/owner" title="Dashboard">
            →
          </a>
        </div>

        <div className={styles.sideScroll}>
          <button
            type="button"
            className={`${styles.navItem} ${tab === 'home' ? styles.navItemAct : ''}`}
            onClick={() => goTab('home')}
          >
            <span className={styles.navIcon}>⌂</span>
            Home
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === 'tasks' ? styles.navItemAct : ''}`}
            onClick={() => goTab('tasks')}
          >
            <span className={styles.navIcon}>☑</span>
            Tasks
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === 'activity' ? styles.navItemAct : ''}`}
            onClick={() => goTab('activity')}
          >
            <span className={styles.navIcon}>◷</span>
            Activity
          </button>

          <div className={styles.section}>
            <button
              type="button"
              className={styles.sectionHead}
              onClick={() => setTeammatesOpen((v) => !v)}
            >
              <span className={styles.sectionTitle}>Teammates</span>
              <span className={styles.chev}>{teammatesOpen ? '⌃' : '⌄'}</span>
            </button>

            {teammatesOpen && (
              <>
                <div className={styles.teammateCard}>
                  <h4>Your AI crew</h4>
                  <p>Persistent agents that work from your real books — nothing is invented.</p>
                  <button type="button" className={styles.teammateBtn} onClick={newChat}>
                    Start with Crew Manager
                  </button>
                </div>

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
              </>
            )}
          </div>

          <div className={styles.section}>
            <button
              type="button"
              className={styles.sectionHead}
              onClick={() => setSessionsOpen((v) => !v)}
            >
              <span className={styles.sectionTitle}>Sessions</span>
              <span className={styles.chev}>{sessionsOpen ? '☰' : '☰'}</span>
            </button>
            {sessionsOpen &&
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles.sessionRow} ${s.active && tab === 'chat' ? styles.sessionRowAct : ''}`}
                  onClick={() => openSession(s)}
                >
                  <span className={`${styles.sessionDot} ${s.active ? '' : styles.sessionDotIdle}`} />
                  {s.title}
                </button>
              ))}
          </div>
        </div>

        <div className={styles.sideFoot}>
          <button type="button" className={styles.searchBtn} onClick={() => goTab('home')} aria-label="Search">
            ⌕
          </button>
          <button type="button" className={styles.newBtn} onClick={newChat}>
            + New
          </button>
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
                  }}
                >
                  Talk to Tally
                </button>
                <button type="button" className={styles.chip} onClick={() => openAgent('bin')}>
                  Stock check
                </button>
                <button type="button" className={styles.chip} onClick={() => openAgent('ledger')}>
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
                <img src={roomAgent?.avatar || '/crew/tally.png'} alt="" />
                <div>
                  <strong>{chatTitle}</strong>
                  <span>{chatSub}</span>
                </div>
              </div>

              <div className={styles.chatWrap}>
                {(chat[sessionId] || []).map((m, i) => {
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
                if (tab !== 'chat') {
                  newChat();
                  setTimeout(() => ask(draft, 'mo'), 0);
                  return;
                }
                ask(draft, room);
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
