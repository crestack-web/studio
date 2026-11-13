'use client';

import React, { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import styles from './Crew.module.css';

type AgentId = 'tally' | 'bin' | 'ledger' | 'shift' | 'pulse' | 'brief' | 'host' | 'nib';

const CREW: { id: AgentId; name: string; role: string; color: string; live: boolean; blurb: string }[] = [
  { id: 'tally', name: 'Tally', role: 'Finance', color: '#5615ED', live: true, blurb: 'Reads your sales, profit and expenses. Does not invent the numbers.' },
  { id: 'bin', name: 'Bin', role: 'Inventory', color: '#1E9E5A', live: true, blurb: 'Watches stock and prepares a restock list. Nothing is ordered until you approve it.' },
  { id: 'ledger', name: 'Ledger', role: 'Credit', color: '#E0328C', live: true, blurb: 'Shows who still owes you, from your credit records.' },
  { id: 'shift', name: 'Shift', role: 'Workforce', color: '#FFB800', live: false, blurb: 'Staff activity comes in the next crew release.' },
  { id: 'pulse', name: 'Pulse', role: 'Health', color: '#E5484D', live: false, blurb: 'A daily business check, after the first three are trusted.' },
  { id: 'brief', name: 'Brief', role: 'Assistant', color: '#2F4BFF', live: false, blurb: 'Documents and reports, later.' },
  { id: 'host', name: 'Host', role: 'Customers', color: '#8A5BFF', live: false, blurb: 'Guest and customer replies, later.' },
  { id: 'nib', name: 'Nib', role: 'Growth', color: '#17112E', live: false, blurb: 'Coaching, after the crew is doing real work.' },
];

type Brief = {
  businessName?: string;
  tally?: any;
  low?: { name: string; stock: number; reorder: number }[];
  ledger?: { count: number; total: number; people: { name: string; balance: number }[] };
  signals?: { agent: string; title: string; detail: string; status: string }[];
  error?: string;
};

type Msg = { from: 'me' | string; text: string };

function money(n: number) {
  return `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
}

function agent(id: string) {
  return CREW.find((c) => c.id === id);
}

export default function CrewApp() {
  const [tab, setTab] = useState<'home' | 'chat' | 'crew' | 'tasks'>('home');
  const [room, setRoom] = useState<string>('mo');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<Record<string, Msg[]>>({
    mo: [{ from: 'mo', text: "I'm MO. Ask about sales, stock, or who owes you. I'll bring Tally, Bin, or Ledger." }],
  });
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tasks, setTasks] = useState<{ id: string; agent: string; title: string; status: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('busmo_crew_tasks');
      if (raw) setTasks(JSON.parse(raw));
    } catch { /* ignore */ }
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setBrief({ error: 'Sign in on Busmo first, then open Crew.' });
        setLoading(false);
        return;
      }
      const res = await fetch('/api/crew', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setBrief({ error: json.error || 'Could not load your business' });
      else setBrief(json);
      setLoading(false);
    })();
  }, []);

  function saveTasks(next: typeof tasks) {
    setTasks(next);
    try { localStorage.setItem('busmo_crew_tasks', JSON.stringify(next)); } catch { /* ignore */ }
  }

  async function ask(text: string, which = room) {
    const q = text.trim();
    if (!q || busy) return;
    setChat((c) => ({ ...c, [which]: [...(c[which] || []), { from: 'me', text: q }] }));
    setDraft('');
    setBusy(true);
    try {
      const { data } = await getSupabase().auth.getSession();
      const res = await fetch('/api/crew', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room: which, message: q }),
      });
      const json = await res.json().catch(() => ({}));
      const replies: Msg[] = (json.replies || [{ agent: 'mo', text: json.error || 'I could not check the books just now.' }]).map((r: any) => ({
        from: r.agent,
        text: r.text,
      }));
      setChat((c) => ({ ...c, [which]: [...(c[which] || []), ...replies] }));
    } finally {
      setBusy(false);
    }
  }

  function prepareRestock() {
    const id = `task-${Date.now()}`;
    const title = brief?.low?.length
      ? `Restock list: ${brief.low.slice(0, 4).map((p) => p.name).join(', ')}`
      : 'Restock list: nothing is low right now';
    saveTasks([{ id, agent: 'bin', title, status: 'awaiting' }, ...tasks]);
    setTab('tasks');
  }

  const hello = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const t = brief?.tally;

  return (
    <div className={styles.page}>
      <div className={styles.phone}>
        {tab === 'home' && (
          <>
            <div className={styles.top}>
              <div className={styles.hello}>{hello}</div>
              <div className={styles.title}>{brief?.businessName || 'Your crew'}</div>
              <p className={styles.sub}>An AI workforce that reads this business. Not a chatbot guessing.</p>
            </div>
            <div className={styles.scroll}>
              {brief?.error ? <p className={styles.empty}>{brief.error}</p> : null}
              <div className={styles.stats}>
                <div className={styles.stat}><span>Sales today</span><b>{loading ? '…' : money(t?.todaySales)}</b></div>
                <div className={styles.stat}><span>Profit today</span><b>{loading ? '…' : money(t?.todayProfit)}</b></div>
                <div className={styles.stat}><span>Low stock</span><b>{loading ? '…' : brief?.low?.length || 0}</b></div>
                <div className={styles.stat}><span>Customers owe</span><b>{loading ? '…' : money(brief?.ledger?.total)}</b></div>
              </div>
              <div className={styles.crewrow}>
                {CREW.filter((c) => c.live).map((c) => (
                  <button key={c.id} className={styles.chip} onClick={() => { setRoom(c.id); setTab('chat'); }}>
                    <div className={styles.av} style={{ background: c.color }}>{c.name.slice(0, 1)}</div>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
              <div className={styles.sec}><h3>Working now</h3></div>
              {(brief?.signals || []).map((s) => (
                <div key={s.title} className={`${styles.card} ${styles.item}`}>
                  <div className={styles.av} style={{ background: agent(s.agent)?.color || '#5615ED', width: 42, height: 42, flex: 'none' }}>{(agent(s.agent)?.name || 'M').slice(0, 1)}</div>
                  <div>
                    <p>{s.title}</p>
                    <small>{agent(s.agent)?.name} · {s.detail}</small>
                  </div>
                </div>
              ))}
              {!loading && !brief?.signals?.length ? <p className={styles.empty}>No signals yet.</p> : null}
            </div>
          </>
        )}

        {tab === 'chat' && (
          <div className={styles.chat}>
            <div className={styles.bar}>
              <button className={styles.iconBtn} onClick={() => { setRoom('mo'); setTab('home'); }} aria-label="Back">‹</button>
              <div className={styles.whoPill}>
                <span className={styles.dot} style={{ background: room === 'mo' ? '#111' : agent(room)?.color || '#111' }}>
                  {room === 'mo' ? 'M' : (agent(room)?.name || 'C').slice(0, 1)}
                </span>
                {room === 'mo' ? 'Crew' : agent(room)?.name}
              </div>
              <span style={{ width: 36 }} />
            </div>
            <div className={styles.when}>Today {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
            <div className={styles.thread}>
              {(chat[room] || []).map((m, i) => (
                <React.Fragment key={i}>
                  {m.from !== 'me' && room === 'mo' ? (
                    <span className={styles.agentName}>{m.from === 'mo' ? 'MO' : agent(m.from)?.name}</span>
                  ) : null}
                  <div className={m.from === 'me' ? styles.mine : styles.theirs}>{m.text}</div>
                </React.Fragment>
              ))}
              {busy ? <div className={styles.theirs}>Checking the books…</div> : null}
              {(room === 'bin' || room === 'mo') && (brief?.low?.length || 0) > 0 ? (
                <div className={styles.action}>
                  <span className={styles.need}><i /> Action needed</span>
                  <strong>Restock list</strong>
                  <p>{brief?.low?.length} item{(brief?.low?.length || 0) === 1 ? '' : 's'} {brief?.low?.length === 1 ? 'is' : 'are'} under the restock line. Nothing is ordered until you approve it.</p>
                  <button type="button" onClick={prepareRestock}>Continue</button>
                </div>
              ) : null}
            </div>
            <form className={styles.ask} onSubmit={(e) => { e.preventDefault(); void ask(draft, room === 'mo' ? 'crew' : room); }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message" />
              <button type="submit" aria-label="Send">↑</button>
            </form>
          </div>
        )}

        {tab === 'crew' && (
          <div className={styles.scroll}>
            <div className={styles.top} style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div className={styles.title}>The crew</div>
              <p className={styles.sub}>Three are on duty. The rest arrive when their work is real.</p>
            </div>
            {CREW.map((c) => (
              <button
                key={c.id}
                className={`${styles.card} ${styles.bot} ${c.live ? '' : styles.locked}`}
                onClick={() => { if (c.live) { setRoom(c.id); setTab('chat'); } }}
              >
                <div className={styles.av} style={{ background: c.color }}>{c.name.slice(0, 1)}</div>
                <div>
                  <b>{c.name}</b>
                  <small>{c.role.toUpperCase()}</small>
                  <div className={styles.sub}>{c.live ? 'On duty' : 'Coming soon'} · {c.blurb}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'tasks' && (
          <div className={styles.scroll}>
            <div className={styles.top} style={{ paddingLeft: 0, paddingRight: 0 }}>
              <div className={styles.title}>Activity</div>
              <p className={styles.sub}>You approve anything that would change the business. Crew does not spend money or message customers.</p>
            </div>
            <button className={styles.primary} onClick={prepareRestock}>Ask Bin for a restock list</button>
            <div style={{ height: 12 }} />
            {tasks.map((task) => (
              <div key={task.id} className={`${styles.card} ${styles.item}`}>
                <div>
                  <p>{task.title}</p>
                  <small>{agent(task.agent)?.name} · {task.status === 'approved' ? 'Approved. Place it from Inventory or Suppliers. Nothing was ordered automatically.' : 'Awaiting your approval'}</small>
                  {task.status !== 'approved' ? (
                    <button className={styles.primary} style={{ marginTop: 8 }} onClick={() => saveTasks(tasks.map((t) => t.id === task.id ? { ...t, status: 'approved' } : t))}>
                      Approve list
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {(brief?.signals || []).map((s) => (
              <div key={s.title} className={`${styles.card} ${styles.item}`}>
                <div>
                  <p>{s.title}</p>
                  <small>{agent(s.agent)?.name} · {s.status === 'needs_you' ? 'Needs you' : 'Done'} · {s.detail}</small>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab !== 'chat' && (
          <nav className={styles.tabbar}>
            {([['home', 'Home'], ['chat', 'Crew room'], ['crew', 'Crew'], ['tasks', 'Activity']] as const).map(([id, label]) => (
              <button key={id} className={`${styles.tab} ${tab === id ? styles.on : ''}`} onClick={() => { if (id === 'chat') setRoom('mo'); setTab(id); }}>{label}</button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
