'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { addDoc, deleteDoc, fetchDoc, fetchDocs, updateDoc } from '@/lib/supabase-client-data';
import { Factory, Plus, X } from 'lucide-react';
import styles from './ProductionPage.module.css';

type MaterialLine = {
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
};

type BatchStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

type Batch = {
  id: string;
  batchNumber: string;
  productName: string;
  productId?: string;
  plannedQty: number;
  actualQty?: number | null;
  unit: string;
  status: BatchStatus;
  priority: 'low' | 'medium' | 'high';
  targetDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  assignedTo?: string;
  materials: MaterialLine[];
  materialCost: number;
  laborCost: number;
  totalCost: number;
  unitCost?: number | null;
  yieldPercent?: number | null;
  notes?: string;
  stockApplied?: boolean;
};

type ProductOpt = { id: string; name: string; unit: string; stock: number; cost: number };

const EMPTY_LINE = (): MaterialLine => ({ name: '', quantity: 0, unit: '', unitCost: 0 });

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function asMaterials(value: unknown): MaterialLine[] {
  const raw = Array.isArray(value) ? value : [];
  return raw.map((m: any) => ({
    productId: m.productId || m.product_id || undefined,
    name: String(m.name || m.materialName || ''),
    quantity: num(m.quantity),
    unit: String(m.unit || ''),
    unitCost: num(m.unitCost ?? m.cost ?? m.unit_cost),
  }));
}

function mapBatch(row: any): Batch {
  return {
    id: row.id,
    batchNumber: row.batchNumber || row.batch_number || 'Batch',
    productName: row.productName || row.product_name || 'Untitled',
    productId: row.productId || row.product_id || undefined,
    plannedQty: num(row.plannedQty ?? row.planned_qty),
    actualQty: row.actualQty ?? row.actual_qty ?? null,
    unit: row.unit || 'pcs',
    status: (row.status || 'planned') as BatchStatus,
    priority: row.priority || 'medium',
    targetDate: row.targetDate || row.target_date || null,
    startedAt: row.startedAt || row.started_at || null,
    completedAt: row.completedAt || row.completed_at || null,
    assignedTo: row.assignedTo || row.assigned_to || '',
    materials: asMaterials(row.materials),
    materialCost: num(row.materialCost ?? row.material_cost),
    laborCost: num(row.laborCost ?? row.labor_cost),
    totalCost: num(row.totalCost ?? row.total_cost),
    unitCost: row.unitCost ?? row.unit_cost ?? null,
    yieldPercent: row.yieldPercent ?? row.yield_percent ?? null,
    notes: row.notes || '',
    stockApplied: Boolean(row.stockApplied ?? row.stock_applied),
  };
}

const STATUS_LABEL: Record<BatchStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

export default function ProductionPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();
  const businessId = user?.businessId;
  const [batches, setBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [finishing, setFinishing] = useState<Batch | null>(null);
  const [actualQty, setActualQty] = useState('');
  const [form, setForm] = useState({
    productName: '',
    productId: '',
    plannedQty: '',
    unit: 'pcs',
    targetDate: '',
    priority: 'medium',
    assignedTo: '',
    notes: '',
    laborCost: '',
    materials: [EMPTY_LINE()] as MaterialLine[],
  });

  const path = businessId ? `businesses/${businessId}/productionBatches` : '';

  async function load() {
    if (!businessId) return;
    setLoading(true);
    try {
      const [rows, productRows] = await Promise.all([
        fetchDocs<any>(`businesses/${businessId}/productionBatches`),
        fetchDocs<any>(`businesses/${businessId}/products`),
      ]);
      setBatches(rows.map(mapBatch).sort((a, b) => (b.targetDate || '').localeCompare(a.targetDate || '')));
      setProducts(
        (productRows || [])
          .filter((p) => !['inactive', 'archived', 'deleted'].includes(String(p.status || '').toLowerCase()))
          .map((p) => ({
            id: p.id,
            name: String(p.name || 'Product'),
            unit: String(p.unit || 'pcs'),
            stock: num(p.stock ?? p.stockLevel ?? p.stock_level),
            cost: num(p.cost ?? p.costPrice),
          })),
      );
    } catch (error) {
      console.error(error);
      showToast('Could not load production batches');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  function resetForm() {
    setForm({
      productName: '',
      productId: '',
      plannedQty: '',
      unit: 'pcs',
      targetDate: '',
      priority: 'medium',
      assignedTo: '',
      notes: '',
      laborCost: '',
      materials: [EMPTY_LINE()],
    });
  }

  function openCreate() {
    setEditing(null);
    resetForm();
    setOpen(true);
  }

  function openEdit(batch: Batch) {
    setEditing(batch);
    setForm({
      productName: batch.productName,
      productId: batch.productId || '',
      plannedQty: String(batch.plannedQty || ''),
      unit: batch.unit,
      targetDate: batch.targetDate ? String(batch.targetDate).slice(0, 10) : '',
      priority: batch.priority,
      assignedTo: batch.assignedTo || '',
      notes: batch.notes || '',
      laborCost: String(batch.laborCost || ''),
      materials: batch.materials.length ? batch.materials : [EMPTY_LINE()],
    });
    setOpen(true);
  }

  function pickFinished(id: string) {
    const product = products.find((p) => p.id === id);
    setForm((f) => ({
      ...f,
      productId: id,
      productName: product?.name || f.productName,
      unit: product?.unit || f.unit,
    }));
  }

  function pickMaterial(index: number, id: string) {
    const product = products.find((p) => p.id === id);
    setForm((f) => {
      const materials = f.materials.slice();
      materials[index] = {
        ...materials[index],
        productId: id || undefined,
        name: product?.name || materials[index].name,
        unit: product?.unit || materials[index].unit,
        unitCost: product ? product.cost : materials[index].unitCost,
      };
      return { ...f, materials };
    });
  }

  const materialCost = form.materials.reduce((sum, m) => sum + num(m.quantity) * num(m.unitCost), 0);
  const labor = num(form.laborCost);
  const totalCost = materialCost + labor;

  async function saveBatch() {
    if (!path) return;
    const name = form.productName.trim();
    if (!name) {
      showToast('Name the product this batch will make');
      return;
    }
    if (num(form.plannedQty) <= 0) {
      showToast('Enter how much you plan to make');
      return;
    }
    const materials = form.materials
      .filter((m) => m.name.trim() && num(m.quantity) > 0)
      .map((m) => ({
        productId: m.productId || null,
        name: m.name.trim(),
        quantity: num(m.quantity),
        unit: m.unit.trim() || form.unit,
        unitCost: num(m.unitCost),
      }));
    const payload = {
      productName: name,
      productId: form.productId || null,
      plannedQty: num(form.plannedQty),
      unit: form.unit.trim() || 'pcs',
      priority: form.priority,
      targetDate: form.targetDate || null,
      assignedTo: form.assignedTo.trim(),
      notes: form.notes.trim(),
      materials,
      materialCost,
      laborCost: labor,
      totalCost,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateDoc(path, editing.id, payload);
        showToast('Batch updated');
      } else {
        await addDoc(path, {
          ...payload,
          batchNumber: `B-${Date.now().toString().slice(-6)}`,
          status: 'planned',
          stockApplied: false,
        });
        showToast('Batch saved');
      }
      setOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      showToast('Could not save this batch');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(batch: Batch, status: BatchStatus) {
    if (!path) return;
    const patch: Record<string, unknown> = { status };
    if (status === 'in_progress' && !batch.startedAt) patch.startedAt = new Date().toISOString();
    try {
      await updateDoc(path, batch.id, patch);
      await load();
    } catch (error) {
      console.error(error);
      showToast('Could not update this batch');
    }
  }

  async function finishBatch() {
    if (!path || !finishing || !businessId) return;
    const made = num(actualQty);
    if (made <= 0) {
      showToast('Enter how much you actually made');
      return;
    }
    const lines = finishing.materials.filter((m) => m.productId);
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId);
      if (product && line.quantity > product.stock + 0.0001) {
        showToast(`${product.name} only has ${product.stock} ${product.unit} in stock`);
        return;
      }
    }
    setSaving(true);
    try {
      if (!finishing.stockApplied) {
        for (const line of lines) {
          const current = await fetchDoc<any>(`businesses/${businessId}/products`, line.productId!);
          const stock = num(current?.stock ?? current?.stockLevel ?? current?.stock_level);
          await updateDoc(`businesses/${businessId}/products`, line.productId!, {
            stock: Math.max(0, stock - line.quantity),
          });
        }
        if (finishing.productId) {
          const current = await fetchDoc<any>(`businesses/${businessId}/products`, finishing.productId);
          const stock = num(current?.stock ?? current?.stockLevel ?? current?.stock_level);
          const unitCost = made > 0 ? finishing.totalCost / made : 0;
          await updateDoc(`businesses/${businessId}/products`, finishing.productId, {
            stock: stock + made,
            cost: Number(unitCost.toFixed(4)),
          });
        }
      }
      const yieldPercent = finishing.plannedQty > 0 ? (made / finishing.plannedQty) * 100 : null;
      await updateDoc(path, finishing.id, {
        status: 'completed',
        actualQty: made,
        completedAt: new Date().toISOString(),
        yieldPercent,
        unitCost: made > 0 ? finishing.totalCost / made : 0,
        stockApplied: true,
      });
      showToast(finishing.productId ? 'Batch finished and stock updated' : 'Batch finished');
      setFinishing(null);
      setActualQty('');
      await load();
    } catch (error) {
      console.error(error);
      showToast('Could not finish this batch');
    } finally {
      setSaving(false);
    }
  }

  async function removeBatch(batch: Batch) {
    if (!path) return;
    if (batch.stockApplied) {
      showToast('This batch already changed stock. Cancel it instead of deleting.');
      return;
    }
    if (!confirm(`Delete ${batch.batchNumber}?`)) return;
    try {
      await deleteDoc(path, batch.id);
      await load();
    } catch (error) {
      console.error(error);
      showToast('Could not delete this batch');
    }
  }

  const visible = useMemo(() => {
    return batches.filter((b) => {
      const q = query.trim().toLowerCase();
      const matches =
        !q ||
        b.productName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q);
      return matches && (statusFilter === 'all' || b.status === statusFilter);
    });
  }, [batches, query, statusFilter]);

  const openCount = batches.filter((b) => b.status === 'planned' || b.status === 'in_progress').length;
  const madeUnits = batches.reduce((sum, b) => sum + num(b.actualQty), 0);
  const spend = batches.reduce((sum, b) => sum + num(b.totalCost), 0);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <div className={styles.spinner} />
          <p>Loading production…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.heading}>Production</h1>
          <p className={styles.sub}>
            Record a batch: what you are making, the raw materials it uses, and what actually came out.
          </p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={openCreate}>
          <Plus size={18} />
          New batch
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Open batches</p>
            <p className={styles.statValue}>{openCount}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Finished output</p>
            <p className={styles.statValue}>{madeUnits.toLocaleString()}</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <p className={styles.statLabel}>Batch cost</p>
            <p className={styles.statValue}>{formatMoney(spend)}</p>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.filterInput}
          placeholder="Search a product or batch"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All batches</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Finished</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className={styles.emptyState}>
          <Factory size={36} />
          <p>No batches yet</p>
          <button type="button" className={styles.addMaterialButton} onClick={openCreate}>
            Record the first batch
          </button>
        </div>
      ) : (
        <div className={styles.batchList}>
          {visible.map((batch) => (
            <article key={batch.id} className={styles.batchCard}>
              <div className={styles.batchTop}>
                <div>
                  <p className={styles.batchNo}>{batch.batchNumber}</p>
                  <h2>{batch.productName}</h2>
                  <p className={styles.batchMeta}>
                    Plan {batch.plannedQty} {batch.unit}
                    {batch.actualQty != null ? ` · Made ${batch.actualQty} ${batch.unit}` : ''}
                    {batch.yieldPercent != null ? ` · ${Number(batch.yieldPercent).toFixed(0)}% yield` : ''}
                  </p>
                </div>
                <span className={`${styles.badge} ${styles[batch.status === 'in_progress' ? 'inProgress' : batch.status]}`}>
                  {STATUS_LABEL[batch.status]}
                </span>
              </div>
              {batch.materials.length > 0 && (
                <p className={styles.materialsLine}>
                  Materials: {batch.materials.map((m) => `${m.name} ${m.quantity}${m.unit ? ` ${m.unit}` : ''}`).join(' · ')}
                </p>
              )}
              <p className={styles.batchMeta}>
                Cost {formatMoney(batch.totalCost)}
                {batch.unitCost ? ` · ${formatMoney(Number(batch.unitCost))} each` : ''}
                {batch.targetDate ? ` · Due ${String(batch.targetDate).slice(0, 10)}` : ''}
                {batch.assignedTo ? ` · ${batch.assignedTo}` : ''}
              </p>
              <div className={styles.actionButtons}>
                {batch.status === 'planned' && (
                  <button type="button" className={styles.iconButtonStart} onClick={() => setStatus(batch, 'in_progress')}>
                    Start
                  </button>
                )}
                {batch.status === 'in_progress' && (
                  <button
                    type="button"
                    className={styles.iconButtonComplete}
                    onClick={() => {
                      setFinishing(batch);
                      setActualQty(String(batch.plannedQty || ''));
                    }}
                  >
                    Record output
                  </button>
                )}
                {batch.status !== 'completed' && (
                  <button type="button" className={styles.iconButtonEdit} onClick={() => openEdit(batch)}>
                    Edit
                  </button>
                )}
                {batch.status !== 'completed' && batch.status !== 'cancelled' && (
                  <button type="button" className={styles.iconButtonCancel} onClick={() => setStatus(batch, 'cancelled')}>
                    Cancel
                  </button>
                )}
                {!batch.stockApplied && (
                  <button type="button" className={styles.iconButtonDelete} onClick={() => removeBatch(batch)}>
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{editing ? 'Edit batch' : 'New batch'}</h2>
              <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.form}>
              <label className={styles.formGroup}>
                <span className={styles.formLabel}>What are you making?</span>
                <input
                  className={styles.formInput}
                  list="finished-products"
                  value={form.productName}
                  placeholder="Soap, bread, fabric, bottled water…"
                  onChange={(e) => setForm({ ...form, productName: e.target.value, productId: '' })}
                />
                <datalist id="finished-products">
                  {products.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                <select className={styles.formSelect} value={form.productId} onChange={(e) => pickFinished(e.target.value)}>
                  <option value="">Link to an inventory product (optional)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.stock} {p.unit} in stock
                    </option>
                  ))}
                </select>
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>How much do you plan to make?</span>
                  <input className={styles.formInput} inputMode="decimal" value={form.plannedQty} onChange={(e) => setForm({ ...form, plannedQty: e.target.value })} />
                </label>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Unit</span>
                  <input className={styles.formInput} value={form.unit} placeholder="pcs, kg, litres, cartons" onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </label>
              </div>
              <div className={styles.materialsSection}>
                <div className={styles.materialsHeader}>
                  <span className={styles.formLabel}>Raw materials</span>
                  <button type="button" className={styles.addMaterialButton} onClick={() => setForm({ ...form, materials: [...form.materials, EMPTY_LINE()] })}>
                    Add material
                  </button>
                </div>
                {form.materials.map((line, index) => (
                  <div key={index} className={styles.materialRow}>
                    <select className={styles.formSelect} value={line.productId || ''} onChange={(e) => pickMaterial(index, e.target.value)}>
                      <option value="">From inventory or type below</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.stock} {p.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      className={styles.formInput}
                      placeholder="Material name"
                      value={line.name}
                      onChange={(e) => {
                        const materials = form.materials.slice();
                        materials[index] = { ...line, name: e.target.value };
                        setForm({ ...form, materials });
                      }}
                    />
                    <input
                      className={styles.formInput}
                      inputMode="decimal"
                      placeholder="Qty"
                      value={line.quantity || ''}
                      onChange={(e) => {
                        const materials = form.materials.slice();
                        materials[index] = { ...line, quantity: num(e.target.value) };
                        setForm({ ...form, materials });
                      }}
                    />
                    <input
                      className={styles.formInput}
                      placeholder="Unit"
                      value={line.unit}
                      onChange={(e) => {
                        const materials = form.materials.slice();
                        materials[index] = { ...line, unit: e.target.value };
                        setForm({ ...form, materials });
                      }}
                    />
                    <input
                      className={styles.formInput}
                      inputMode="decimal"
                      placeholder="Cost / unit"
                      value={line.unitCost || ''}
                      onChange={(e) => {
                        const materials = form.materials.slice();
                        materials[index] = { ...line, unitCost: num(e.target.value) };
                        setForm({ ...form, materials });
                      }}
                    />
                    <button
                      type="button"
                      className={styles.removeMaterialButton}
                      onClick={() => setForm({ ...form, materials: form.materials.filter((_, i) => i !== index) })}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <p className={styles.batchMeta}>Materials {formatMoney(materialCost)}</p>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Labour cost</span>
                  <input className={styles.formInput} inputMode="decimal" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} />
                </label>
                <label className={styles.formGroup}>
                  <span className={styles.formLabel}>Needed by</span>
                  <input className={styles.formInput} type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
                </label>
              </div>
              <label className={styles.formGroup}>
                <span className={styles.formLabel}>Who is making it</span>
                <input className={styles.formInput} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
              </label>
              <label className={styles.formGroup}>
                <span className={styles.formLabel}>Notes</span>
                <textarea className={styles.formTextarea} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <div className={styles.costSummary}>
                <div className={styles.costSummaryRow}>
                  <span className={styles.costSummaryLabel}>Batch cost</span>
                  <span className={styles.costSummaryValue}>{formatMoney(totalCost)}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalButton} onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className={styles.modalButtonPrimary} disabled={saving} onClick={saveBatch}>
                {saving ? 'Saving…' : 'Save batch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {finishing && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>What came out?</h2>
              <button type="button" className={styles.closeButton} onClick={() => setFinishing(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className={styles.sub}>
              {finishing.productName} was planned at {finishing.plannedQty} {finishing.unit}. Enter the quantity you actually finished.
            </p>
            <label className={styles.formGroup}>
              <span className={styles.formLabel}>Finished quantity ({finishing.unit})</span>
              <input className={styles.formInput} inputMode="decimal" value={actualQty} onChange={(e) => setActualQty(e.target.value)} />
            </label>
            <p className={styles.batchMeta}>
              {finishing.productId
                ? 'This adds the finished quantity to that product and removes the linked raw materials from stock.'
                : 'This batch is not linked to a product, so only the batch record is saved. Link a product next time to update stock.'}
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalButton} onClick={() => setFinishing(null)}>Back</button>
              <button type="button" className={styles.modalButtonPrimary} disabled={saving} onClick={finishBatch}>
                {saving ? 'Saving…' : 'Finish batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
