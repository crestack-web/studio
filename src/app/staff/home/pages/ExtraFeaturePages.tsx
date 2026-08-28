'use client';

import React, { useEffect, useState } from 'react';
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
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  if (!hasAccess) return <LockedPage pageName="Shift close" />;

  const submit = async () => {
    if (!businessId) return;
    await sbAddDoc(`businesses/${businessId}/shift_closes`, {
      id: crypto.randomUUID(),
      countedCash: Number(counted) || 0,
      note: note.trim(),
      staffId: staffId || null,
      staffName: staffName || null,
      created_at: new Date().toISOString(),
    });
    setCounted('');
    setNote('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Shell title="Shift close" subtitle="Count the cash drawer and submit for owner review.">
      <input style={field} type="number" placeholder="Cash counted *" value={counted} onChange={(e) => setCounted(e.target.value)} />
      <input style={field} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" style={btn} onClick={submit}>
        Submit shift close
      </button>
      {saved && <p style={{ color: 'var(--brand)', marginTop: 10, fontWeight: 600 }}>Submitted.</p>}
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
