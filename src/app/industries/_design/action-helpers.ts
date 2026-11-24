export function mailto(email?: string | null, subject?: string) {
  const addr = String(email || '').trim();
  if (!addr) return false;
  const href = `mailto:${encodeURIComponent(addr)}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
  if (typeof window !== 'undefined') window.location.href = href;
  return true;
}

export async function copyText(text: string) {
  const value = String(text || '');
  if (!value) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {}
  try {
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (typeof window === 'undefined') return false;
  const list = Array.isArray(rows) ? rows : [];
  const cols = Array.from(
    list.reduce<Set<string>>((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(','), ...list.map((row) => cols.map((c) => esc((row as any)[c])).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export function printHtml(title: string, bodyHtml: string) {
  if (typeof window === 'undefined') return false;
  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) return false;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${title}</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:8px;text-align:left}h1{font-size:20px;margin:0 0 12px}</style>
  </head><body>${bodyHtml}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
  return true;
}
