'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { getOAuthCallbackUrl } from '@/lib/site-url';
import { CREW_AGENTS, getAgent } from '@/lib/crew/agents';
import styles from './Crew.module.css';

type Tab = 'home' | 'chat' | 'tasks' | 'activity';
type Msg = { from: string; text: string };
type Session = { id: string; room: string; title: string; active?: boolean };
type AuthPhase = 'checking' | 'gate' | 'ready';

function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...common}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...common}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...common}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'chevUp':
      return (
        <svg {...common} width={14} height={14}>
          <path d="M6 14l6-6 6 6" />
        </svg>
      );
    case 'chevDown':
      return (
        <svg {...common} width={14} height={14}>
          <path d="M6 10l6 6 6-6" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...common} width={14} height={14}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    default:
      return null;
  }
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l.0.0 6.2 5.2C39.2 36.3 44 31 44 24c0-1.3-.1-2.5-.4-3.5z" />
    </svg>
  );
}

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

function TypingDots() {
  return (
    <span className={styles.typing} aria-label="Thinking">
      <span />
      <span />
      <span />
    </span>
  );
}

function AuthGate({
  onBusmo,
  onGoogle,
  googleLoading,
  error,
}: {
  onBusmo: () => void;
  onGoogle: () => void;
  googleLoading: boolean;
  error: string | null;
}) {
  const showcase = CREW_AGENTS.filter((a) => a.live);
  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <div className={styles.authAvatars}>
          {showcase.map((a, i) => (
            <img
              key={a.id}
              src={a.avatar}
              alt={a.name}
              className={`${styles.animFloat} ${i === 1 ? styles.animDelay1 : ''} ${i === 2 ? styles.animDelay2 : ''}`}
              style={{ width: i === 1 ? 64 : 48, height: i === 1 ? 64 : 48 }}
            />
          ))}
        </div>
        <h1 className={styles.authTitle}>Busmo Crew</h1>
        <p className={styles.authSub}>
          Your AI teammates for sales, stock and credit. Sign in to connect them to your real books.
        </p>
        {error && <div className={styles.authError}>{error}</div>}
        <button type="button" className={`${styles.authBtn} ${styles.authBtnPrimary}`} onClick={onBusmo}>
          Continue with Busmo
        </button>
        <div className={styles.authDivider}>or</div>
        <button
          type="button"
          className={`${styles.authBtn} ${styles.authBtnGoogle}`}
          onClick={onGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? <span className={`${styles.spinner} ${styles.spinnerSm}`} /> : <GoogleMark />}
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </button>
        <p className={styles.authFoot}>
          Already run your business on Busmo?{' '}
          <a href="/owner">Open dashboard</a>
        </p>
      </div>
    </div>
  );
}

export default function CrewApp() {
  const [authPhase, setAuthPhase] = useState<AuthPhase>('checking');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [botNames, setBotNames] = useState<Record<string, string>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  // Theme + custom bot names
  useEffect(() => {
    try {
      const saved = localStorage.getItem('busmo_crew_theme');
      if (saved === 'dark' || saved === 'light') setTheme(saved);
      else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) setTheme('dark');
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem('busmo_crew_names');
      if (raw) setBotNames(JSON.parse(raw) || {});
    } catch { /* ignore */ }
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('busmo_crew_theme', next); } catch { /* ignore */ }
      return next;
    });
  }

  function displayName(id: string) {
    if (id === 'mo') return 'Crew Manager';
    return botNames[id] || getAgent(id)?.name || id;
  }

  function saveBotName(id: string, name: string) {
    const cleaned = name.trim().slice(0, 24);
    setBotNames((prev) => {
      const next = { ...prev };
      if (!cleaned || cleaned === getAgent(id)?.name) delete next[id];
      else next[id] = cleaned;
      try { localStorage.setItem('busmo_crew_names', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setRenamingId(null);
    setRenameDraft('');
  }

  // Own auth gate for Crew
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (!cancelled) setAuthPhase('gate');
          return;
        }
        const { data } = await getSupabase().auth.getSession();
        if (cancelled) return;
        if (data.session?.access_token) {
          setUserEmail(data.session.user?.email || '');
          setAuthPhase('ready');
        } else {
          setAuthPhase('gate');
        }
      } catch {
        if (!cancelled) setAuthPhase('gate');
      }
    })();
    const { data: sub } = getSupabase().auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setUserEmail(session.user?.email || '');
        setAuthPhase('ready');
      } else {
        setAuthPhase('gate');
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const loadHome = useCallback(async () => {
    if (authPhase !== 'ready') return;
    setError(null);
    setLoading(true);
    try {
      const t = await token();
      if (!t) {
        setAuthPhase('gate');
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
  }, [token, authPhase]);

  useEffect(() => {
    if (authPhase === 'ready') loadHome();
  }, [authPhase, loadHome]);

  async function handleGoogle() {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      if (!isSupabaseConfigured()) throw new Error('Authentication is not configured');
      const redirectTo = getOAuthCallbackUrl('/crew');
      if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/i.test(redirectTo)) {
        throw new Error(
          'Google sign-in is misconfigured (redirect points to localhost). Set NEXT_PUBLIC_APP_URL to your live domain.'
        );
      }
      const { error: oauthError } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
          queryParams: { prompt: 'select_account', access_type: 'online' },
          scopes: 'openid email profile',
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  function handleBusmo() {
    // Continue with existing Busmo account — go through owner login, then return to crew
    const next = encodeURIComponent('/crew');
    window.location.href = `/welcome?next=${next}`;
  }

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
          ? {
              ...s,
              title:
                s.title === 'New chat' || s.title === 'Crew chat'
                  ? sessionTitle(whichRoom, q)
                  : s.title,
              room: whichRoom,
            }
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
      { id: sid, room: id, title: displayName(id), active: true },
      ...prev.map((s) => ({ ...s, active: false })),
    ]);
    setTab('chat');
    setSidebarOpen(false);
  }

  function goTab(id: Tab) {
    setTab(id);
    setSidebarOpen(false);
  }

  if (authPhase === 'checking') {
    return (
      <div className={styles.authShell} data-theme={theme} style={{ background: theme === 'dark' ? '#0b0f14' : undefined, color: theme === 'dark' ? '#f1f5f9' : undefined }}>
        <div className={styles.loadingCenter}>
          <div className={styles.authAvatars}>
            {CREW_AGENTS.filter((a) => a.live).map((a, i) => (
              <img
                key={a.id}
                src={a.avatar}
                alt=""
                className={styles.animBob}
                style={{ animationDelay: `${i * 0.15}s`, width: 48, height: 48 }}
              />
            ))}
          </div>
          <span className={styles.spinner} />
          <span>Waking the crew…</span>
        </div>
      </div>
    );
  }

  if (authPhase === 'gate') {
    return (
      <div data-theme={theme} style={{ minHeight: '100dvh', background: theme === 'dark' ? '#0b0f14' : '#f7f8fa' }}>
      <AuthGate
        onBusmo={handleBusmo}
        onGoogle={handleGoogle}
        googleLoading={googleLoading}
        error={authError}
      />
      </div>
    );
  }

  const liveAgents = CREW_AGENTS.filter((a) => a.live);
  const comingAgents = CREW_AGENTS.filter((a) => !a.live);
  const roomAgent = room === 'mo' ? null : getAgent(room);
  const name = brief?.businessName || 'your business';
  const chatTitle = room === 'mo' ? 'Crew' : displayName(room);
  const chatSub =
    room === 'mo' ? 'Manager · routes Tally, Bin, Ledger' : roomAgent?.role || '';
  const emailShort =
    userEmail.length > 18 ? userEmail.slice(0, 16) + '…' : userEmail || 'Signed in';

  return (
    <div className={styles.shell} data-theme={theme}>
      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayOpen : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sideHead}>
          <a className={styles.headIcon} href="/owner" title="Settings">
            <Icon name="settings" />
          </a>
          <a className={styles.headIcon} href="/owner" title="Notifications">
            <Icon name="bell" />
          </a>
          <button type="button" className={styles.themeBtn} onClick={toggleTheme} aria-label="Toggle theme" title="Theme">
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <span className={styles.userChip} title={userEmail}>
            {emailShort}
          </span>
          <a className={styles.headIcon} href="/owner" title="Dashboard">
            <Icon name="arrow" />
          </a>
          <button
            type="button"
            className={`${styles.headIcon} ${styles.closeSide}`}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className={styles.sideScroll}>
          <button
            type="button"
            className={`${styles.navItem} ${tab === 'home' ? styles.navItemAct : ''}`}
            onClick={() => goTab('home')}
          >
            <span className={styles.navIcon}>
              <Icon name="home" />
            </span>
            Home
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === 'tasks' ? styles.navItemAct : ''}`}
            onClick={() => goTab('tasks')}
          >
            <span className={styles.navIcon}>
              <Icon name="tasks" />
            </span>
            Tasks
          </button>
          <button
            type="button"
            className={`${styles.navItem} ${tab === 'activity' ? styles.navItemAct : ''}`}
            onClick={() => goTab('activity')}
          >
            <span className={styles.navIcon}>
              <Icon name="activity" />
            </span>
            Activity
          </button>

          <div className={styles.section}>
            <button type="button" className={styles.sectionHead} onClick={() => setTeammatesOpen((v) => !v)}>
              <span className={styles.sectionTitle}>Teammates</span>
              <span className={styles.chev}>
                <Icon name={teammatesOpen ? 'chevUp' : 'chevDown'} />
              </span>
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
                  <div key={a.id}>
                    <button
                      type="button"
                      className={`${styles.agentRow} ${room === a.id && tab === 'chat' ? styles.agentRowAct : ''}`}
                      onClick={() => openAgent(a.id)}
                    >
                      <img src={a.avatar} alt="" />
                      <div>
                        <strong>{displayName(a.id)}</strong>
                        <span>{a.role}</span>
                      </div>
                      {a.live && <span className={styles.liveDot} title="Live" />}
                    </button>
                    {renamingId === a.id ? (
                      <div className={styles.renameRow} style={{ padding: '0 10px 8px 48px' }}>
                        <input
                          className={styles.renameInput}
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          placeholder={a.name}
                          maxLength={24}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveBotName(a.id, renameDraft);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                        />
                        <button type="button" className={styles.renameBtn} onClick={() => saveBotName(a.id, renameDraft)}>
                          Save
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '0 10px 4px 48px' }}>
                        <button
                          type="button"
                          className={styles.renameBtn}
                          onClick={() => {
                            setRenamingId(a.id);
                            setRenameDraft(botNames[a.id] || a.name);
                          }}
                        >
                          Rename
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className={styles.section}>
            <button type="button" className={styles.sectionHead} onClick={() => setSessionsOpen((v) => !v)}>
              <span className={styles.sectionTitle}>Sessions</span>
              <span className={styles.chev}>
                <Icon name="menu" />
              </span>
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
            <Icon name="search" />
          </button>
          <button type="button" className={styles.newBtn} onClick={newChat}>
            <Icon name="plus" /> New
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
            <Icon name="menu" />
          </button>
          <strong style={{ flex: 1, fontSize: 15 }}>{tab === 'chat' ? chatTitle : 'Busmo Crew'}</strong>
          <button type="button" className={styles.menuBtn} onClick={newChat} aria-label="New chat">
            <Icon name="plus" />
          </button>
        </div>

        <main className={styles.main}>
          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <div className={styles.loadingCenter}>
              <div className={styles.authAvatars}>
                {liveAgents.map((a, i) => (
                  <img
                    key={a.id}
                    src={a.avatar}
                    alt=""
                    className={styles.animFloat}
                    style={{ animationDelay: `${i * 0.12}s`, width: 44, height: 44 }}
                  />
                ))}
              </div>
              <span className={styles.spinner} />
              <span>Loading your books…</span>
              <div style={{ width: '100%', maxWidth: 360, marginTop: 8 }}>
                <div className={`${styles.skeleton} ${styles.skelCard}`} />
                <div className={`${styles.skeleton} ${styles.skelLine}`} style={{ width: '80%' }} />
                <div className={`${styles.skeleton} ${styles.skelLine}`} style={{ width: '60%' }} />
              </div>
            </div>
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
                <button type="button" className={styles.chip} onClick={() => openAgent('tally')}>
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
                    <img src={a.avatar} alt={displayName(a.id)} />
                    <strong>{displayName(a.id)}</strong>
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
                          {a ? displayName(a.id) : s.agent} · {s.detail}
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
                    <img src={a.avatar} alt={displayName(a.id)} />
                    <strong>{displayName(a.id)}</strong>
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
                <img src={roomAgent?.avatar || '/crew/tally.png'} alt="" className={styles.animPulse} />
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
                        <img className={styles.msgAvatar} src={ag?.avatar || '/crew/tally.png'} alt="" />
                      )}
                      <div className={`${styles.msgBubble} ${mine ? styles.msgBubbleMe : ''}`}>
                        {!mine && (
                          <span className={styles.agentTag}>
                            {m.from === 'mo' ? 'Crew Manager' : displayName(m.from)}
                          </span>
                        )}
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                {busy && (
                  <div className={styles.msgRow}>
                    <img
                      className={`${styles.msgAvatar} ${styles.animBob}`}
                      src={roomAgent?.avatar || '/crew/tally.png'}
                      alt=""
                    />
                    <div className={styles.msgBubble}>
                      <TypingDots />
                    </div>
                  </div>
                )}
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
                  roomAgent ? `Message ${displayName(room)}…` : 'Ask the crew about sales, stock, credit…'
                }
                disabled={busy}
                aria-label="Message"
              />
              <button
                className={styles.sendBtn}
                type="submit"
                disabled={busy || !draft.trim()}
                aria-label="Send"
              >
                {busy ? <span className={`${styles.spinner} ${styles.spinnerSm}`} style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : <Icon name="arrow" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
