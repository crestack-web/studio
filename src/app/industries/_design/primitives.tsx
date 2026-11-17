'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import { initials } from './format';
import { Icon } from './icons';

/* ── Toasts ───────────────────────────────────────────────────────── */

type Toast = { id: number; message: string };
type ToastContextValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev.slice(-2), { id, message }]);
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
    timers.current.push(timer);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true">
        {items.map((t, i) => (
          <div
            key={t.id}
            className="sol-toast"
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 24 + i * 64,
              transform: 'translateX(-50%)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: 14,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 650,
              boxShadow: '0 10px 30px rgba(15,23,42,0.28)',
              maxWidth: 'min(92vw, 420px)',
              width: 'max-content',
              pointerEvents: 'none',
              lineHeight: 1.35,
            }}
          >
            <CheckCircle2 size={15} strokeWidth={2.2} aria-hidden color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ color: '#f8fafc', flex: 1, minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── Layout blocks ────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="sol-page-head">
      <div>
        {eyebrow ? <div className="sol-eyebrow">{eyebrow}</div> : null}
        <h1 className="sol-h1">{title}</h1>
        {subtitle ? <p className="sol-sub">{subtitle}</p> : null}
        {meta ? <div className="sol-page-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="sol-page-actions">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  flush,
  tight,
  className,
  id,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  flush?: boolean;
  tight?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={['sol-card', className || ''].join(' ').trim()}>
      {title ? (
        <div className="sol-card-head">
          <div>
            <h2 className="sol-card-title">{title}</h2>
            {subtitle ? <p className="sol-card-sub">{subtitle}</p> : null}
          </div>
          {action ? <div className="sol-card-action">{action}</div> : null}
        </div>
      ) : null}
      {flush ? (
        children
      ) : (
        <div className={['sol-card-body', tight ? 'tight' : ''].join(' ').trim()}>{children}</div>
      )}
    </section>
  );
}

export function Kpi({
  label,
  value,
  icon,
  delta,
  deltaDir = 'flat',
  foot,
  spark,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'flat';
  foot?: React.ReactNode;
  spark?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <article className="sol-kpi" data-accent={accent ? 'true' : undefined}>
      <div className="sol-kpi-head">
        <span className="sol-kpi-label">{label}</span>
        {icon ? (
          <span className="sol-kpi-icon">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <div className="sol-kpi-value">{value}</div>
      <div className="sol-kpi-foot">
        {delta ? <span className={`sol-delta ${deltaDir}`}>{delta}</span> : null}
        {foot ? <span className="sol-kpi-note">{foot}</span> : null}
      </div>
      {spark ? <div className="sol-kpi-spark">{spark}</div> : null}
    </article>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="sol-between sol-section-title">
      <h2>{children}</h2>
      {action}
    </div>
  );
}

/* ── Badges & status ──────────────────────────────────────────────── */

const STATUS_TONES: Record<string, { tone: string; label: string }> = {
  confirmed: { tone: 'blue', label: 'Confirmed' },
  checked_in: { tone: 'green', label: 'Checked in' },
  checked_out: { tone: 'gray', label: 'Checked out' },
  cancelled: { tone: 'red', label: 'Cancelled' },
  no_show: { tone: 'red', label: 'No show' },
  pending: { tone: 'amber', label: 'Pending' },
  available: { tone: 'green', label: 'Available' },
  occupied: { tone: 'blue', label: 'Occupied' },
  cleaning: { tone: 'amber', label: 'Cleaning' },
  inspected: { tone: 'violet', label: 'Inspected' },
  ready: { tone: 'green', label: 'Ready' },
  dirty: { tone: 'amber', label: 'Dirty' },
  in_progress: { tone: 'blue', label: 'In progress' },
  ooo: { tone: 'red', label: 'Out of order' },
  reserved: { tone: 'violet', label: 'Reserved' },
  paid: { tone: 'green', label: 'Paid' },
  settled: { tone: 'green', label: 'Settled' },
  overdue: { tone: 'red', label: 'Overdue' },
  refunded: { tone: 'gray', label: 'Refunded' },
  active: { tone: 'green', label: 'Active' },
  invited: { tone: 'amber', label: 'Invited' },
  suspended: { tone: 'red', label: 'Suspended' },
  new: { tone: 'blue', label: 'New' },
  preparing: { tone: 'amber', label: 'Preparing' },
  on_the_way: { tone: 'violet', label: 'On the way' },
  delivered: { tone: 'green', label: 'Delivered' },
  responded: { tone: 'blue', label: 'Responded' },
  converted: { tone: 'green', label: 'Converted' },
  low: { tone: 'gray', label: 'Low' },
  medium: { tone: 'blue', label: 'Medium' },
  high: { tone: 'amber', label: 'High' },
  urgent: { tone: 'red', label: 'Urgent' },
  /* healthcare */
  scheduled: { tone: 'blue', label: 'Scheduled' },
  waiting: { tone: 'amber', label: 'Waiting' },
  in_consultation: { tone: 'violet', label: 'In consultation' },
  completed: { tone: 'green', label: 'Completed' },
  admitted: { tone: 'blue', label: 'Admitted' },
  discharged: { tone: 'gray', label: 'Discharged' },
  on_duty: { tone: 'green', label: 'On duty' },
  off_duty: { tone: 'gray', label: 'Off duty' },
  on_leave: { tone: 'amber', label: 'On leave' },
  chronic: { tone: 'violet', label: 'Chronic care' },
  inactive: { tone: 'gray', label: 'Inactive' },
  partially_paid: { tone: 'amber', label: 'Partially paid' },
  in_stock: { tone: 'green', label: 'In stock' },
  low_stock: { tone: 'amber', label: 'Low stock' },
  out_of_stock: { tone: 'red', label: 'Out of stock' },
  /* professional */
  todo: { tone: 'gray', label: 'To do' },
  review: { tone: 'violet', label: 'In review' },
  on_hold: { tone: 'amber', label: 'On hold' },
  done: { tone: 'green', label: 'Done' },
  draft: { tone: 'gray', label: 'Draft' },
  sent: { tone: 'blue', label: 'Sent' },
  logged: { tone: 'blue', label: 'Logged' },
  approved: { tone: 'green', label: 'Approved' },
  recorded: { tone: 'gray', label: 'Recorded' },
  failed: { tone: 'red', label: 'Failed' },
  at_risk: { tone: 'red', label: 'At risk' },
  blocked: { tone: 'red', label: 'Blocked' },
  paused: { tone: 'amber', label: 'Paused' },
  closed: { tone: 'gray', label: 'Closed' },
  archived: { tone: 'gray', label: 'Archived' },
  planned: { tone: 'blue', label: 'Planned' },
  billable: { tone: 'green', label: 'Billable' },
  /* education */
  inquiry: { tone: 'gray', label: 'Inquiry' },
  applied: { tone: 'blue', label: 'Applied' },
  assessment: { tone: 'violet', label: 'Assessment' },
  offered: { tone: 'amber', label: 'Offered' },
  enrolled: { tone: 'green', label: 'Enrolled' },
  declined: { tone: 'red', label: 'Declined' },
  graduated: { tone: 'green', label: 'Graduated' },
  withdrawn: { tone: 'gray', label: 'Withdrawn' },
  late: { tone: 'amber', label: 'Late' },
  excused: { tone: 'violet', label: 'Excused' },
  absent: { tone: 'red', label: 'Absent' },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const spec = STATUS_TONES[status] || { tone: 'gray', label: status.replace(/_/g, ' ') };
  return (
    <span className={`sol-badge sol-badge-${spec.tone}`}>
      <span className="dot" />
      {label || spec.label}
    </span>
  );
}

export function Badge({
  tone = 'gray',
  children,
  dot,
}: {
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'accent' | 'gray';
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`sol-badge sol-badge-${tone}`}>
      {dot ? <span className="dot" /> : null}
      {children}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="sol-tag">{children}</span>;
}

/* ── People ───────────────────────────────────────────────────────── */

export function Avatar({
  name,
  size,
  tone,
}: {
  name: string;
  size?: 'sm' | 'lg';
  tone?: number;
}) {
  const idx = tone ?? Math.abs(Array.from(name || 'A').reduce((a, c) => a + c.charCodeAt(0), 0)) % 5;
  return (
    <span className={`sol-avatar ${size || ''}`} data-tone={idx}>
      {initials(name)}
    </span>
  );
}

export function Person({
  name,
  sub,
  avatar,
  size,
}: {
  name: React.ReactNode;
  sub?: React.ReactNode;
  avatar?: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <div className="sol-person">
      {avatar ? <Avatar name={avatar} size={size} /> : null}
      <div className="sol-person-text">
        <div className="sol-person-name">{name}</div>
        {sub ? <div className="sol-person-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

export function AvatarStack({ names, max = 4 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className="sol-avatar-stack">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="sm" />
      ))}
      {rest > 0 ? <span className="sol-avatar sm sol-avatar-more">+{rest}</span> : null}
    </span>
  );
}

/* ── Feedback / data display ──────────────────────────────────────── */

export function Progress({
  value,
  tone,
  label,
}: {
  value: number;
  tone?: 'green' | 'amber' | 'red';
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`sol-progress ${tone || ''}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({
  value,
  size = 132,
  stroke = 12,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="sol-ring"
      style={
        {
          width: size,
          height: size,
          '--p': pct,
          '--ring-w': `${stroke}px`,
        } as React.CSSProperties
      }
      role="img"
      aria-label={`${Math.round(pct)} percent`}
    >
      <div className="sol-ring-inner">
        <strong>{label ?? `${Math.round(pct)}%`}</strong>
        {sub ? <small>{sub}</small> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon = 'checklist',
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sol-empty">
      <span className="sol-empty-icon">
        <Icon name={icon} size={20} />
      </span>
      <h4>{title}</h4>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

export function Banner({
  tone = 'accent',
  icon,
  title,
  children,
  action,
}: {
  tone?: 'accent' | 'amber' | 'red' | 'green';
  icon?: string;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={`sol-banner ${tone}`}>
      {icon ? (
        <span className="sol-banner-icon">
          <Icon name={icon} size={17} />
        </span>
      ) : null}
      <div className="sol-banner-body">
        {title ? <strong>{title}</strong> : null}
        {children ? <div>{children}</div> : null}
      </div>
      {action ? <div className="sol-banner-action">{action}</div> : null}
    </div>
  );
}

/* ── Controls ─────────────────────────────────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  return (
    <label className="sol-search-field">
      <Search size={15} aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
      />
      {value ? (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search">
          <X size={13} aria-hidden />
        </button>
      ) : null}
    </label>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="sol-tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          className="sol-tab"
          aria-selected={item.id === value}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count != null ? <span className="sol-tab-count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="sol-chips">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="sol-chip"
          aria-pressed={item.id === value}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count != null ? <span className="sol-chip-count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className="sol-switch"
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`sol-field ${className || ''}`} htmlFor={htmlFor}>
      <span className="sol-label">{label}</span>
      {children}
      {hint ? <span className="sol-help">{hint}</span> : null}
    </label>
  );
}

export function Menu({
  trigger,
  children,
  align = 'right',
  label,
}: {
  trigger?: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="sol-menu" ref={ref}>
      <button
        type="button"
        className="sol-icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label || 'Open menu'}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger ?? <Icon name="more" size={18} />}
      </button>
      {open ? (
        <div className={`sol-menu-pop ${align}`} role="menu">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`sol-menu-item ${destructive ? 'destructive' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/* ── Sheet / drawer ───────────────────────────────────────────────── */

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const root = document.documentElement;
    root.classList.add('sol-sheet-open');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      root.classList.remove('sol-sheet-open');
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sol-overlay" onClick={onClose} aria-hidden />
      <aside
        className="sol-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={width ? { width: `min(${width}px, 100%)` } : undefined}
      >
        <header className="sol-sheet-head">
          <div>
            <h2 className="sol-sheet-title" id={titleId}>
              {title}
            </h2>
            {subtitle ? <p className="sol-sheet-sub">{subtitle}</p> : null}
          </div>
          <button type="button" className="sol-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="sol-sheet-body">{children}</div>
        {footer ? <footer className="sol-sheet-foot">{footer}</footer> : null}
      </aside>
    </>
  );
}

/* ── Table helpers ────────────────────────────────────────────────── */

export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="sol-table-wrap">{children}</div>;
}

export function Th({
  children,
  align,
  width,
}: {
  children?: React.ReactNode;
  align?: 'right' | 'center';
  width?: number | string;
}) {
  return (
    <th style={{ textAlign: align, width }} scope="col">
      {children}
    </th>
  );
}

export function Td({
  children,
  align,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  align?: 'right' | 'center';
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      style={align ? { textAlign: align } : undefined}
      className={className}
    >
      {children}
    </td>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="sol-kbd">{children}</kbd>;
}

export function IconButton({
  icon,
  label,
  onClick,
  active,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`sol-icon-btn ${active ? 'active' : ''} ${className || ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
