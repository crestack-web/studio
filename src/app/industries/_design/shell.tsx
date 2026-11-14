'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Command,
  HelpCircle,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { Avatar, Badge, Kbd, Sheet, useToast } from './primitives';
import { Icon } from './icons';
import { AIDrawer } from './ai';
import { SOLUTIONS_SECTION_LABELS, SOLUTIONS_SUITE_IDS, SOLUTIONS_SUITES } from './suites';
import type { SolutionsSuite, SolutionsSuiteId } from './types';

type QuickAction = { id: string; label: string; icon: string; section: string };

const QUICK_ACTIONS: Record<SolutionsSuiteId, QuickAction[]> = {
  hospitality: [
    { id: 'reservations', label: 'New reservation', icon: 'calendar', section: 'reservations' },
    { id: 'checkin', label: 'Check in a guest', icon: 'login', section: 'checkin' },
    { id: 'rooms', label: 'Add a room', icon: 'bed', section: 'rooms' },
    { id: 'expenses', label: 'Log an expense', icon: 'receipt', section: 'expenses' },
    { id: 'tasks', label: 'Assign a task', icon: 'checklist', section: 'tasks' },
  ],
  healthcare: [
    { id: 'appointments', label: 'Book appointment', icon: 'calendar', section: 'appointments' },
    { id: 'patients', label: 'Register a patient', icon: 'users', section: 'patients' },
    { id: 'visits', label: 'Check in a patient', icon: 'login', section: 'visits' },
    { id: 'billing', label: 'Create an invoice', icon: 'receipt', section: 'billing' },
    { id: 'inventory', label: 'Restock supplies', icon: 'box', section: 'inventory' },
  ],
  professional: [
    { id: 'projects', label: 'New project', icon: 'layers', section: 'projects' },
    { id: 'clients', label: 'Add a client', icon: 'users', section: 'clients' },
    { id: 'tasks', label: 'Assign a task', icon: 'checklist', section: 'tasks' },
    { id: 'invoices', label: 'Raise an invoice', icon: 'receipt', section: 'invoices' },
    { id: 'time', label: 'Log time', icon: 'clock', section: 'time' },
  ],
  education: [
    { id: 'students', label: 'Enroll a student', icon: 'users', section: 'students' },
    { id: 'classes', label: 'Create a class', icon: 'layers', section: 'classes' },
    { id: 'attendance', label: 'Take attendance', icon: 'checklist', section: 'attendance' },
    { id: 'timetable', label: 'Add to timetable', icon: 'calendar', section: 'timetable' },
    { id: 'fees', label: 'Record a fee payment', icon: 'receipt', section: 'fees' },
  ],
};

const MO_SUMMARY: Record<SolutionsSuiteId, string> = {
  hospitality:
    'MO: “Occupancy is 65%. 6 arrivals today — rooms 305 and 412 need attention.”',
  healthcare:
    'MO: “12 patients are in the queue. Cardiology is running 22 minutes late — consider moving Dr. Lawal’s 15:30 virtual.”',
  professional:
    'MO: “Three projects are at risk this week. Northwind has 18 unbilled hours ready to invoice.”',
  education:
    'MO: “Attendance is 92% this week. 14 students have fees outstanding before the term closes.”',
};

const PREVIEW_READY: SolutionsSuiteId[] = ['hospitality', 'healthcare', 'professional', 'education'];


export type ShellNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  unread: boolean;
};

type MenuKey = 'suite' | 'sideUser' | 'topUser' | 'notif' | 'quick' | null;

const SECTION_ORDER = ['main', 'operations', 'finance', 'settings'] as const;

export function SolutionsShell({
  suite,
  section,
  hrefFor,
  notifications = [],
  user,
  signOut,
  children,
}: {
  suite: SolutionsSuite;
  section: string;
  hrefFor: (sectionId: string, suiteId?: string) => string;
  notifications?: ShellNotification[];
  user?: { name: string; email?: string } | null;
  signOut?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeReady, setThemeReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState<MenuKey>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  const activeNav = suite.nav.find((n) => n.id === section) || suite.nav[0];
  const unread = notifications.filter((n) => n.unread).length;
  const quickActions = QUICK_ACTIONS[suite.id];
  const settingsSection =
    suite.nav.find((n) => n.section === 'settings' && n.id !== 'account')?.id || 'account';
  const moSummary = MO_SUMMARY[suite.id];
  const userName = user?.name || suite.workspace.ownerName;
  const userEmail = user?.email || suite.workspace.ownerEmail;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('busmo-solutions-theme');
      if (stored === 'dark' || stored === 'light') setTheme(stored);
      else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) setTheme('dark');
    } catch {
      /* ignore */
    }
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    try {
      localStorage.setItem('busmo-solutions-theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme, themeReady]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) setMenu(null);
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu-root]')) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = suite.nav.map((n) => ({ ...n, kind: 'Page' as const }));
    const actions = quickActions.map((a) => ({
      id: a.id,
      label: a.label,
      icon: a.icon,
      kind: 'Action' as const,
    }));
    const all = [...actions, ...pages];
    return q ? all.filter((r) => r.label.toLowerCase().includes(q)) : all;
  }, [query, suite.nav, quickActions]);

  const go = (id: string) => {
    setPaletteOpen(false);
    setMobileNavOpen(false);
    router.push(hrefFor(id));
  };

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const mobilePrimary = suite.nav.filter((n) => n.section === 'main').slice(0, 4);

  return (
    <div className="solutions" data-suite={suite.id} data-theme={theme} ref={shellRef}>
      <div className="sol">
        <aside className="sol-sidebar" data-collapsed={collapsed}>
          <div className="sol-brand" data-menu-root>
            <button
              type="button"
              className="sol-brand-btn"
              onClick={() => setMenu((m) => (m === 'suite' ? null : 'suite'))}
              aria-haspopup="menu"
              aria-expanded={menu === 'suite'}
              aria-label="Switch Busmo suite"
            >
              {suite.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={suite.logo} alt="" className="sol-brand-logo" />
              ) : (
                <span className="sol-brand-mark">{suite.shortName.slice(0, 1)}</span>
              )}
              <span className="sol-brand-text">
                <span className="sol-brand-name">{suite.workspace.name}</span>
                <span className="sol-brand-meta">
                  <span className="sol-suite-chip">{suite.edition}</span>
                  <ChevronDown size={12} aria-hidden />
                </span>
              </span>
            </button>
            {menu === 'suite' ? (
              <div className="sol-menu-pop left sol-suite-menu" role="menu">
                <div className="sol-menu-head">
                  <strong>Busmo suites</strong>
                  <small>Each product has its own identity</small>
                </div>
                {SOLUTIONS_SUITE_IDS.map((id) => {
                  const s = SOLUTIONS_SUITES[id];
                  return (
                    <Link
                      key={id}
                      href={hrefFor('overview', id)}
                      className="sol-suite-option"
                      data-active={id === suite.id}
                      role="menuitem"
                      onClick={() => setMenu(null)}
                    >
                      {s.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.logo} alt="" className="sol-suite-logo" />
                      ) : (
                        <span className={`sol-suite-dot suite-${id}`} />
                      )}
                      <span className="sol-suite-option-text">
                        <strong>{s.shortName}</strong>
                        <small>{PREVIEW_READY.includes(id) ? 'Live preview' : 'Rebuild queued'}</small>
                      </span>
                      {id === suite.id ? <Check size={14} aria-hidden /> : null}
                    </Link>
                  );
                })}
              </div>
            ) : null}
            <button
              type="button"
              className="sol-collapse"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronDown size={15} aria-hidden />
            </button>
          </div>

          <div className="sol-sidebar-scroll">
            <button
              type="button"
              className="sol-ask-mo"
              onClick={() => setAiOpen(true)}
            >
              <span className="sol-ask-mo-mark">
                <Icon name="mo" size={14} />
              </span>
              <span className="sol-ask-mo-text">
                <strong>Ask MO</strong>
                <small>Your {suite.greetingNoun} assistant</small>
              </span>
            </button>

            {SECTION_ORDER.map((sec) => {
              const items = suite.nav.filter((n) => n.section === sec);
              if (!items.length) return null;
              return (
                <div key={sec} className="sol-nav-group">
                  <div className="sol-nav-label">{SOLUTIONS_SECTION_LABELS[sec]}</div>
                  {items.map((item) => {
                    const active = item.id === section;
                    return (
                      <Link
                        key={item.id}
                        href={hrefFor(item.id)}
                        className="sol-nav-link"
                        aria-current={active ? 'page' : undefined}
                        title={item.label}
                      >
                        <Icon name={item.icon} size={18} className="sol-nav-icon" />
                        <span className="sol-nav-text">{item.label}</span>
                        {item.count != null ? <span className="sol-nav-count">{item.count}</span> : null}
                        {item.badge ? <span className="sol-nav-badge" aria-label="Needs attention" /> : null}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="sol-sidebar-foot">
            <button
              type="button"
              className="sol-theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>

            <div className="sol-user" data-menu-root>
              <button
                type="button"
                className="sol-user-btn"
                onClick={() => setMenu((m) => (m === 'sideUser' ? null : 'sideUser'))}
                aria-haspopup="menu"
                aria-expanded={menu === 'sideUser'}
              >
                <Avatar name={userName} />
                <span className="sol-person-text">
                  <span className="sol-person-name">{userName}</span>
                  <span className="sol-person-sub">Owner · {suite.workspace.plan}</span>
                </span>
                <ChevronDown size={13} aria-hidden />
              </button>
              {menu === 'sideUser' ? (
                <div className="sol-menu-pop left" role="menu">
                  <div className="sol-menu-head">
                    <strong>{userName}</strong>
                    <small>{userEmail}</small>
                  </div>
                  <Link className="sol-menu-item" role="menuitem" href={hrefFor('account')}>
                    <Icon name="user" size={15} /> Account settings
                  </Link>
                  <Link className="sol-menu-item" role="menuitem" href={hrefFor(settingsSection)}>
                    <Icon name="settings" size={15} /> {suite.shortName} settings
                  </Link>
                  <Link className="sol-menu-item" role="menuitem" href={hrefFor('reports')}>
                    <Icon name="chart" size={15} /> Reports
                  </Link>
                  <div className="sol-menu-sep" />
                  <button
                    type="button"
                    className="sol-menu-item destructive"
                    role="menuitem"
                    onClick={() => {
                      setMenu(null);
                      signOut?.();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="sol-main">
          <header className="sol-topbar">
            <div className="sol-crumbs">
              <span className="sol-crumb-suite">{suite.shortName}</span>
              <span className="sol-crumb-sep">/</span>
              <strong>{activeNav?.label || 'Overview'}</strong>
            </div>
            <div className="sol-topbar-spacer" />
            <div className="sol-topbar-actions">
              <button type="button" className="sol-search" onClick={() => setPaletteOpen(true)}>
                <Search size={15} aria-hidden />
                <span>Search or jump to…</span>
                <Kbd>⌘K</Kbd>
              </button>

              <div className="sol-notif" data-menu-root>
                <button
                  type="button"
                  className="sol-icon-btn"
                  onClick={() => setMenu((m) => (m === 'notif' ? null : 'notif'))}
                  aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
                  aria-haspopup="menu"
                  aria-expanded={menu === 'notif'}
                >
                  <Bell size={18} aria-hidden />
                  {unread ? <span className="sol-notif-dot" /> : null}
                </button>
                {menu === 'notif' ? (
                  <div className="sol-pop sol-notif-pop" role="menu">
                    <div className="sol-pop-head">
                      <strong>Notifications</strong>
                      <Badge tone="accent">{unread} new</Badge>
                    </div>
                    <div className="sol-notif-list">
                      {notifications.map((n) => (
                        <div key={n.id} className="sol-notif-item" data-unread={n.unread}>
                          <span className="sol-notif-bullet" />
                          <div>
                            <strong>{n.title}</strong>
                            <p>{n.detail}</p>
                          </div>
                          <small>{n.time}</small>
                        </div>
                      ))}
                    </div>
                    <button type="button" className="sol-pop-foot" onClick={() => setMenu(null)}>
                      Mark all as read
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="sol-quick-create" data-menu-root>
                <button
                  type="button"
                  className="sol-btn sol-btn-primary sol-btn-sm"
                  onClick={() => setMenu((m) => (m === 'quick' ? null : 'quick'))}
                  aria-haspopup="menu"
                  aria-expanded={menu === 'quick'}
                >
                  <Plus size={15} aria-hidden /> New
                  <ChevronDown size={13} aria-hidden />
                </button>
                {menu === 'quick' ? (
                  <div className="sol-menu-pop" role="menu">
                    <div className="sol-menu-head">
                      <strong>Quick create</strong>
                      <small>Jump straight into the task</small>
                    </div>
                    {quickActions.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="sol-menu-item"
                        role="menuitem"
                        onClick={() => {
                          setMenu(null);
                          go(a.section);
                        }}
                      >
                        <Icon name={a.icon} size={15} /> {a.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div data-menu-root>
                <button
                  type="button"
                  className="sol-avatar-btn"
                  onClick={() => setMenu((m) => (m === 'topUser' ? null : 'topUser'))}
                  aria-label="Open account menu"
                  aria-haspopup="menu"
                  aria-expanded={menu === 'topUser'}
                >
                  <Avatar name={userName} size="sm" />
                </button>
                {menu === 'topUser' ? (
                  <div className="sol-menu-pop" role="menu">
                    <div className="sol-menu-head">
                      <strong>{userName}</strong>
                      <small>{userEmail}</small>
                    </div>
                    <Link className="sol-menu-item" role="menuitem" href={hrefFor('account')}>
                      <Icon name="user" size={15} /> Account settings
                    </Link>
                    <button
                      type="button"
                      className="sol-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setMenu(null);
                        toggleTheme();
                      }}
                    >
                      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </button>
                    <button
                      type="button"
                      className="sol-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setMenu(null);
                        setPaletteOpen(true);
                      }}
                    >
                      <Search size={15} /> Search
                    </button>
                    <div className="sol-menu-sep" />
                    <button
                      type="button"
                      className="sol-menu-item destructive"
                      role="menuitem"
                      onClick={() => {
                        setMenu(null);
                        signOut?.();
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="sol-content">{children}</main>

          <div className="sol-mobile-top">
            <button
              type="button"
              className="sol-icon-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={19} aria-hidden />
            </button>
            {suite.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={suite.logo} alt={suite.name} className="sol-mobile-logo" />
            ) : (
              <span className="sol-brand-mark small">{suite.shortName.slice(0, 1)}</span>
            )}
            <div className="sol-mobile-title">
              <strong>{suite.workspace.name}</strong>
              <small>{activeNav?.label}</small>
            </div>
            <button
              type="button"
              className="sol-icon-btn"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search"
            >
              <Search size={18} aria-hidden />
            </button>
          </div>

          <nav className="sol-mobile-nav" aria-label="Primary">
            <div className="sol-mobile-nav-inner">
              {mobilePrimary.map((item) => (
                <Link
                  key={item.id}
                  href={hrefFor(item.id)}
                  className="sol-mobile-tab"
                  aria-current={item.id === section ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label.split(' ')[0]}</span>
                </Link>
              ))}
              <button
                type="button"
                className="sol-mobile-tab"
                onClick={() => setMobileNavOpen(true)}
                aria-label="More pages"
              >
                <Menu size={19} aria-hidden />
                <span>More</span>
              </button>
            </div>
          </nav>
        </div>

        <button
          type="button"
          className="sol-mo"
          onClick={() => setAiOpen(true)}
        >
          <span className="sol-mo-mark">
            <Icon name="mo" size={14} />
          </span>
          Ask MO
        </button>

        <Sheet
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          title="Ask MO"
          subtitle="AI chief of staff"
          width={440}
        >
          <AIDrawer open={aiOpen} onClose={() => setAiOpen(false)} suiteId={suite.id} />
        </Sheet>

        {paletteOpen ? (
          <div className="sol-command-wrap" onMouseDown={() => setPaletteOpen(false)}>
            <div className="sol-command" onMouseDown={(e) => e.stopPropagation()}>
              <div className="sol-command-head">
                <Search size={16} aria-hidden />
                <input
                  autoFocus
                  className="sol-command-input"
                  placeholder={`Search ${suite.shortName.toLowerCase()} pages and actions…`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && results[0]) go(results[0].id);
                  }}
                />
                <Kbd>esc</Kbd>
              </div>
              <div className="sol-command-list">
                {results.length ? (
                  results.map((r, i) => (
                    <button
                      key={`${r.kind}-${r.id}-${i}`}
                      type="button"
                      className="sol-command-item"
                      data-active={i === 0}
                      onClick={() => go(r.id)}
                    >
                      <Icon name={r.icon} size={16} />
                      <span className="sol-grow">{r.label}</span>
                      <small>{r.kind}</small>
                      <ArrowRight size={13} aria-hidden />
                    </button>
                  ))
                ) : (
                  <div className="sol-command-empty">No matches for “{query}”</div>
                )}
              </div>
              <div className="sol-command-foot">
                <span>
                  <Command size={11} aria-hidden /> K to open
                </span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            </div>
          </div>
        ) : null}

        <Sheet
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          title="All pages"
          subtitle={suite.workspace.name}
        >
          {SECTION_ORDER.map((sec) => {
            const items = suite.nav.filter((n) => n.section === sec);
            if (!items.length) return null;
            return (
              <div key={sec}>
                <div className="sol-nav-label">{SOLUTIONS_SECTION_LABELS[sec]}</div>
                <div className="sol-mobile-nav-list">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={hrefFor(item.id)}
                      className="sol-nav-link"
                      aria-current={item.id === section ? 'page' : undefined}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Icon name={item.icon} size={18} className="sol-nav-icon" />
                      <span className="sol-nav-text">{item.label}</span>
                      {item.count != null ? <span className="sol-nav-count">{item.count}</span> : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          <button type="button" className="sol-theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <span className="sol-help">
            <HelpCircle size={13} aria-hidden /> Tip: press ⌘K anywhere to jump between pages.
          </span>
        </Sheet>
      </div>
    </div>
  );
}
