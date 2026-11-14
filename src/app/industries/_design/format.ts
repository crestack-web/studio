/** Shared formatting helpers for the solutions dashboards. */

export function money(value: number, currency = 'NGN'): string {
  const n = Number.isFinite(value) ? value : 0;
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '';
  return `${symbol}${Math.round(n).toLocaleString('en-NG')}`;
}

export function compactMoney(value: number, currency = 'NGN'): string {
  const n = Number.isFinite(value) ? value : 0;
  const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${symbol}${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${symbol}${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return money(n, currency);
}

export function compactNumber(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(n));
}

export function initials(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function toISODate(date: Date): string {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fmtDate(iso: string, opts?: { weekday?: boolean; year?: boolean }): string {
  if (!iso) return '—';
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: opts?.weekday ? 'short' : undefined,
    day: 'numeric',
    month: 'short',
    year: opts?.year ? 'numeric' : undefined,
  });
}

export function fmtDay(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function secondsLabel(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const mins = Math.max(0, Math.round((Date.now() - d) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T12:00:00`).getTime();
  const b = new Date(`${checkOut}T12:00:00`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function titleCase(value: string): string {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
