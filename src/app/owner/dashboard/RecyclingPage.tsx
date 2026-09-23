'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc } from '@/lib/supabase-client-data';
import {
  DEFAULT_RECYCLABLE_MATERIALS,
  calcPurchaseTotal,
  calcBalance,
  derivePaymentStatus,
  paymentStatusLabel,
  validatePurchaseInput,
  type MaterialPaymentStatus,
} from '@/lib/recycling';
import { Plus, Scale, ArrowLeft } from 'lucide-react';
import styles from './RecyclingPage.module.css';

const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
type View = 'dashboard' | 'purchase' | 'suppliers' | 'prices' | 'supplier';

export default function RecyclingPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const businessId = user?.businessId as string | undefined;
  const actorName = user?.name || user?.shortName || 'Owner';
  const actorId = user?.id || null;

  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [form, setForm] = useState({
    supplierId: '', materialId: '', weightKg: '', pricePerKg: '', amountPaid: '',
    paymentMethod: 'cash', note: '', purchaseDate: new Date().toISOString().slice(0, 10),
  });
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '' });
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const weight = num(form.weightKg);
  const pricePerKg = num(form.pricePerKg);
  const total = calcPurchaseTotal(weight, pricePerKg);
  const amountPaid = form.amountPaid === '' ? total : num(form.amountPaid);

  const loadAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [purchaseRows, supplierRows, materialRows, priceRows] = await Promise.all([
        fetchDocs(`businesses/${businessId}/materialPurchases`, { orderBy: { field: 'created_at', ascending: false } }),
        fetchDocs(`businesses/${businessId}/suppliers`),
        fetchDocs(`businesses/${businessId}/recyclableMaterials`),
        fetchDocs(`businesses/${businessId}/materialPrices`, { orderBy: { field: 'effective_from', ascending: false } }),
      ]);
      let mats = (materialRows || []).map((m: any) => ({
        id: String(m.id), name: String(m.name || ''), unit: m.unit || 'kg', active: m.active !== false,
      }));
      if (!mats.length) {
        for (const def of DEFAULT_RECYCLABLE_MATERIALS) {
          const id = await addDoc(`businesses/${businessId}/recyclableMaterials`, { name: def.name, unit: def.unit, active: true });
          mats.push({ id, name: def.name, unit: def.unit, active: true });
        }
      }
      const priceMap: Record<string, number> = {};
      for (const p of priceRows || []) {
        const mid = String((p as any).materialId ?? (p as any).material_id ?? '');
        if (mid && priceMap[mid] == null) priceMap[mid] = num((p as any).pricePerUnit ?? (p as any).price_per_unit);
      }
      setMaterials(mats.filter((m) => m.active));
      setPrices(priceMap);
      setPriceEdits(Object.fromEntries(mats.map((m) => [m.id, String(priceMap[m.id] ?? '')])));
      setSuppliers((supplierRows || []).filter((s: any) => s.active !== false).map((s: any) => ({
        id: String(s.id), name: String(s.name || s.supplierName || s.businessName || 'Supplier'),
        phone: s.phone || '', address: s.address || '',
      })));
      setPurchases((purchaseRows || []).map((r: any) => ({
        id: String(r.id),
        supplierId: r.supplierId ?? r.supplier_id,
        supplierName: String(r.supplierName ?? r.supplier_name ?? ''),
        materialId: r.materialId ?? r.material_id,
        materialName: String(r.materialName ?? r.material_name ?? ''),
        weightKg: num(r.weightKg ?? r.weight_kg),
        pricePerKg: num(r.pricePerKg ?? r.price_per_kg),
        totalAmount: num(r.totalAmount ?? r.total_amount),
        amountPaid: num(r.amountPaid ?? r.amount_paid),
        balance: num(r.balance),
        paymentStatus: (r.paymentStatus ?? r.payment_status ?? 'unpaid') as MaterialPaymentStatus,
        purchaseDate: r.purchaseDate ?? r.purchase_date,
        recordedByName: r.recordedByName ?? r.recorded_by_name,
      })));
    } catch (e: any) {
      console.error('[RecyclingPage]', e);
      showToast(e?.message || 'Failed to load recycling data');
    } finally { setLoading(false); }
  }, [businessId, showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const metrics = useMemo(() => {
    const today = purchases.filter((p) => String(p.purchaseDate).slice(0, 10) === todayStr);
    const sumKg = (rows: any[]) => rows.reduce((s, r) => s + num(r.weightKg), 0);
    const sumAmt = (rows: any[]) => rows.reduce((s, r) => s + num(r.amountPaid), 0);
    const pet = purchases.filter((p) => /pet/i.test(p.materialName));
    const petKg = sumKg(pet);
    const petSpend = pet.reduce((s, r) => s + num(r.totalAmount), 0);
    return {
      todayKg: sumKg(today), todaySpend: sumAmt(today), todayTx: today.length,
      suppliersToday: new Set(today.map((p) => p.supplierId).filter(Boolean)).size,
      petKg, avgPet: petKg > 0 ? petSpend / petKg : 0,
      monthKg: sumKg(purchases.filter((p) => String(p.purchaseDate).slice(0, 7) === todayStr.slice(0, 7))),
    };
  }, [purchases, todayStr]);

  const supplierStats = useCallback((supplierId: string) => {
    const rows = purchases.filter((p) => p.supplierId === supplierId);
    return { totalKg: rows.reduce((s, r) => s + num(r.weightKg), 0), totalPaid: rows.reduce((s, r) => s + num(r.amountPaid), 0), count: rows.length, rows };
  }, [purchases]);

  const handleCreateSupplier = async () => {
    if (!businessId || !newSupplier.name.trim() || !newSupplier.phone.trim()) { showToast('Name and phone are required'); return; }
    setSaving(true);
    try {
      const id = await addDoc(`businesses/${businessId}/suppliers`, {
        name: newSupplier.name.trim(), supplierName: newSupplier.name.trim(), businessName: newSupplier.name.trim(),
        phone: newSupplier.phone.trim(), address: newSupplier.address.trim() || null, active: true, status: 'active',
      });
      showToast('Supplier created'); setShowNewSupplier(false); setNewSupplier({ name: '', phone: '', address: '' });
      await loadAll(); setForm((f) => ({ ...f, supplierId: id }));
    } catch (e: any) { showToast(e?.message || 'Could not create supplier'); }
    finally { setSaving(false); }
  };

  const handleSavePrice = async (materialId: string) => {
    if (!businessId) return;
    const val = num(priceEdits[materialId]);
    if (val < 0) { showToast('Price cannot be negative'); return; }
    setSaving(true);
    try {
      await addDoc(`businesses/${businessId}/materialPrices`, { materialId, pricePerUnit: val, effectiveFrom: new Date().toISOString(), createdBy: actorId });
      showToast('Price updated'); await loadAll();
    } catch (e: any) { showToast(e?.message || 'Could not save price'); }
    finally { setSaving(false); }
  };

  const handleRecordPurchase = async () => {
    if (!businessId) return;
    const err = validatePurchaseInput({ supplierId: form.supplierId, materialId: form.materialId, weightKg: weight, pricePerKg, amountPaid });
    if (err) { showToast(err); return; }
    if (saving) return;
    setSaving(true);
    try {
      const supplier = suppliers.find((s) => s.id === form.supplierId);
      const material = materials.find((m) => m.id === form.materialId);
      const totalAmount = calcPurchaseTotal(weight, pricePerKg);
      const paid = amountPaid;
      const balance = calcBalance(totalAmount, paid);
      const paymentStatus = derivePaymentStatus(totalAmount, paid);
      let expenseId: string | null = null;
      let cashFlowId: string | null = null;
      if (paid > 0) {
        try {
          expenseId = await addDoc(`businesses/${businessId}/expenses`, {
            category: `Material · ${material?.name || 'Recycling'}`, amount: paid,
            description: `${material?.name} ${weight} kg from ${supplier?.name}`, paymentMethod: form.paymentMethod, createdBy: actorId,
            metadata: { source: 'material_purchase', weightKg: weight, pricePerKg },
          });
        } catch { /* */ }
        try {
          cashFlowId = await addDoc(`businesses/${businessId}/cashFlow`, {
            type: 'outflow', amount: paid, category: 'material_purchase',
            description: `Material purchase · ${material?.name} · ${weight} kg · ${supplier?.name}`, entryDate: form.purchaseDate,
          });
        } catch { /* */ }
      }
      await addDoc(`businesses/${businessId}/materialPurchases`, {
        supplierId: form.supplierId, supplierName: supplier?.name || '', materialId: form.materialId, materialName: material?.name || '',
        weightKg: weight, pricePerKg, totalAmount, amountPaid: paid, balance, paymentStatus, paymentMethod: form.paymentMethod,
        note: form.note.trim() || null, purchaseDate: form.purchaseDate, recordedBy: actorId, recordedByName: actorName, expenseId, cashFlowId,
      });
      try {
        await addDoc(`businesses/${businessId}/staffActivity`, {
          action: 'material_purchase', actionType: 'other',
          details: JSON.stringify({ supplier: supplier?.name, material: material?.name, weightKg: weight, totalAmount, amountPaid: paid }),
          userId: actorId, userName: actorName, role: user?.role || 'Owner', timestamp: new Date().toISOString(),
        });
      } catch { /* */ }
      showToast('Purchase recorded');
      setForm({ supplierId: form.supplierId, materialId: form.materialId, weightKg: '', pricePerKg: form.pricePerKg, amountPaid: '', paymentMethod: 'cash', note: '', purchaseDate: new Date().toISOString().slice(0, 10) });
      await loadAll(); setView('dashboard');
    } catch (e: any) { showToast(e?.message || 'Could not record purchase'); }
    finally { setSaving(false); }
  };

  const statusBadge = (status: string) => {
    const cls = status === 'paid' ? styles.badgePaid : status === 'partial' ? styles.badgePartial : styles.badgeUnpaid;
    return <span className={`${styles.badge} ${cls}`}>{paymentStatusLabel(status)}</span>;
  };

  if (loading) return <div className={styles.page}><div className={styles.empty}>Loading recycling data…</div></div>;

  if (view === 'purchase') {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <button type="button" className={styles.backBtn} onClick={() => setView('dashboard')} aria-label="Back">
            <ArrowLeft size={16} /><span>Back</span>
          </button>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.title}>Record purchase</h1>
          </div>
        </div>
        <p className={styles.sub}>Weigh · price · pay — while the supplier waits.</p>
        <div className={styles.panel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className={styles.field}>
            <label>Supplier</label>
            <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.phone ? ` · ${s.phone}` : ''}</option>)}
            </select>
            <button type="button" className={styles.btnGhost} style={{ marginTop: 6 }} onClick={() => setShowNewSupplier(true)}>+ New supplier</button>
          </div>
          <div className={styles.field}>
            <label>Material</label>
            <select value={form.materialId} onChange={(e) => {
              const id = e.target.value;
              setForm((f) => ({ ...f, materialId: id, pricePerKg: prices[id] != null ? String(prices[id]) : f.pricePerKg }));
            }}>
              <option value="">Select material</option>
              {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>Weight (kg)</label>
            <input type="number" inputMode="decimal" step="0.001" min="0" placeholder="e.g. 42.5" value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label>Price per kg</label>
            <input type="number" inputMode="decimal" step="0.01" min="0" value={form.pricePerKg}
              onChange={(e) => setForm((f) => ({ ...f, pricePerKg: e.target.value }))} />
          </div>
          <div className={styles.totalBox}>
            <div className={styles.totalLabel}>Total payable</div>
            <div className={styles.totalValue}>{formatMoney(total)}</div>
            <div style={{ fontSize: 12, color: '#555568', marginTop: 4 }}>{weight || 0} kg × {formatMoney(pricePerKg)}/kg</div>
          </div>
          <div className={styles.field}>
            <label>Amount paid</label>
            <input type="number" inputMode="decimal" step="0.01" min="0"
              value={form.amountPaid === '' ? (total > 0 ? String(total) : '') : form.amountPaid}
              onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} />
          </div>
          <div className={styles.field}>
            <label>Payment method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
              <option value="pos">POS</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Date</label>
            <input type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
          </div>
          <button type="button" className={styles.btnPrimary} disabled={saving} onClick={handleRecordPurchase}>
            {saving ? 'Saving…' : 'Confirm purchase'}
          </button>
        </div>
        {showNewSupplier && (
          <div className={styles.modalOverlay} onClick={() => setShowNewSupplier(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>New supplier</h2>
              <div className={styles.field}><label>Full name</label><input value={newSupplier.name} onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))} /></div>
              <div className={styles.field}><label>Phone</label><input value={newSupplier.phone} onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))} /></div>
              <button type="button" className={styles.btnPrimary} disabled={saving} onClick={handleCreateSupplier}>Save supplier</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'prices') {
    return (
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <button type="button" className={styles.backBtn} onClick={() => setView('dashboard')} aria-label="Back">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.title}>Buying prices</h1>
            <p className={styles.sub}>Price/kg · history kept on old buys</p>
          </div>
        </div>
        <div className={styles.list}>
          {materials.map((m) => (
            <div key={m.id} className={`${styles.panel} ${styles.priceRow}`}>
              <div className={styles.priceInfo}>
                <div className={styles.priceName}>{m.name}</div>
                <div className={styles.priceUnit}>per {m.unit}</div>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                className={styles.priceInput}
                value={priceEdits[m.id] ?? ''}
                onChange={(e) => setPriceEdits((p) => ({ ...p, [m.id]: e.target.value }))}
              />
              <button type="button" className={styles.btnGhost} disabled={saving} onClick={() => handleSavePrice(m.id)}>
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'suppliers' || view === 'supplier') {
    const selected = suppliers.find((s) => s.id === selectedSupplierId);
    const stats = selectedSupplierId ? supplierStats(selectedSupplierId) : null;
    if (view === 'supplier' && selected && stats) {
      return (
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <button type="button" className={styles.backBtn} onClick={() => { setView('suppliers'); setSelectedSupplierId(null); }} aria-label="Back">
              <ArrowLeft size={16} /><span>Back</span>
            </button>
            <div className={styles.pageHeaderText}>
              <h1 className={styles.title}>{selected.name}</h1>
              <p className={styles.sub}>{selected.phone}</p>
            </div>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metric}><div className={styles.metricLabel}>Total kg</div><div className={styles.metricValue}>{stats.totalKg.toFixed(1)}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>Total paid</div><div className={styles.metricValue}>{formatMoney(stats.totalPaid)}</div></div>
            <div className={styles.metric}><div className={styles.metricLabel}>Deliveries</div><div className={styles.metricValue}>{stats.count}</div></div>
          </div>
          <div className={styles.list}>
            {stats.rows.map((r) => (
              <div key={r.id} className={styles.row} style={{ cursor: 'default' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{r.materialName} · {r.weightKg} kg</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{String(r.purchaseDate).slice(0, 10)} · {formatMoney(r.pricePerKg)}/kg · {r.recordedByName || '—'}</div>
                </div>
                <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>{formatMoney(r.totalAmount)}</div>{statusBadge(r.paymentStatus)}</div>
              </div>
            ))}
            {!stats.rows.length && <div className={styles.empty}>No transactions yet</div>}
          </div>
        </div>
      );
    }
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button type="button" className={styles.btnGhost} onClick={() => setView('dashboard')}><ArrowLeft size={16} /> Back</button>
          <button type="button" className={styles.btnPrimary} onClick={() => setShowNewSupplier(true)}><Plus size={16} /> Supplier</button>
        </div>
        <h1 className={styles.title}>Suppliers</h1>
        <div className={styles.list}>
          {suppliers.map((s) => {
            const st = supplierStats(s.id);
            return (
              <div key={s.id} className={styles.row} onClick={() => { setSelectedSupplierId(s.id); setView('supplier'); }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{st.totalKg.toFixed(1)} kg · {formatMoney(st.totalPaid)} · {st.count} deliveries</div>
                </div>
              </div>
            );
          })}
          {!suppliers.length && <div className={styles.empty}>No suppliers yet</div>}
        </div>
        {showNewSupplier && (
          <div className={styles.modalOverlay} onClick={() => setShowNewSupplier(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 className={styles.modalTitle}>New supplier</h2>
              <div className={styles.field}><label>Full name</label><input value={newSupplier.name} onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))} /></div>
              <div className={styles.field}><label>Phone</label><input value={newSupplier.phone} onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))} /></div>
              <button type="button" className={styles.btnPrimary} disabled={saving} onClick={handleCreateSupplier}>Save supplier</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Recycling</h1>
          <p className={styles.sub}>Material collection · weigh · pay</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={() => setView('purchase')}><Scale size={16} /> Record Purchase</button>
      </div>
      <div className={styles.metrics}>
        <div className={styles.metric}><div className={styles.metricLabel}>Today kg</div><div className={styles.metricValue}>{metrics.todayKg.toFixed(1)}</div></div>
        <div className={styles.metric}><div className={styles.metricLabel}>Today spent</div><div className={styles.metricValue}>{formatMoney(metrics.todaySpend)}</div></div>
        <div className={styles.metric}><div className={styles.metricLabel}>Today tx</div><div className={styles.metricValue}>{metrics.todayTx}</div></div>
        <div className={styles.metric}><div className={styles.metricLabel}>Suppliers today</div><div className={styles.metricValue}>{metrics.suppliersToday}</div></div>
        <div className={styles.metric}><div className={styles.metricLabel}>This month kg</div><div className={styles.metricValue}>{metrics.monthKg.toFixed(1)}</div></div>
        <div className={styles.metric}><div className={styles.metricLabel}>PET kg</div><div className={styles.metricValue}>{metrics.petKg.toFixed(1)}</div></div>
        <div className={styles.metric}><div className={styles.metricLabel}>Avg PET / kg</div><div className={styles.metricValue}>{formatMoney(metrics.avgPet)}</div></div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" className={styles.btnGhost} onClick={() => setView('suppliers')}>Suppliers</button>
        <button type="button" className={styles.btnGhost} onClick={() => setView('prices')}>Prices / kg</button>
      </div>
      <div className={styles.panel}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Recent purchases</div>
        <div className={styles.list}>
          {purchases.slice(0, 20).map((r) => (
            <div key={r.id} className={styles.row} style={{ cursor: 'default' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{r.supplierName} · {r.materialName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{String(r.purchaseDate).slice(0, 10)} · {r.weightKg} kg · {formatMoney(r.pricePerKg)}/kg{r.recordedByName ? ` · ${r.recordedByName}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700 }}>{formatMoney(r.totalAmount)}</div>{statusBadge(r.paymentStatus)}</div>
            </div>
          ))}
          {!purchases.length && <div className={styles.empty}>No purchases yet. Tap Record Purchase when a supplier arrives.</div>}
        </div>
      </div>
    </div>
  );
}
