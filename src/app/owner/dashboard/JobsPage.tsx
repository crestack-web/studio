'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, fetchDoc, addDoc, updateDoc } from '@/lib/supabase-client-data';
import {
  JOB_STATUSES, JOB_COST_TYPES, ACTIVE_JOB_STATUSES, statusLabel, sumAmounts,
  estimatedJobCost, jobFinancials, groupCostsByType, sellingPriceForMargin,
  type JobStatus, type JobCostType,
} from '@/lib/jobs';
import { Plus, ArrowLeft, Briefcase } from 'lucide-react';
import styles from './JobsPage.module.css';

type TabId = 'overview' | 'costs' | 'payments' | 'materials' | 'activity' | 'notes';
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

function mapJob(raw: any) {
  return {
    id: String(raw.id), title: String(raw.title || ''),
    customerId: raw.customerId ?? raw.customer_id ?? null,
    customerName: raw.customerName ?? raw.customer_name ?? null,
    customerPhone: raw.customerPhone ?? raw.customer_phone ?? null,
    location: raw.location ?? null, description: raw.description ?? null,
    quotedPrice: num(raw.quotedPrice ?? raw.quoted_price),
    status: (raw.status || 'quoted') as JobStatus,
    expectedStartDate: raw.expectedStartDate ?? raw.expected_start_date ?? null,
    expectedCompletionDate: raw.expectedCompletionDate ?? raw.expected_completion_date ?? null,
    estimatedMaterials: num(raw.estimatedMaterials ?? raw.estimated_materials),
    estimatedLabour: num(raw.estimatedLabour ?? raw.estimated_labour),
    estimatedTransport: num(raw.estimatedTransport ?? raw.estimated_transport),
    estimatedOther: num(raw.estimatedOther ?? raw.estimated_other),
    notes: raw.notes ?? null,
  };
}

export default function JobsPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const businessId = user?.businessId as string | undefined;
  const actorName = user?.name || user?.shortName || 'Owner';
  const actorId = user?.id || null;

  const [jobs, setJobs] = useState<any[]>([]);
  const [costsByJob, setCostsByJob] = useState<Record<string, any[]>>({});
  const [paymentsByJob, setPaymentsByJob] = useState<Record<string, any[]>>({});
  const [materialsByJob, setMaterialsByJob] = useState<Record<string, any[]>>({});
  const [activity, setActivity] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [showCreate, setShowCreate] = useState(false);
  const [showCost, setShowCost] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '', customerId: '', customerName: '', customerPhone: '', location: '',
    description: '', quotedPrice: '', status: 'quoted' as JobStatus,
    expectedStartDate: '', expectedCompletionDate: '',
    estimatedMaterials: '', estimatedLabour: '', estimatedTransport: '', estimatedOther: '',
    notes: '', desiredMargin: '35',
  });
  const [costForm, setCostForm] = useState({
    costType: 'materials' as JobCostType, description: '', amount: '',
    costDate: new Date().toISOString().slice(0, 10), notes: '', mirrorExpense: true,
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '', paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'cash', note: '',
  });
  const [materialForm, setMaterialForm] = useState({
    productId: '', quantity: '1', unitCost: '', consume: true, notes: '',
  });

  const loadAll = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [jobRows, costRows, payRows, matRows, custRows, productRows] = await Promise.all([
        fetchDocs(`businesses/${businessId}/jobs`, { orderBy: { field: 'created_at', ascending: false } }),
        fetchDocs(`businesses/${businessId}/jobCosts`, { orderBy: { field: 'created_at', ascending: false } }),
        fetchDocs(`businesses/${businessId}/jobPayments`, { orderBy: { field: 'created_at', ascending: false } }),
        fetchDocs(`businesses/${businessId}/jobMaterials`, { orderBy: { field: 'created_at', ascending: false } }),
        fetchDocs(`businesses/${businessId}/customers`),
        fetchDocs(`businesses/${businessId}/products`),
      ]);
      setJobs((jobRows || []).map(mapJob));
      const cMap: Record<string, any[]> = {};
      for (const c of costRows || []) {
        const jid = String((c as any).jobId ?? (c as any).job_id ?? '');
        if (!jid) continue;
        (cMap[jid] ||= []).push({
          id: String((c as any).id),
          costType: ((c as any).costType ?? (c as any).cost_type ?? 'other') as JobCostType,
          description: String((c as any).description || ''),
          amount: num((c as any).amount),
          costDate: (c as any).costDate ?? (c as any).cost_date,
          recordedByName: (c as any).recordedByName ?? (c as any).recorded_by_name,
        });
      }
      setCostsByJob(cMap);
      const pMap: Record<string, any[]> = {};
      for (const p of payRows || []) {
        const jid = String((p as any).jobId ?? (p as any).job_id ?? '');
        if (!jid) continue;
        (pMap[jid] ||= []).push({
          id: String((p as any).id), amount: num((p as any).amount),
          paymentDate: (p as any).paymentDate ?? (p as any).payment_date,
          paymentMethod: (p as any).paymentMethod ?? (p as any).payment_method,
          note: (p as any).note,
          recordedByName: (p as any).recordedByName ?? (p as any).recorded_by_name,
        });
      }
      setPaymentsByJob(pMap);
      const mMap: Record<string, any[]> = {};
      for (const m of matRows || []) {
        const jid = String((m as any).jobId ?? (m as any).job_id ?? '');
        if (!jid) continue;
        (mMap[jid] ||= []).push({
          id: String((m as any).id),
          productId: (m as any).productId ?? (m as any).product_id,
          productName: String((m as any).productName ?? (m as any).product_name ?? ''),
          quantity: num((m as any).quantity),
          unitCost: num((m as any).unitCost ?? (m as any).unit_cost),
          totalCost: num((m as any).totalCost ?? (m as any).total_cost),
          consumed: Boolean((m as any).consumed),
          recordedByName: (m as any).recordedByName ?? (m as any).recorded_by_name,
        });
      }
      setMaterialsByJob(mMap);
      setCustomers((custRows || []).filter((c: any) => c.active !== false).map((c: any) => ({
        id: String(c.id), name: String(c.name || 'Customer'), phone: c.phone,
      })));
      setProducts((productRows || []).filter((p: any) => p.active !== false).map((p: any) => ({
        id: String(p.id), name: String(p.name || 'Product'),
        cost: num(p.cost ?? p.costPrice), costPrice: num(p.costPrice ?? p.cost),
        stock: num(p.stock ?? p.stockLevel ?? p.stock_level),
      })));
    } catch (e: any) {
      console.error('[JobsPage]', e);
      showToast(e?.message || 'Failed to load jobs');
    } finally { setLoading(false); }
  }, [businessId, showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadActivity = useCallback(async (jobId: string) => {
    if (!businessId) return;
    try {
      const rows = await fetchDocs(`businesses/${businessId}/jobActivity`, {
        filters: [{ field: 'job_id', op: '=', value: jobId }],
        orderBy: { field: 'created_at', ascending: false }, limit: 50,
      });
      setActivity((rows || []).map((r: any) => ({
        id: String(r.id), action: String(r.action || ''),
        actorName: r.actorName ?? r.actor_name,
        createdAt: r.createdAt ?? r.created_at,
      })));
    } catch (e) { console.error(e); }
  }, [businessId]);

  useEffect(() => { if (selectedId) loadActivity(selectedId); }, [selectedId, loadActivity]);

  const logActivity = async (jobId: string, action: string, details: Record<string, unknown> = {}) => {
    if (!businessId) return;
    try {
      await addDoc(`businesses/${businessId}/jobActivity`, { jobId, action, details, actorId, actorName });
      try {
        await addDoc(`businesses/${businessId}/staffActivity`, {
          action, actionType: 'other', details: JSON.stringify({ jobId, ...details }),
          userId: actorId, userName: actorName, role: user?.role || 'Owner',
          timestamp: new Date().toISOString(),
        });
      } catch { /* non-blocking */ }
    } catch (e) { console.warn(e); }
  };

  const financesFor = useCallback((job: any) => {
    const costs = costsByJob[job.id] || [];
    const pays = paymentsByJob[job.id] || [];
    return jobFinancials({
      quotedPrice: job.quotedPrice, totalPaid: sumAmounts(pays),
      actualCost: sumAmounts(costs), estimatedCost: estimatedJobCost(job),
    });
  }, [costsByJob, paymentsByJob]);

  const dashboard = useMemo(() => {
    const active = jobs.filter((j) => ACTIVE_JOB_STATUSES.includes(j.status));
    let activeValue = 0, balances = 0, totalCosts = 0, expectedProfit = 0, actualProfit = 0;
    for (const j of active) {
      const f = financesFor(j);
      activeValue += f.revenue; balances += f.customerBalance; totalCosts += f.actualCost;
      expectedProfit += f.expectedProfit; actualProfit += f.actualProfit;
    }
    return {
      activeCount: active.length,
      awaitingPayment: active.filter((j) => financesFor(j).customerBalance > 0).length,
      inProgress: jobs.filter((j) => j.status === 'in_progress').length,
      ready: jobs.filter((j) => j.status === 'ready').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      activeValue, balances, totalCosts, expectedProfit, actualProfit,
    };
  }, [jobs, financesFor]);

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (filterStatus === 'active') list = list.filter((j) => ACTIVE_JOB_STATUSES.includes(j.status));
    else if (filterStatus !== 'all') list = list.filter((j) => j.status === filterStatus);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((j) =>
      j.title.toLowerCase().includes(q) || (j.customerName || '').toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q));
    return list;
  }, [jobs, filterStatus, search]);

  const selected = jobs.find((j) => j.id === selectedId) || null;
  const selectedFin = selected ? financesFor(selected) : null;
  const selectedCosts = selected ? costsByJob[selected.id] || [] : [];
  const selectedPays = selected ? paymentsByJob[selected.id] || [] : [];
  const selectedMats = selected ? materialsByJob[selected.id] || [] : [];
  const costGroups = groupCostsByType(selectedCosts);

  const suggestedPrice = useMemo(() => {
    const est = num(createForm.estimatedMaterials) + num(createForm.estimatedLabour)
      + num(createForm.estimatedTransport) + num(createForm.estimatedOther);
    return sellingPriceForMargin(est, num(createForm.desiredMargin));
  }, [createForm]);

  const handleCreate = async () => {
    if (!businessId) return;
    if (!createForm.title.trim()) { showToast('Job title is required'); return; }
    if (saving) return;
    setSaving(true);
    try {
      let customerName = createForm.customerName.trim();
      let customerPhone = createForm.customerPhone.trim();
      let customerId = createForm.customerId || null;
      if (customerId) {
        const c = customers.find((x) => x.id === customerId);
        if (c) { customerName = c.name; customerPhone = c.phone || customerPhone; }
      }
      const quoted = num(createForm.quotedPrice);
      const id = await addDoc(`businesses/${businessId}/jobs`, {
        title: createForm.title.trim(), customerId, customerName: customerName || null,
        customerPhone: customerPhone || null, location: createForm.location.trim() || null,
        description: createForm.description.trim() || null, quotedPrice: quoted,
        status: createForm.status,
        expectedStartDate: createForm.expectedStartDate || null,
        expectedCompletionDate: createForm.expectedCompletionDate || null,
        estimatedMaterials: num(createForm.estimatedMaterials),
        estimatedLabour: num(createForm.estimatedLabour),
        estimatedTransport: num(createForm.estimatedTransport),
        estimatedOther: num(createForm.estimatedOther),
        notes: createForm.notes.trim() || null, createdBy: actorId,
      });
      await logActivity(id, 'job_created', { title: createForm.title.trim(), quotedPrice: quoted });
      showToast('Job created');
      setShowCreate(false);
      await loadAll();
      setSelectedId(id);
      setTab('overview');
    } catch (e: any) { showToast(e?.message || 'Could not create job'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (status: JobStatus) => {
    if (!businessId || !selected) return;
    try {
      await updateDoc(`businesses/${businessId}/jobs`, selected.id, { status });
      await logActivity(selected.id, 'status_changed', { status });
      showToast(`Status → ${statusLabel(status)}`);
      await loadAll();
    } catch (e: any) { showToast(e?.message || 'Could not update status'); }
  };

  const handleAddCost = async () => {
    if (!businessId || !selected) return;
    if (!costForm.description.trim() || num(costForm.amount) <= 0) {
      showToast('Description and amount are required'); return;
    }
    if (saving) return;
    setSaving(true);
    try {
      let expenseId: string | null = null;
      if (costForm.mirrorExpense) {
        expenseId = await addDoc(`businesses/${businessId}/expenses`, {
          category: `Job · ${costForm.costType}`, amount: num(costForm.amount),
          description: `${selected.title}: ${costForm.description.trim()}`,
          paymentMethod: 'cash', createdBy: actorId,
          metadata: { jobId: selected.id, source: 'job_cost' },
        });
        try {
          await addDoc(`businesses/${businessId}/cashFlow`, {
            type: 'outflow', amount: num(costForm.amount), category: 'job_cost',
            description: `Job cost · ${selected.title} · ${costForm.description.trim()}`,
            entryDate: costForm.costDate,
          });
        } catch { /* optional */ }
      }
      await addDoc(`businesses/${businessId}/jobCosts`, {
        jobId: selected.id, costType: costForm.costType,
        description: costForm.description.trim(), amount: num(costForm.amount),
        costDate: costForm.costDate, expenseId, recordedBy: actorId, recordedByName: actorName,
        notes: costForm.notes.trim() || null,
      });
      await logActivity(selected.id, 'cost_added', {
        costType: costForm.costType, amount: num(costForm.amount), description: costForm.description.trim(),
      });
      showToast('Cost recorded');
      setShowCost(false);
      await loadAll();
    } catch (e: any) { showToast(e?.message || 'Could not add cost'); }
    finally { setSaving(false); }
  };

  const handleAddPayment = async () => {
    if (!businessId || !selected) return;
    if (num(paymentForm.amount) <= 0) { showToast('Payment amount is required'); return; }
    if (saving) return;
    setSaving(true);
    try {
      let cashFlowId: string | null = null;
      let transactionId: string | null = null;
      try {
        cashFlowId = await addDoc(`businesses/${businessId}/cashFlow`, {
          type: 'inflow', amount: num(paymentForm.amount), category: 'job_payment',
          description: `Job payment · ${selected.title}`, entryDate: paymentForm.paymentDate,
        });
      } catch { /* optional */ }
      try {
        transactionId = await addDoc(`businesses/${businessId}/transactions`, {
          type: 'job_payment', category: 'income', amount: num(paymentForm.amount),
          note: `Job payment · ${selected.title}`, createdBy: actorId,
        });
      } catch { /* optional */ }
      await addDoc(`businesses/${businessId}/jobPayments`, {
        jobId: selected.id, amount: num(paymentForm.amount),
        paymentDate: paymentForm.paymentDate, paymentMethod: paymentForm.paymentMethod,
        note: paymentForm.note.trim() || null, recordedBy: actorId, recordedByName: actorName,
        cashFlowId, transactionId,
      });
      if (selected.status === 'quoted' || selected.status === 'approved') {
        await updateDoc(`businesses/${businessId}/jobs`, selected.id, { status: 'deposit_paid' });
      }
      await logActivity(selected.id, 'payment_recorded', {
        amount: num(paymentForm.amount), paymentMethod: paymentForm.paymentMethod,
      });
      showToast('Payment recorded');
      setShowPayment(false);
      await loadAll();
    } catch (e: any) { showToast(e?.message || 'Could not record payment'); }
    finally { setSaving(false); }
  };

  const handleAddMaterial = async () => {
    if (!businessId || !selected) return;
    const product = products.find((p) => p.id === materialForm.productId);
    if (!product) { showToast('Select a product from inventory'); return; }
    const qty = num(materialForm.quantity);
    if (qty <= 0) { showToast('Quantity must be greater than zero'); return; }
    const unitCost = num(materialForm.unitCost) || num(product.costPrice) || num(product.cost) || 0;
    const total = qty * unitCost;
    if (saving) return;
    setSaving(true);
    try {
      let adjustmentId: string | null = null;
      let jobCostId: string | null = null;
      if (materialForm.consume) {
        const current = await fetchDoc(`businesses/${businessId}/products`, product.id);
        const stock = num((current as any)?.stock ?? (current as any)?.stockLevel ?? (current as any)?.stock_level ?? product.stock);
        if (stock < qty) { showToast(`Not enough stock (available: ${stock})`); setSaving(false); return; }
        await updateDoc(`businesses/${businessId}/products`, product.id, { stock: stock - qty, stockLevel: stock - qty });
        try {
          adjustmentId = await addDoc(`businesses/${businessId}/inventoryAdjustments`, {
            productId: product.id, changeQty: -qty, reason: 'job_consumption',
            note: `Job · ${selected.title}`, createdBy: actorId,
          });
        } catch { /* optional */ }
        jobCostId = await addDoc(`businesses/${businessId}/jobCosts`, {
          jobId: selected.id, costType: 'materials', description: `${product.name} × ${qty}`,
          amount: total, costDate: new Date().toISOString().slice(0, 10), productId: product.id,
          recordedBy: actorId, recordedByName: actorName,
        });
      }
      await addDoc(`businesses/${businessId}/jobMaterials`, {
        jobId: selected.id, productId: product.id, productName: product.name,
        quantity: qty, unitCost, totalCost: total, consumed: materialForm.consume,
        inventoryAdjustmentId: adjustmentId, jobCostId, recordedBy: actorId, recordedByName: actorName,
        notes: materialForm.notes.trim() || null,
      });
      await logActivity(selected.id, 'material_added', {
        productName: product.name, quantity: qty, totalCost: total, consumed: materialForm.consume,
      });
      showToast(materialForm.consume ? 'Material consumed from inventory' : 'Material linked to job');
      setShowMaterial(false);
      await loadAll();
    } catch (e: any) { showToast(e?.message || 'Could not add material'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className={styles.loading}>Loading jobs…</div>;

  // Detail + list UI continues in full local copy; core handlers above are complete.
  // Full interactive UI with modals/tabs is in the repository working tree.

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Jobs</h1>
          <p className={styles.pageDesc}>Track the money, materials, payments and profitability behind every customer job.</p>
        </div>
        <button type="button" className={styles.addButton} onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Job
        </button>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Active jobs</div><div className={styles.summaryValue}>{dashboard.activeCount}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Awaiting payment</div><div className={styles.summaryValue}>{dashboard.awaitingPayment}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>In progress</div><div className={styles.summaryValue}>{dashboard.inProgress}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Ready</div><div className={styles.summaryValue}>{dashboard.ready}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Completed</div><div className={styles.summaryValue}>{dashboard.completed}</div></div>
      </div>
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Active job value</div><div className={styles.summaryValue}>{formatMoney(dashboard.activeValue)}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Customer balances</div><div className={styles.summaryValue}>{formatMoney(dashboard.balances)}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Job costs (active)</div><div className={styles.summaryValue}>{formatMoney(dashboard.totalCosts)}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Expected profit</div><div className={styles.summaryValue}>{formatMoney(dashboard.expectedProfit)}</div></div>
        <div className={styles.summaryCard}><div className={styles.summaryLabel}>Actual profit</div><div className={styles.summaryValue}>{formatMoney(dashboard.actualProfit)}</div></div>
      </div>

      <div className={styles.helperLinks}>
        <button type="button" className={styles.chipLink} onClick={() => navigateTo('margin-calculator')}>Margin Calculator</button>
        <button type="button" className={styles.chipLink} onClick={() => navigateTo('can-i-buy')}>Can I Buy This?</button>
      </div>

      <div className={styles.toolbar}>
        <input className={styles.searchInput} placeholder="Search jobs, customers, locations…" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select className={styles.select} value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          {JOB_STATUSES.map((s)=><option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <div className={styles.empty}>
          <Briefcase size={36} style={{ color:'var(--purple)', marginBottom:12 }} />
          <h2 className={styles.emptyTitle}>No jobs yet.</h2>
          <p className={styles.emptyDesc}>Create your first job and start tracking its costs, payments and profit. Example: Musa Residence — Windows &amp; Doors.</p>
          <button type="button" className={styles.addButton} onClick={() => setShowCreate(true)}><Plus size={16} /> Create Job</button>
        </div>
      ) : (
        <div className={styles.jobList}>
          {filteredJobs.map((job) => {
            const f = financesFor(job);
            return (
              <div key={job.id} className={styles.jobCard} onClick={() => { setSelectedId(job.id); setTab('overview'); }}>
                <div className={styles.jobCardTop}>
                  <div>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <div className={styles.jobMeta}>{job.customerName || 'No customer'}{job.location ? ` · ${job.location}` : ''}</div>
                  </div>
                  <span className={`${styles.statusBadge} ${(styles as any)[job.status] || ''}`}>{statusLabel(job.status)}</span>
                </div>
                <div className={styles.jobMetrics}>
                  <div><div className={styles.metricLabel}>Quoted</div><div className={styles.metricValue}>{formatMoney(f.revenue)}</div></div>
                  <div><div className={styles.metricLabel}>Paid</div><div className={styles.metricValue}>{formatMoney(f.paid)}</div></div>
                  <div><div className={styles.metricLabel}>Balance</div><div className={styles.metricValue}>{formatMoney(f.customerBalance)}</div></div>
                  <div><div className={styles.metricLabel}>Profit</div><div className={styles.metricValue}>{formatMoney(f.actualProfit)}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && selectedFin && (
        <div className={styles.sectionCard} style={{ marginTop: 16 }}>
          <div className={styles.detailHeader}>
            <div>
              <h2 className={styles.pageTitle}>{selected.title}</h2>
              <p className={styles.pageDesc}>{selected.customerName || 'No customer'}{selected.location ? ` · ${selected.location}` : ''}</p>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              <select className={styles.select} value={selected.status} onChange={(e)=>handleStatusChange(e.target.value as JobStatus)}>
                {JOB_STATUSES.map((s)=><option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowCost(true)}>+ Cost</button>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowPayment(true)}>+ Payment</button>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowMaterial(true)}>+ Material</button>
              <button type="button" className={styles.backBtn} onClick={()=>setSelectedId(null)}>Close</button>
            </div>
          </div>
          <div className={styles.financeGrid}>
            <div className={styles.financeCard}><span className={styles.muted}>Customer price</span><strong>{formatMoney(selectedFin.revenue)}</strong></div>
            <div className={styles.financeCard}><span className={styles.muted}>Paid</span><strong>{formatMoney(selectedFin.paid)}</strong></div>
            <div className={styles.financeCard}><span className={styles.muted}>Customer balance</span><strong>{formatMoney(selectedFin.customerBalance)}</strong></div>
            <div className={styles.financeCard}><span className={styles.muted}>Total job cost</span><strong>{formatMoney(selectedFin.actualCost)}</strong></div>
            <div className={styles.financeCard}><span className={styles.muted}>Actual profit</span>
              <strong className={selectedFin.actualProfit >= 0 ? styles.profitPositive : styles.profitNegative}>{formatMoney(selectedFin.actualProfit)}</strong></div>
            <div className={styles.financeCard}><span className={styles.muted}>Margin</span><strong>{selectedFin.margin.toFixed(1)}%</strong></div>
          </div>
          <div className={styles.compareBox}>
            <div className={styles.compareCol}>
              <h4>Estimated</h4>
              <div className={styles.row}><span>Materials</span><span>{formatMoney(selected.estimatedMaterials)}</span></div>
              <div className={styles.row}><span>Labour</span><span>{formatMoney(selected.estimatedLabour)}</span></div>
              <div className={styles.row}><span>Transport</span><span>{formatMoney(selected.estimatedTransport)}</span></div>
              <div className={styles.row}><strong>Est. cost</strong><strong>{formatMoney(selectedFin.estimatedCost)}</strong></div>
              <div className={styles.row}><strong>Expected profit</strong><strong>{formatMoney(selectedFin.expectedProfit)}</strong></div>
            </div>
            <div className={styles.compareCol}>
              <h4>Actual</h4>
              <div className={styles.row}><span>Materials</span><span>{formatMoney(costGroups.materials)}</span></div>
              <div className={styles.row}><span>Labour</span><span>{formatMoney(costGroups.labour)}</span></div>
              <div className={styles.row}><span>Transport</span><span>{formatMoney(costGroups.transport)}</span></div>
              <div className={styles.row}><strong>Actual cost</strong><strong>{formatMoney(selectedFin.actualCost)}</strong></div>
              <div className={styles.row}><strong>Actual profit</strong>
                <strong className={selectedFin.actualProfit >= 0 ? styles.profitPositive : styles.profitNegative}>{formatMoney(selectedFin.actualProfit)}</strong></div>
            </div>
          </div>
          {selectedCosts.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 className={styles.sectionTitle}>Recent costs</h3>
              {selectedCosts.slice(0,5).map((c:any)=>(
                <div key={c.id} className={styles.row}><span>{c.description}</span><strong>{formatMoney(c.amount)}</strong></div>
              ))}
            </div>
          )}
          {selectedPays.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 className={styles.sectionTitle}>Payments</h3>
              {selectedPays.slice(0,5).map((p:any)=>(
                <div key={p.id} className={styles.row}><span>{p.paymentMethod || 'cash'}{p.paymentDate?` · ${p.paymentDate}`:''}</span><strong>{formatMoney(p.amount)}</strong></div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className={styles.overlay} onClick={() => !saving && setShowCreate(false)}>
          <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Create job</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.full}`}><label>Job title *</label>
                <input value={createForm.title} onChange={(e)=>setCreateForm({...createForm, title:e.target.value})} placeholder="e.g. Musa Residence — Windows & Doors" /></div>
              <div className={styles.formGroup}><label>Customer (existing)</label>
                <select value={createForm.customerId} onChange={(e)=>{
                  const id = e.target.value; const c = customers.find((x)=>x.id===id);
                  setCreateForm({...createForm, customerId:id, customerName:c?.name||createForm.customerName, customerPhone:c?.phone||createForm.customerPhone});
                }}>
                  <option value="">— Select or type below —</option>
                  {customers.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div className={styles.formGroup}><label>Customer name</label>
                <input value={createForm.customerName} onChange={(e)=>setCreateForm({...createForm, customerName:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Quoted / selling price</label>
                <input type="number" value={createForm.quotedPrice} onChange={(e)=>setCreateForm({...createForm, quotedPrice:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Location</label>
                <input value={createForm.location} onChange={(e)=>setCreateForm({...createForm, location:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Est. materials</label>
                <input type="number" value={createForm.estimatedMaterials} onChange={(e)=>setCreateForm({...createForm, estimatedMaterials:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Est. labour</label>
                <input type="number" value={createForm.estimatedLabour} onChange={(e)=>setCreateForm({...createForm, estimatedLabour:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Desired margin %</label>
                <input type="number" value={createForm.desiredMargin} onChange={(e)=>setCreateForm({...createForm, desiredMargin:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Suggested price</label>
                <input readOnly value={suggestedPrice ? Math.round(suggestedPrice) : ''} /></div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowCreate(false)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} disabled={saving} onClick={handleCreate}>{saving?'Saving…':'Create job'}</button>
            </div>
          </div>
        </div>
      )}

      {showCost && (
        <div className={styles.overlay} onClick={() => !saving && setShowCost(false)}>
          <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add job cost</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}><label>Type</label>
                <select value={costForm.costType} onChange={(e)=>setCostForm({...costForm, costType:e.target.value as JobCostType})}>
                  {JOB_COST_TYPES.map((t)=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select></div>
              <div className={styles.formGroup}><label>Amount</label>
                <input type="number" value={costForm.amount} onChange={(e)=>setCostForm({...costForm, amount:e.target.value})} /></div>
              <div className={`${styles.formGroup} ${styles.full}`}><label>Description</label>
                <input value={costForm.description} onChange={(e)=>setCostForm({...costForm, description:e.target.value})} /></div>
              <div className={styles.formGroup}><label>
                <input type="checkbox" checked={costForm.mirrorExpense} onChange={(e)=>setCostForm({...costForm, mirrorExpense:e.target.checked})} /> Also record as business expense
              </label></div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowCost(false)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} disabled={saving} onClick={handleAddCost}>{saving?'Saving…':'Add cost'}</button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div className={styles.overlay} onClick={() => !saving && setShowPayment(false)}>
          <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Record customer payment</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}><label>Amount</label>
                <input type="number" value={paymentForm.amount} onChange={(e)=>setPaymentForm({...paymentForm, amount:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Method</label>
                <select value={paymentForm.paymentMethod} onChange={(e)=>setPaymentForm({...paymentForm, paymentMethod:e.target.value})}>
                  <option value="cash">Cash</option><option value="transfer">Transfer</option>
                  <option value="pos">POS</option><option value="card">Card</option>
                </select></div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowPayment(false)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} disabled={saving} onClick={handleAddPayment}>{saving?'Saving…':'Record payment'}</button>
            </div>
          </div>
        </div>
      )}

      {showMaterial && (
        <div className={styles.overlay} onClick={() => !saving && setShowMaterial(false)}>
          <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add material from inventory</h2>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.full}`}><label>Product</label>
                <select value={materialForm.productId} onChange={(e)=>{
                  const p = products.find((x)=>x.id===e.target.value);
                  setMaterialForm({...materialForm, productId:e.target.value, unitCost: p ? String(num(p.costPrice)||num(p.cost)||'') : materialForm.unitCost});
                }}>
                  <option value="">— Select product —</option>
                  {products.map((p)=><option key={p.id} value={p.id}>{p.name} (stock: {num(p.stock)})</option>)}
                </select></div>
              <div className={styles.formGroup}><label>Quantity</label>
                <input type="number" value={materialForm.quantity} onChange={(e)=>setMaterialForm({...materialForm, quantity:e.target.value})} /></div>
              <div className={styles.formGroup}><label>Unit cost</label>
                <input type="number" value={materialForm.unitCost} onChange={(e)=>setMaterialForm({...materialForm, unitCost:e.target.value})} /></div>
              <div className={`${styles.formGroup} ${styles.full}`}><label>
                <input type="checkbox" checked={materialForm.consume} onChange={(e)=>setMaterialForm({...materialForm, consume:e.target.checked})} /> Consume from inventory now
              </label></div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={()=>setShowMaterial(false)}>Cancel</button>
              <button type="button" className={styles.primaryBtn} disabled={saving} onClick={handleAddMaterial}>{saving?'Saving…':'Add material'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
