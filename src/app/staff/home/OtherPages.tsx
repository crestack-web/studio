import React, { useState, useMemo } from 'react';
import type { SaleRecord, PageId } from './types';
import { PRODUCTS, INITIAL_HISTORY, ATTENDANCE_DAYS, SHIFT_LOG } from './data';
import { LockedPage } from './shared';
import { useLiveClock } from './hooks';

/* ═══════════════════════════════════════
   INVENTORY PAGE
═══════════════════════════════════════ */
interface InventoryPageProps { hasAccess: boolean; }

export const InventoryPage: React.FC<InventoryPageProps> = ({ hasAccess }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(
    () => PRODUCTS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );
  const totalUnits = PRODUCTS.reduce((s, p) => s + p.stock, 0);
  const estValue = PRODUCTS.reduce((s, p) => s + p.price * p.stock, 0);
  const lowCount = PRODUCTS.filter((p) => p.low).length;

  if (!hasAccess) return <LockedPage pageName="Inventory"/>;

  return (
    <div className="pg act full" id="pg-inventory">
      <div className="phd">
        <h2>Inventory</h2>
        <p>View stock levels. Contact your owner to make changes.</p>
      </div>

      <div className="mg" style={{ marginBottom: '14px' }}>
        <div className="mc"><div className="mlbl">Total Products</div><div className="mv">{PRODUCTS.length}</div></div>
        <div className="mc"><div className="mlbl">Low Stock</div><div className="mv neg">{lowCount}</div><span className="md dd">Action needed</span></div>
        <div className="mc"><div className="mlbl">Total Units</div><div className="mv">{totalUnits}</div></div>
        <div className="mc"><div className="mlbl">Est. Value</div><div className="mv">₦{(estValue / 1000).toFixed(0)}K</div></div>
      </div>

      {/* Low stock alerts */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="chd">
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--red-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            Low Stock Alerts
          </div>
          <button className="btn bxs bamb">Alert Owner</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', background:'var(--red-bg)', border:'1px solid var(--red)', borderRadius:'var(--rsm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style={{ fontSize:'.77rem', fontWeight:600, color:'var(--red)', flex:1 }}>Bottled Water — Only 4 units remaining</span>
            <span className="pill r">CRITICAL</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 11px', background:'var(--amber-bg)', border:'1px solid var(--amber)', borderRadius:'var(--rsm)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            <span style={{ fontSize:'.77rem', fontWeight:600, color:'var(--amber)', flex:1 }}>Sabuni — 7 units left, running low</span>
            <span className="pill a">LOW</span>
          </div>
        </div>
      </div>

      <div className="srch">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}/>
      </div>

      <div className="inv-g">
        {filtered.map((p) => {
          const pct = Math.min(100, Math.round((p.stock / 50) * 100));
          const barCls = p.stock <= 5 ? 'low-b' : p.stock <= 15 ? 'med' : '';
          return (
            <div key={p.id} className="inv-card">
              <div className="inv-em">{p.emoji}</div>
              <div className="inv-nm">{p.name}</div>
              <div className="inv-pr">₦{p.price.toLocaleString()}</div>
              <div className="inv-stock">
                <span className="inv-stk-lbl">Stock</span>
                <span className={`inv-stk-val${p.low ? ' low' : ''}`}>{p.stock} units{p.low ? ' ⚠️' : ''}</span>
              </div>
              <div className="stock-bar-w">
                <div className={`stock-bar ${barCls}`} style={{ width: `${pct}%` }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   HISTORY PAGE
═══════════════════════════════════════ */
interface HistoryPageProps {
  hasAccess: boolean;
  sessionSales: SaleRecord[];
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ hasAccess, sessionSales }) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const allRecords = [...sessionSales, ...INITIAL_HISTORY];

  if (!hasAccess) return <LockedPage pageName="Sale History"/>;

  const payPill = (pay: string) =>
    pay === 'Cash' ? 'g' : pay === 'Transfer' ? 'b' : 'a';

  return (
    <div className="pg act full" id="pg-history">
      <div className="phd">
        <h2>Sale History</h2>
        <p>All sales recorded during your shifts.</p>
      </div>

      <div className="hist-filters">
        {(['all','today','week','month'] as const).map((f) => (
          <button
            key={f}
            className={`hf-chip${filter === f ? ' act' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Time' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div className="hist-sum">
        <div className="hs-tile">
          <div className="hs-val">₦187,400</div>
          <div className="hs-lbl">Total Revenue</div>
        </div>
        <div className="hs-tile">
          <div className="hs-val">234</div>
          <div className="hs-lbl">Transactions</div>
        </div>
        <div className="hs-tile">
          <div className="hs-val">₦801</div>
          <div className="hs-lbl">Avg. per Sale</div>
        </div>
      </div>

      <div className="card">
        <div className="chd">
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--blue-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            Transaction Log
          </div>
        </div>
        <div className="tbl-w">
          <table className="tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allRecords.map((r, i) => (
                <tr key={i}>
                  <td>{r.time}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.items}
                  </td>
                  <td><strong>₦{r.amount.toLocaleString()}</strong></td>
                  <td><span className={`pill ${payPill(r.payment)}`}>{r.payment}</span></td>
                  <td><span className="pill g">Confirmed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   ATTENDANCE PAGE
═══════════════════════════════════════ */
interface AttendancePageProps { hasAccess: boolean; }

export const AttendancePage: React.FC<AttendancePageProps> = ({ hasAccess }) => {
  const clock = useLiveClock();
  const [clockedIn, setClockedIn] = useState(true);

  if (!hasAccess) return <LockedPage pageName="Attendance"/>;

  return (
    <div className="pg act full" id="pg-attendance">
      <div className="shift-hero">
        <div className="shl">
          <h2>Shift & Attendance</h2>
          <p>Track your daily clock-ins, clock-outs and shift hours.</p>
        </div>
        <div className="shr">
          <div className="big-time">{clock}</div>
          <div className="shr-lbl">Current Time</div>
        </div>
      </div>

      <div className="shift-actions">
        <div
          className={`shift-act-btn in${clockedIn ? ' active' : ''}`}
          onClick={() => setClockedIn(true)}
          role="button" tabIndex={0}
        >
          <div className="sa-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div className="sa-txt">
            <h4>Clock In</h4>
            <p>{clockedIn ? 'Clocked in at 08:14 AM' : 'Tap to start your shift'}</p>
          </div>
        </div>
        <div
          className={`shift-act-btn out${!clockedIn ? ' active' : ''}`}
          onClick={() => setClockedIn(false)}
          role="button" tabIndex={0}
        >
          <div className="sa-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div className="sa-txt">
            <h4>Clock Out</h4>
            <p>{!clockedIn ? 'Clocked out' : 'Tap to end your shift'}</p>
          </div>
        </div>
      </div>

      {/* Monthly attendance */}
      <div className="card" style={{ marginBottom: '14px' }}>
        <div className="chd" style={{ marginBottom: '12px' }}>
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--brand-lt)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            This Month's Attendance
          </div>
          <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>February 2026</span>
        </div>
        <div className="atd-g">
          {ATTENDANCE_DAYS.map((d) => (
            <div key={d.day} className={`atd-day ${d.status}`} title={d.status}>
              {d.day}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[
            { cls: 'present', label: 'Present' },
            { cls: 'late',    label: 'Late'    },
            { cls: 'absent',  label: 'Absent'  },
            { cls: 'off',     label: 'Day off' },
          ].map(({ cls, label }) => (
            <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '.68rem', color: 'var(--t2)' }}>
              <div className={`atd-day ${cls}`} style={{ width: '14px', height: '14px', fontSize: '0', borderRadius: '4px' }}/>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Shift log */}
      <div className="card">
        <div className="chd">
          <div className="cttl">
            <div className="cic" style={{ background: 'var(--blue-bg)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            Shift Log
          </div>
        </div>
        <div className="shift-log">
          {SHIFT_LOG.map((entry, i) => (
            <div key={i} className="sl-row">
              <div className="sl-date">
                <div className="sl-d">{entry.date}</div>
                <div className="sl-h">{entry.hours}</div>
              </div>
              <div className="sl-times">
                {entry.clockIn} → {entry.clockOut}
              </div>
              <span className={`pill ${entry.status === 'complete' ? 'g' : entry.status === 'late' ? 'a' : 'r'}`}>
                {entry.status === 'complete' ? 'Complete' : entry.status === 'late' ? 'Late' : 'Absent'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MESSAGES PAGE
═══════════════════════════════════════ */
interface MessagesPageProps { hasAccess: boolean; }

type ConvId = 'owner' | 'team';

interface ChatMessage {
  type: 'sent' | 'recv';
  text: string;
  timestamp: number;
  fromOwner?: boolean;
}

interface Conversations {
  owner: ChatMessage[];
  team: ChatMessage[];
}

const getInitialConvos = (): Conversations => {
  // Try to load from localStorage first
  try {
    const saved = localStorage.getItem('staff-chat-owner');
    if (saved) {
      const ownerMessages = JSON.parse(saved);
      if (Array.isArray(ownerMessages) && ownerMessages.length > 0) {
        return {
          owner: ownerMessages,
          team: [
            { type: 'recv', text: "Ibrahim: Can anyone cover Saturday morning shift?", timestamp: Date.now() - 3600000 },
            { type: 'recv', text: "Ibrahim: I'll cover Saturday if someone covers my Wednesday afternoon.", timestamp: Date.now() - 3500000 },
            { type: 'sent', text: "I can do Wednesday afternoon, Ibrahim!", timestamp: Date.now() - 3400000 },
          ],
        };
      }
    }
  } catch (e) {
    console.error('Failed to load chat from localStorage');
  }

  return {
    owner: [
      { type: 'recv', text: "Hey Fatima! Great job yesterday — you hit your target. 🎉", timestamp: Date.now() - 600000 },
      { type: 'recv', text: "Reminder: Bottled Water is running low. Alert me when it gets below 3 units.", timestamp: Date.now() - 540000 },
      { type: 'sent', text: "Good morning! I'll keep an eye on the water stock. Thanks!", timestamp: Date.now() - 480000 },
      { type: 'recv', text: "Also, the new price for Sabuni is ₦850 from today. Updated in the system.", timestamp: Date.now() - 420000 },
    ],
    team: [
      { type: 'recv', text: "Ibrahim: Can anyone cover Saturday morning shift?", timestamp: Date.now() - 3600000 },
      { type: 'recv', text: "Ibrahim: I'll cover Saturday if someone covers my Wednesday afternoon.", timestamp: Date.now() - 3500000 },
      { type: 'sent', text: "I can do Wednesday afternoon, Ibrahim!", timestamp: Date.now() - 3400000 },
    ],
  };
};

const OWNER_REPLIES = ["Got it, thanks!", "I'll sort that out.", "Good work today!", "Keep it up 💪", "Noted, I'll check."];

export const MessagesPage: React.FC<MessagesPageProps> = ({ hasAccess }) => {
  const [convId, setConvId] = useState<ConvId>('owner');
  const [convos, setConvos] = useState<Conversations>(getInitialConvos);
  const [draft, setDraft] = useState('');
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // Save to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('staff-chat-owner', JSON.stringify(convos.owner));
      // Trigger custom event for owner chat to listen to
      window.dispatchEvent(new CustomEvent('staff-chat-update', { detail: { convos } }));
    } catch (e) {
      console.error('Failed to save chat to localStorage');
    }
  }, [convos]);

  // Listen for messages from owner
  useEffect(() => {
    const handleOwnerMessage = (event: any) => {
      const { staffId, message } = event.detail;
      if (staffId === 'current-staff' && message) {
        setConvos((prev) => ({
          ...prev,
          owner: [...prev.owner, { type: 'recv', text: message, timestamp: Date.now(), fromOwner: true }],
        }));
      }
    };

    window.addEventListener('owner-chat-message', handleOwnerMessage);
    return () => window.removeEventListener('owner-chat-message', handleOwnerMessage);
  }, []);

  const sendMsg = () => {
    if (!draft.trim()) return;
    
    const newMessage: ChatMessage = {
      type: 'sent',
      text: draft.trim(),
      timestamp: Date.now(),
    };
    
    setConvos((prev) => ({
      ...prev,
      [convId]: [...prev[convId], newMessage],
    }));
    setDraft('');

    // Send to owner chat via localStorage event
    if (convId === 'owner') {
      try {
        window.dispatchEvent(new CustomEvent('staff-sent-message', {
          detail: {
            staffId: 'current-staff',
            staffName: 'John Doe',
            message: draft.trim(),
            timestamp: Date.now(),
          },
        }));
      } catch (e) {
        console.error('Failed to send message event');
      }
    }
  };

  React.useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [convos, convId]);

  if (!hasAccess) return <LockedPage pageName="Messages"/>;

  const msgs = convos[convId];

  return (
    <div className="pg act full" id="pg-messages">
      <div className="phd">
        <h2>Messages</h2>
        <p>Communicate directly with the business owner and your team.</p>
      </div>
      <div className="msg-lay">
        {/* Sidebar */}
        <div className="msg-sidebar">
          <div className="msg-sb-hd">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            Conversations
          </div>
          <div className="conv-list">
            <div className={`conv-item${convId === 'owner' ? ' act' : ''}`} onClick={() => setConvId('owner')}>
              <div className="conv-av" style={{ background: 'var(--purple)' }}>AU</div>
              <div className="conv-info">
                <div className="conv-nm">Abdullahi Usman</div>
                <div className="conv-prev">Great work yesterday!</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <div className="conv-time">2m ago</div>
                <div className="conv-dot"/>
              </div>
            </div>
            <div className={`conv-item${convId === 'team' ? ' act' : ''}`} onClick={() => setConvId('team')}>
              <div className="conv-av" style={{ background: 'var(--teal)' }}>TM</div>
              <div className="conv-info">
                <div className="conv-nm">Team Chat</div>
                <div className="conv-prev">Ibrahim: I'll cover Saturday</div>
              </div>
              <div className="conv-time">1h ago</div>
            </div>
          </div>
        </div>

        {/* Main chat */}
        <div className="msg-main">
          <div className="msg-hd">
            <div
              className="conv-av"
              style={{ width:28, height:28, borderRadius:'50%', background: convId === 'owner' ? 'var(--purple)' : 'var(--teal)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.7rem', fontWeight:700, flexShrink:0 }}
            >
              {convId === 'owner' ? 'AU' : 'TM'}
            </div>
            <div>
              <div className="msg-hd-nm">{convId === 'owner' ? 'Abdullahi Usman' : 'Team Chat'}</div>
              <div className="msg-hd-sub">{convId === 'owner' ? 'Business Owner · Online' : '3 members'}</div>
            </div>
          </div>

          <div className="msg-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`bubble ${m.type}`}>
                <div className="bub">{m.text}</div>
                <div className="bub-time">{m.type === 'recv' ? 'Today' : 'You · Today'}</div>
              </div>
            ))}
          </div>

          <div className="msg-inp-row">
            <input
              type="text"
              className="msg-inp"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
            />
            <button className="msg-send" onClick={sendMsg} aria-label="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════ */
interface SettingsPageProps {
  staff: { initials: string; name: string; role: string };
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout?: () => void;
  onToast: (msg: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  staff, theme, onToggleTheme, onLogout, onToast,
}) => {
  const [sound, setSound] = useState(true);
  const [confirm, setConfirm] = useState(true);

  return (
    <div className="pg act full" id="pg-settings">
      <div className="phd">
        <h2>Settings</h2>
        <p>Personalise your staff portal experience.</p>
      </div>

      <div className="settings-grid">
        {/* Preferences */}
        <div className="card">
          <div className="chd" style={{ marginBottom: '12px' }}>
            <div className="cttl">
              <div className="cic" style={{ background: 'var(--brand-lt)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </div>
              Preferences
            </div>
          </div>
          <div className="tog-row">
            <div>
              <div className="tr-lbl">Dark Mode</div>
              <div className="tr-desc">Switch to dark interface</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme}/>
              <span className="tsl"/>
            </label>
          </div>
          <div className="tog-row">
            <div>
              <div className="tr-lbl">Sound Alerts</div>
              <div className="tr-desc">Beep on successful sale</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)}/>
              <span className="tsl"/>
            </label>
          </div>
          <div className="tog-row">
            <div>
              <div className="tr-lbl">Sale Confirmations</div>
              <div className="tr-desc">Ask before confirming</div>
            </div>
            <label className="toggle">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)}/>
              <span className="tsl"/>
            </label>
          </div>
        </div>

        {/* Profile */}
        <div className="card">
          <div className="chd" style={{ marginBottom: '12px' }}>
            <div className="cttl">
              <div className="cic" style={{ background: 'var(--purple-bg)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              My Profile
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="profile-av-lg">{staff.initials}</div>
            <div style={{ fontFamily: 'var(--fD)', fontSize: '.9rem', fontWeight: 700, color: 'var(--t1)' }}>
              {staff.name}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--brand)', fontWeight: 600, marginBottom: '12px' }}>
              {staff.role}
            </div>
            <button
              className="btn bsm bfull bgh"
              onClick={() => onToast('Change PIN feature coming soon!')}
            >
              Change PIN
            </button>
            {onLogout && (
              <button className="btn bsm bfull bdn" style={{ marginTop: '7px' }} onClick={onLogout}>
                Log Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
