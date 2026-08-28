'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LockedPage } from '../components/shared';
import { fetchDocs, addDoc as sbAddDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';

type BaseProps = {
  hasAccess: boolean;
  businessId?: string | null;
  staffId?: string | null;
  staffName?: string;
};

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '16px', maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800 }}>{title}</h2>
      <p style={{ margin: '0 0 16px', color: 'var(--t3, #64748b)', fontSize: '0.85rem' }}>{subtitle}</p>
      {children}
    </div>
  );
}

const field: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--bdr, #e2e8f0)',
  background: 'var(--surf, #fff)',
  marginBottom: 10,
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};

const btn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--brand, #16a34a)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const btnDisabled: React.CSSProperties = {
  ...btn,
  opacity: 0.55,
  cursor: 'not-allowed',
};

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function isCashPayment(method: unknown) {
  const m = String(method || '').toLowerCase();
  return !m || m === 'cash' || m.includes('cash');
}

function saleTotal(s: any): number {
  return Number(s.totalRevenue ?? s.total_revenue ?? s.totalAmount ?? s.total_amount ?? s.total ?? 0) || 0;
}

function isSameLocalDay(iso: unknown, day: string) {
  if (!iso) return false;
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10) === day;
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return local === day;
}

/** Persist staff shift close using only columns that exist on cash_reconciliations. */
async function saveStaffShiftClose(opts: {
  businessId: string;
  staffId?: string | null;
  staffName?: string;
  day: string;
  expected: number;
  actual: number;
  variance: number;
  note: string;
  cashSalesCount: number;
}): Promise<string> {
  const {
    businessId,
    staffId,
    staffName,
    day,
    expected,
    actual,
    variance,
    note,
    cashSalesCount,
  } = opts;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const metadata = {
    type: 'staff_shift_close',
    source: 'staff_shift_close',
    expectedCash: expected,
    actualCash: actual,
    variance,
    notes: note.trim() || '',
    shift: `staff-${staffId || 'unknown'}-${day}`,
    date: day,
    staffId: staffId || null,
    staffName: staffName || null,
    cashSalesCount,
    salesCount: cashSalesCount,
    submittedAt: now,
    reconciledAt: now,
  };

  // Preferred path: client data layer (now metadata-only for this table)
  try {
    await sbAddDoc(`businesses/${businessId}/cash_reconciliations`, {
      id,
      metadata,
      created_at: now,
    });
    return id;
  } catch (firstErr: any) {
    // Direct slim insert (same shape as owner API fallback)
    const supabase = getSupabase();
    const slim = {
      id,
      business_id: businessId,
      metadata,
      created_at: now,
    };
    const { error } = await supabase.from('cash_reconciliations').insert(slim);
    if (!error) return id;
    throw new Error(error.message || firstErr?.message || 'Failed to save shift close');
  }
}

export function CustomersPage({ hasAccess, businessId }: BaseProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess || !businessId) return;
    (async () => {
      setLoading(true);
      try {
        const [credit, customers] = await Promise.all([
          fetchDocs(`businesses/${businessId}/credit_customers`).catch(() => []),
          fetchDocs(`businesses/${businessId}/customers`).catch(() => []),
        ]);
        const map = new Map<string, any>();
        for (const r of [...(credit || []), ...(customers || [])]) {
          const id = String(r.id);
          if (!map.has(id)) map.set(id, r);
        }
        setRows([...map.values()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [hasAccess, businessId]);

  if (!hasAccess) return <LockedPage pageName="Customers" />;
  const filtered = rows.filter(
    (r) =>
      !q ||
      String(r.name || '')
        .toLowerCase()
        .includes(q.toLowerCase()) ||
      String(r.phone || '').includes(q)
  );

  return (
    <Shell title="Customers" subtitle="Look up customers to assist at the counter. Attach them when recording a sale.">
      <input style={field} placeholder="Search name or phone…" value={q} onChange={(e) => setQ(e.target.value)} />
      {loading ? (
        <p style={{ color: 'var(--t3)' }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--t3)' }}>No customers yet. Owner can add them, or create on credit sales.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.slice(0, 50).map((c) => (
            <div
              key={c.id}
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--bdr, #e2e8f0)',
                background: 'var(--surf, #fff)',
              }}
            >
              <div style={{ fontWeight: 700 }}>{c.name || 'Customer'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>
                {c.phone || 'No phone'}
                {Number(c.currentBalance || c.balance || 0) > 0
                  ? ` · Balance: ${Number(c.currentBalance || c.balance).toLocaleString()}`
                  : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

export function CreditPage({ hasAccess, businessId }: BaseProps) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (!hasAccess || !businessId) return;
    fetchDocs(`businesses/${businessId}/credit_customers`)
      .then((d) => setRows(d || []))
      .catch(() => setRows([]));
  }, [hasAccess, businessId]);
  if (!hasAccess) return <LockedPage pageName="Credit" />;
  const withBalance = rows.filter((r) => Number(r.currentBalance || 0) > 0);
  return (
    <Shell title="Credit balances" subtitle="Customers with outstanding pay-later balances. Use Record Sale → Credit to issue new credit.">
      {withBalance.length === 0 ? (
        <p style={{ color: 'var(--t3)' }}>No open credit balances.</p>
      ) : (
        withBalance.map((c) => (
          <div
            key={c.id}
            style={{
              padding: 12,
              marginBottom: 8,
              borderRadius: 12,
              border: '1px solid var(--bdr)',
              background: 'var(--surf)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <span style={{ fontWeight: 800, color: 'var(--amber, #d97706)' }}>
              {Number(c.currentBalance || 0).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </Shell>
  );
}

export function ReturnsPage({ hasAccess, businessId, staffId, staffName }: BaseProps) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [product, setProduct] = useState('');
  const [saved, setSaved] = useState(false);
  if (!hasAccess) return <LockedPage pageName="Returns" />;

  const submit = async () => {
    if (!businessId || !product.trim()) return;
    await sbAddDoc(`businesses/${businessId}/returns`, {
      id: crypto.randomUUID(),
      productName: product.trim(),
      amount: Number(amount) || 0,
      reason: note.trim() || 'Return',
      staffId: staffId || null,
      staffName: staffName || null,
      created_at: new Date().toISOString(),
    });
    setProduct('');
    setAmount('');
    setNote('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Shell title="Returns" subtitle="Log a return so the owner can review stock and refunds.">
      <input style={field} placeholder="Product name *" value={product} onChange={(e) => setProduct(e.target.value)} />
      <input style={field} placeholder="Amount (optional)" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
      <textarea style={{ ...field, minHeight: 80 }} placeholder="Reason" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" style={btn} onClick={submit}>
        Log return
      </button>
      {saved && <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>Return logged.</p>}
    </Shell>
  );
}

export function ReceiveStockPage({ hasAccess, businessId, staffId, staffName }: BaseProps) {
  const [product, setProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [saved, setSaved] = useState(false);
  if (!hasAccess) return <LockedPage pageName="Receive stock" />;

  const submit = async () => {
    if (!businessId || !product.trim()) return;
    await sbAddDoc(`businesses/${businessId}/stock_receipts`, {
      id: crypto.randomUUID(),
      productName: product.trim(),
      quantity: Number(qty) || 1,
      staffId: staffId || null,
      staffName: staffName || null,
      created_at: new Date().toISOString(),
      status: 'pending_owner_confirm',
    });
    setProduct('');
    setQty('1');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Shell title="Receive stock" subtitle="Log inbound goods. Owner can confirm and apply to inventory.">
      <input style={field} placeholder="Product / description *" value={product} onChange={(e) => setProduct(e.target.value)} />
      <input style={field} placeholder="Quantity" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
      <button type="button" style={btn} onClick={submit}>
        Submit receipt
      </button>
      {saved && <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>Receipt submitted.</p>}
    </Shell>
  );
}

export function ExpensesPage({ hasAccess, businessId, staffId, staffName }: BaseProps) {
  const [category, setCategory] = useState('Petty cash');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  if (!hasAccess) return <LockedPage pageName="Expenses" />;

  const submit = async () => {
    if (!businessId || !amount) return;
    await sbAddDoc(`businesses/${businessId}/expenses`, {
      id: crypto.randomUUID(),
      category,
      amount: Number(amount),
      note: note.trim(),
      paymentMethod: 'cash',
      staffId: staffId || null,
      recordedBy: staffName || 'Staff',
      date: new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      source: 'staff_portal',
    });
    setAmount('');
    setNote('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Shell title="Record expense" subtitle="For approved petty cash and small spends only.">
      <select style={field} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>Petty cash</option>
        <option>Transport</option>
        <option>Supplies</option>
        <option>Utilities</option>
        <option>Other</option>
      </select>
      <input style={field} type="number" placeholder="Amount *" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input style={field} placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" style={btn} onClick={submit}>
        Save expense
      </button>
      {saved && <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>Expense saved.</p>}
    </Shell>
  );
}

export function ShiftClosePage({ hasAccess, businessId, staffId, staffName }: BaseProps) {
  const [counted, setCounted] = useState('');
  const [expectedOverride, setExpectedOverride] = useState('');
  const [note, setNote] = useState('');
  const [expectedCash, setExpectedCash] = useState(0);
  const [cashSalesCount, setCashSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const day = todayISODate();

  const load = async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sales = await fetchDocs(`businesses/${businessId}/sales`).catch(() => []);
      const todayCash = (sales || []).filter((s: any) => {
        const when = s.created_at || s.createdAt;
        return isSameLocalDay(when, day) && isCashPayment(s.paymentMethod || s.payment_method || s.paymentType);
      });
      const sum = todayCash.reduce((acc: number, s: any) => acc + saleTotal(s), 0);
      setExpectedCash(sum);
      setCashSalesCount(todayCash.length);

      const recons = await fetchDocs(`businesses/${businessId}/cash_reconciliations`).catch(() => []);
      const mine = (recons || [])
        .filter((r: any) => {
          const sid = String(r.staffId || r.staff_id || '');
          if (staffId && sid === String(staffId)) return true;
          if (String(r.source || '') === 'staff_shift_close' && isSameLocalDay(r.created_at || r.createdAt || r.date, day))
            return true;
          if (String(r.shift || '').includes('staff-') && isSameLocalDay(r.created_at || r.createdAt || r.date, day))
            return true;
          return false;
        })
        .sort((a: any, b: any) =>
          String(b.created_at || b.createdAt || '').localeCompare(String(a.created_at || a.createdAt || ''))
        )
        .slice(0, 8);
      setHistory(mine);
    } catch (e: any) {
      setError(e?.message || 'Could not load shift data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAccess) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, businessId, staffId, day]);

  const expected = useMemo(() => {
    if (expectedOverride.trim() !== '') {
      const n = Number(expectedOverride);
      return Number.isFinite(n) ? n : expectedCash;
    }
    return expectedCash;
  }, [expectedOverride, expectedCash]);

  const actual = Number(counted) || 0;
  const variance = actual - expected;

  const submit = async () => {
    if (!businessId) {
      setError('Missing business. Sign out and sign in again.');
      return;
    }
    if (counted.trim() === '' || !Number.isFinite(Number(counted))) {
      setError('Enter the cash you counted in the drawer.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSaved(false);

    try {
      await saveStaffShiftClose({
        businessId,
        staffId,
        staffName,
        day,
        expected,
        actual,
        variance,
        note,
        cashSalesCount,
      });
      setCounted('');
      setNote('');
      setExpectedOverride('');
      setSaved(true);
      setError(null);
      await load();
      setTimeout(() => setSaved(false), 4000);
    } catch (e: any) {
      try {
        const key = `busmo_shift_close_${businessId}`;
        const prev = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = {
          id: crypto.randomUUID(),
          expectedCash: expected,
          actualCash: actual,
          variance,
          notes: note.trim(),
          date: day,
          staffId,
          offline: true,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify([entry, ...(Array.isArray(prev) ? prev : [])].slice(0, 20)));
        setHistory((h) => [entry, ...h].slice(0, 8));
        setCounted('');
        setNote('');
        setSaved(true);
        setError(`Could not reach server (${e?.message || 'error'}). Saved on this device only.`);
      } catch {
        setError(e?.message || 'Failed to submit shift close');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasAccess) return <LockedPage pageName="Shift close" />;

  return (
    <Shell
      title="Shift close"
      subtitle="Count the cash drawer, compare to today’s cash sales, and submit for owner review."
    >
      {loading ? (
        <p style={{ color: 'var(--t3)' }}>Loading today’s cash sales…</p>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--brand-lt, #d1fae5)',
                border: '1px solid var(--bdr)',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                Expected (cash sales)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 4 }}>
                {expected.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: 4 }}>
                {cashSalesCount} cash sale{cashSalesCount === 1 ? '' : 's'} today
              </div>
            </div>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: 'var(--surf)',
                border: '1px solid var(--bdr)',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase' }}>
                Variance
              </div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  marginTop: 4,
                  color:
                    counted.trim() === ''
                      ? 'var(--t3)'
                      : variance === 0
                        ? 'var(--brand, #16a34a)'
                        : variance < 0
                          ? 'var(--red, #dc2626)'
                          : 'var(--amber, #d97706)',
                }}
              >
                {counted.trim() === ''
                  ? '—'
                  : `${variance > 0 ? '+' : ''}${variance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: 4 }}>Counted − expected</div>
            </div>
          </div>

          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Cash counted *</label>
          <input
            style={field}
            type="number"
            inputMode="decimal"
            placeholder="Amount in drawer"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
          />

          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>
            Expected override (optional)
          </label>
          <input
            style={field}
            type="number"
            inputMode="decimal"
            placeholder={`Leave blank to use ${expectedCash.toLocaleString()}`}
            value={expectedOverride}
            onChange={(e) => setExpectedOverride(e.target.value)}
          />

          <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Note</label>
          <input
            style={field}
            placeholder="e.g. float left in drawer, expenses paid"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button type="button" style={submitting ? btnDisabled : btn} onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit shift close'}
          </button>

          {saved && !error && (
            <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>
              Shift close submitted for owner review.
            </p>
          )}
          {error && (
            <p style={{ color: 'var(--red, #dc2626)', marginTop: 10, fontSize: '0.85rem' }}>{error}</p>
          )}

          {history.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 10px' }}>Recent submissions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {history.map((h) => {
                  const exp = Number(h.expectedCash ?? h.expected_cash ?? 0);
                  const act = Number(h.actualCash ?? h.actual_cash ?? 0);
                  const varn = Number(h.variance ?? act - exp);
                  return (
                    <div
                      key={h.id}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: '1px solid var(--bdr)',
                        background: 'var(--surf)',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong>{String(h.date || h.created_at || '').slice(0, 16)}</strong>
                        <span style={{ color: varn === 0 ? 'var(--brand)' : 'var(--amber, #d97706)', fontWeight: 700 }}>
                          Δ {varn > 0 ? '+' : ''}
                          {varn.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: 'var(--t3)', marginTop: 4 }}>
                        Expected {exp.toLocaleString()} · Counted {act.toLocaleString()}
                        {h.offline ? ' · device only' : ''}
                      </div>
                      {(h.notes || h.note) && <div style={{ marginTop: 4 }}>{h.notes || h.note}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

export function ExpiryPage({ hasAccess, businessId }: BaseProps) {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    if (!hasAccess || !businessId) return;
    fetchDocs(`businesses/${businessId}/products`)
      .then((d) => setProducts((d || []).slice(0, 40)))
      .catch(() => setProducts([]));
  }, [hasAccess, businessId]);
  if (!hasAccess) return <LockedPage pageName="Expiry" />;
  return (
    <Shell title="Expiry checks" subtitle="Review products and flag near-expiry items for the owner.">
      <p style={{ fontSize: '0.85rem', color: 'var(--t3)', marginBottom: 12 }}>
        Check physical stock against this list. Mark issues in Messages if something is expired.
      </p>
      {products.map((p) => (
        <div
          key={p.id}
          style={{
            padding: '10px 12px',
            borderBottom: '1px solid var(--bdr)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 600 }}>{p.name}</span>
          <span style={{ color: 'var(--t3)', fontSize: '0.8rem' }}>Stock: {p.stock ?? p.quantity ?? '—'}</span>
        </div>
      ))}
    </Shell>
  );
}

export function ProductionPage({ hasAccess, businessId, staffId, staffName }: BaseProps) {
  const [item, setItem] = useState('');
  const [qty, setQty] = useState('1');
  const [saved, setSaved] = useState(false);
  if (!hasAccess) return <LockedPage pageName="Production" />;
  const submit = async () => {
    if (!businessId || !item.trim()) return;
    await sbAddDoc(`businesses/${businessId}/production_runs`, {
      id: crypto.randomUUID(),
      productName: item.trim(),
      quantity: Number(qty) || 1,
      staffId: staffId || null,
      staffName: staffName || null,
      created_at: new Date().toISOString(),
      status: 'logged',
    });
    setItem('');
    setQty('1');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <Shell title="Production" subtitle="Log finished goods from a production run.">
      <input style={field} placeholder="Finished product *" value={item} onChange={(e) => setItem(e.target.value)} />
      <input style={field} type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
      <button type="button" style={btn} onClick={submit}>
        Log production
      </button>
      {saved && <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>Logged.</p>}
    </Shell>
  );
}

export function MenuAssistPage({ hasAccess, businessId }: BaseProps) {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAccess || !businessId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const docs = await fetchDocs(`businesses/${businessId}/products`);
        const dishes = (docs || [])
          .map((data: any) => {
            const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
            const productType = data.productType || meta.productType || data.type || '';
            const dishCategory = data.dishCategory || meta.dishCategory || data.category;
            const isDish =
              productType === 'dish' ||
              (!!dishCategory && productType !== 'ingredient' && productType !== 'product');
            if (!isDish || productType === 'ingredient') return null;
            return {
              id: data.id,
              name: data.name || 'Unnamed',
              category: dishCategory || data.category || 'Other',
              price: Number(data.price ?? data.sellingPrice ?? 0),
              quantity: Number(data.stock ?? data.stockLevel ?? data.quantity ?? 0),
              unit: data.unit || meta.unit || data.portionUnit || meta.portionUnit || 'portion',
              available: data.active !== false && String(data.status || 'active').toLowerCase() !== 'inactive',
              lowStockThreshold: Number(data.lowStockThreshold ?? data.reorderLevel ?? 5),
              preparationTime: Number(data.preparationTime || meta.preparationTime || 0),
            };
          })
          .filter(Boolean) as any[];
        setItems(dishes);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [hasAccess, businessId]);

  if (!hasAccess) return <LockedPage pageName="Menu" />;

  const filtered = items.filter(
    (i) =>
      !q ||
      i.name.toLowerCase().includes(q.toLowerCase()) ||
      String(i.category || '').toLowerCase().includes(q.toLowerCase())
  );

  const qtyColor = (item: any) => {
    if (!item.available || item.quantity <= 0) return 'var(--red, #dc2626)';
    if (item.quantity <= item.lowStockThreshold) return 'var(--amber, #d97706)';
    return 'var(--brand, #16a34a)';
  };

  const qtyLabel = (item: any) => {
    if (!item.available) return 'Unavailable';
    if (item.quantity <= 0) return `0 ${item.unit} left`;
    return `${item.quantity} ${item.unit}${item.quantity === 1 ? '' : 's'} available`;
  };

  return (
    <Shell
      title="Menu / floor"
      subtitle="Live portion counts for dishes. Sell from Record Sale; quantities update when the owner sets stock."
    >
      <input
        style={field}
        placeholder="Search menu item or category…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading ? (
        <p style={{ color: 'var(--t3)' }}>Loading menu…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--t3)' }}>
          No menu dishes yet. Owner can add them under Menu Management with portion quantity and unit.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--bdr, #e2e8f0)',
                background: 'var(--surf, #fff)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{item.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>
                  {item.category}
                  {item.price > 0 ? ` · ${Number(item.price).toLocaleString()}` : ''}
                  {item.preparationTime > 0 ? ` · ${item.preparationTime} min` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: qtyColor(item) }}>
                  {qtyLabel(item)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--t3)', marginTop: 2 }}>
                  Unit: {item.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--t3)', lineHeight: 1.45 }}>
        Take orders in <strong>Record Sale</strong>. Low or zero portion counts mean check with kitchen before promising the dish.
      </p>
    </Shell>
  );
}

export function TransfersPage({ hasAccess, businessId, staffId, staffName }: BaseProps) {
  const [detail, setDetail] = useState('');
  const [qty, setQty] = useState('1');
  const [saved, setSaved] = useState(false);
  if (!hasAccess) return <LockedPage pageName="Transfers" />;
  const submit = async () => {
    if (!businessId || !detail.trim()) return;
    await sbAddDoc(`businesses/${businessId}/stock_transfer_requests`, {
      id: crypto.randomUUID(),
      detail: detail.trim(),
      quantity: Number(qty) || 1,
      staffId: staffId || null,
      staffName: staffName || null,
      created_at: new Date().toISOString(),
      status: 'requested',
    });
    setDetail('');
    setQty('1');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <Shell title="Stock transfers" subtitle="Request a move between store, warehouse, or branch.">
      <input style={field} placeholder="What & from → to *" value={detail} onChange={(e) => setDetail(e.target.value)} />
      <input style={field} type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
      <button type="button" style={btn} onClick={submit}>
        Request transfer
      </button>
      {saved && <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>Request sent.</p>}
    </Shell>
  );
}
