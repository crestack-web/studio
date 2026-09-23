'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDocs, addDoc, updateDoc } from '@/lib/supabase-client-data';
import {
  DEFAULT_RECYCLABLE_MATERIALS,
  calcPurchaseTotal,
  calcBalance,
  derivePaymentStatus,
  validatePurchaseInput,
} from '@/lib/recycling';
import { formatCurrency } from '@/lib/currency';
import { Scale } from 'lucide-react';

interface Props {
  hasAccess: boolean;
  businessId: string;
  staffId: string;
  staffName?: string;
  currency?: string;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function MaterialCollectionPage({
  hasAccess,
  businessId,
  staffId,
  staffName = 'Staff',
  currency = 'NGN',
}: Props) {
  const money = (n: number) => formatCurrency(n, currency);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<any[]>([]);
  const [form, setForm] = useState({
    supplierId: '',
    materialId: '',
    weightKg: '',
    pricePerKg: '',
    amountPaid: '',
    paymentMethod: 'cash',
    note: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
  });
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '' });
  const [showNewSupplier, setShowNewSupplier] = useState(false);

  const showMsg = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  const loadAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [purchaseRows, supplierRows, materialRows, priceRows] = await Promise.all([
        fetchDocs(`businesses/${businessId}/materialPurchases`, {
          orderBy: { field: 'created_at', ascending: false },
        }),
        fetchDocs(`businesses/${businessId}/suppliers`),
        fetchDocs(`businesses/${businessId}/recyclableMaterials`),
        fetchDocs(`businesses/${businessId}/materialPrices`, {
          orderBy: { field: 'effective_from', ascending: false },
        }),
      ]);

      let mats = (materialRows || [])
        .filter((m: any) => m.active !== false && m.is_active !== false)
        .map((m: any) => ({
          id: m.id,
          name: m.name,
          unit: m.unit || 'kg',
        }));

      if (!mats.length) {
        for (const def of DEFAULT_RECYCLABLE_MATERIALS) {
          const id = await addDoc(`businesses/${businessId}/recyclableMaterials`, {
            name: def.name,
            unit: def.unit,
            active: true,
          });
          mats.push({ id, name: def.name, unit: def.unit });
        }
      }

      const priceMap: Record<string, number> = {};
      for (const p of priceRows || []) {
        const mid = String((p as any).materialId ?? (p as any).material_id ?? '');
        if (mid && priceMap[mid] == null) {
          priceMap[mid] = num((p as any).pricePerUnit ?? (p as any).price_per_unit);
        }
      }

      setMaterials(mats);
      setPrices(priceMap);
      setSuppliers(
        (supplierRows || [])
          .filter((s: any) => s.active !== false)
          .map((s: any) => ({
            id: s.id,
            name: s.name || s.supplierName || s.businessName,
            phone: s.phone,
            totalPurchases: s.totalPurchases,
            totalPayments: s.totalPayments,
            purchaseCount: s.purchaseCount,
            category: s.category,
          }))
      );
      setRecent(
        (purchaseRows || []).slice(0, 20).map((r: any) => ({
          id: r.id,
          supplierName: r.supplierName ?? r.supplier_name,
          materialName: r.materialName ?? r.material_name,
          weightKg: num(r.weightKg ?? r.weight_kg),
          totalAmount: num(r.totalAmount ?? r.total_amount),
          amountPaid: num(r.amountPaid ?? r.amount_paid),
          purchaseDate: r.purchaseDate ?? r.purchase_date ?? r.created_at,
          recordedByName: r.recordedByName ?? r.recorded_by_name,
        }))
      );
    } catch (e: any) {
      showMsg(e?.message || 'Failed to load collection data');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Auto-fill price when material changes
  useEffect(() => {
    if (!form.materialId) return;
    const p = prices[form.materialId];
    if (p != null && p > 0) {
      setForm((f) => ({ ...f, pricePerKg: String(p) }));
    }
  }, [form.materialId, prices]);

  const weight = num(form.weightKg);
  const pricePerKg = num(form.pricePerKg);
  const amountPaid = num(form.amountPaid);
  const totalAmount = useMemo(
    () => calcPurchaseTotal(weight, pricePerKg),
    [weight, pricePerKg]
  );

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) {
      showMsg('Name and phone required');
      return;
    }
    setSaving(true);
    try {
      const nm = newSupplier.name.trim();
      const id = await addDoc(`businesses/${businessId}/suppliers`, {
        name: nm,
        supplierName: nm,
        businessName: nm,
        phone: newSupplier.phone.trim(),
        active: true,
        status: 'active',
        category: 'recycling',
        totalPurchases: 0,
        totalPayments: 0,
        purchaseCount: 0,
        metadata: { source: 'material_collection_staff' },
      });
      setShowNewSupplier(false);
      setNewSupplier({ name: '', phone: '' });
      await loadAll();
      setForm((f) => ({ ...f, supplierId: id }));
      showMsg('Supplier added');
    } catch (e: any) {
      showMsg(e?.message || 'Could not add supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleRecord = async () => {
    const err = validatePurchaseInput({
      supplierId: form.supplierId,
      materialId: form.materialId,
      weightKg: weight,
      pricePerKg,
      amountPaid,
    });
    if (err) {
      showMsg(err);
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const supplier = suppliers.find((s) => s.id === form.supplierId);
      const material = materials.find((m) => m.id === form.materialId);
      const paid = amountPaid;
      const balance = calcBalance(totalAmount, paid);
      const paymentStatus = derivePaymentStatus(totalAmount, paid);
      let expenseId: string | null = null;

      if (paid > 0) {
        try {
          expenseId = await addDoc(`businesses/${businessId}/expenses`, {
            category: `Material · ${material?.name || 'Recycling'}`,
            amount: paid,
            description: `${material?.name} ${weight} kg from ${supplier?.name} (staff)`,
            paymentMethod: form.paymentMethod,
            createdBy: staffId,
            metadata: {
              source: 'material_purchase',
              weightKg: weight,
              pricePerKg,
              staffId,
            },
          });
        } catch {
          /* */
        }
      }

      await addDoc(`businesses/${businessId}/materialPurchases`, {
        supplierId: form.supplierId,
        supplierName: supplier?.name || '',
        materialId: form.materialId,
        materialName: material?.name || '',
        weightKg: weight,
        pricePerKg,
        totalAmount,
        amountPaid: paid,
        balance,
        paymentStatus,
        paymentMethod: form.paymentMethod,
        note: form.note.trim() || null,
        purchaseDate: form.purchaseDate,
        recordedBy: staffId,
        recordedByName: staffName,
        expenseId,
        cashFlowId: null,
      });

      try {
        await updateDoc(`businesses/${businessId}/suppliers`, form.supplierId, {
          totalPurchases: num(supplier?.totalPurchases) + totalAmount,
          totalPayments: num(supplier?.totalPayments) + paid,
          purchaseCount: num(supplier?.purchaseCount) + 1,
          lastPurchaseDate: form.purchaseDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch {
        /* */
      }

      showMsg('Purchase recorded');
      setForm((f) => ({
        ...f,
        weightKg: '',
        amountPaid: '',
        note: '',
      }));
      await loadAll();
    } catch (e: any) {
      showMsg(e?.message || 'Could not record purchase');
    } finally {
      setSaving(false);
    }
  };

  if (!hasAccess) {
    return (
      <div style={{ padding: 24, color: 'var(--text-3)' }}>
        Material collection is not enabled for your role. Ask the owner to grant access.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-3)' }}>Loading materials…</div>;
  }

  return (
    <div style={{ padding: '12px 14px 88px', maxWidth: 560, margin: '0 auto' }}>
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--purple, #6B3FE7)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 12,
            zIndex: 50,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'color-mix(in srgb, var(--purple, #6B3FE7) 14%, transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--purple, #6B3FE7)',
          }}
        >
          <Scale size={20} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-1)' }}>Collect materials</h1>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
            Uses owner prices · {materials.length} materials
          </p>
        </div>
      </div>

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
          Supplier
          <select
            value={form.supplierId}
            onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
            style={inputStyle}
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.phone ? ` · ${s.phone}` : ''}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setShowNewSupplier((v) => !v)}
          style={{ ...ghostBtn, alignSelf: 'flex-start' }}
        >
          {showNewSupplier ? 'Cancel' : '+ New supplier'}
        </button>
        {showNewSupplier && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              placeholder="Name"
              value={newSupplier.name}
              onChange={(e) => setNewSupplier((s) => ({ ...s, name: e.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Phone"
              value={newSupplier.phone}
              onChange={(e) => setNewSupplier((s) => ({ ...s, phone: e.target.value }))}
              style={inputStyle}
            />
            <button type="button" disabled={saving} onClick={handleCreateSupplier} style={primaryBtn}>
              Save supplier
            </button>
          </div>
        )}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
          Material
          <select
            value={form.materialId}
            onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value }))}
            style={inputStyle}
          >
            <option value="">Select material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (per {m.unit})
                {prices[m.id] != null ? ` · ${money(prices[m.id])}/kg` : ''}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
            Weight (kg)
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.weightKg}
              onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
            Price / kg
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.pricePerKg}
              onChange={(e) => setForm((f) => ({ ...f, pricePerKg: e.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>

        <div
          style={{
            background: 'color-mix(in srgb, var(--purple, #6B3FE7) 10%, var(--surface))',
            borderRadius: 12,
            padding: 12,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--purple, #6B3FE7)', fontWeight: 700 }}>Total</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-1)' }}>{money(totalAmount)}</div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
          Amount paid
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amountPaid}
            onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
          Payment
          <select
            value={form.paymentMethod}
            onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            style={inputStyle}
          >
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="pos">POS</option>
          </select>
        </label>

        <button type="button" disabled={saving} onClick={handleRecord} style={primaryBtn}>
          {saving ? 'Saving…' : 'Record collection'}
        </button>
      </div>

      <h2 style={{ fontSize: 14, margin: '18px 0 8px', color: 'var(--text-1)' }}>Recent</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recent.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: 13, padding: 12 }}>No collections yet</div>
        )}
        {recent.map((r) => (
          <div
            key={r.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>
              {r.materialName} · {r.weightKg} kg
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {r.supplierName} · {money(r.totalAmount)}
              {r.recordedByName ? ` · ${r.recordedByName}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg, var(--surface))',
  color: 'var(--text-1)',
  fontSize: 14,
};

const primaryBtn: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'var(--purple, #6B3FE7)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
};

const ghostBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text-1)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
};
