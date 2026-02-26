'use client';

import React, { useState } from 'react';
import { useApp } from './AppContext';
import styles from './Cashflowpage.module.css';

// ═══════════════════════════════════════════
//  CashflowPage — 4 action forms + transaction log
// ═══════════════════════════════════════════

type ActionId = 'add-stock' | 'reduce-stock' | 'add-money' | 'take-money' | null;

const ACTIONS = [
  { id: 'cashflow'    as ActionId, icon: '💵', name: 'Cashflow',     desc: 'View and manage your cashflow',     color: 'var(--green-bg, #E6F5EE)' },
  { id: 'reduce-stock' as ActionId, icon: '📉', name: 'Reduce Stock',  desc: 'Record stock reduction — damage, theft, spoilage, or correction',  color: 'var(--amber-bg, #FEF3C7)' },
  { id: 'add-money'    as ActionId, icon: '💰', name: 'Add Money',     desc: 'Record money coming in — sales, loans, investor funds, refunds',    color: 'rgba(107,63,231,.08)' },
  { id: 'take-money'   as ActionId, icon: '💸', name: 'Take Money',    desc: 'Record money going out — withdrawals, payments, owner drawings',    color: 'var(--red-bg, #FDECEA)' },
];

const PRODUCTS = [
  'Premium Ribbed Polo Co-Ord (Stock: 30)',
  'School Bag (Stock: 20)',
  'The Proof Is You (Stock: 15)',
  'Sabuni Premium Bar (Stock: 40)',
];

const TRANSACTIONS = [
  { date: 'Feb 15', type: 'Sale',    desc: 'Walk-in customer',       product: 'Polo Co-Ord', amount: '+₦26,000', credit: true  },
  { date: 'Feb 14', type: 'Expense', desc: 'Restocking — Sabuni Bar', product: 'Sabuni Bar ×20', amount: '-₦40,000', credit: false },
  { date: 'Feb 13', type: 'Sale',    desc: 'Online order #1042',     product: 'School Bag',  amount: '+₦10,000', credit: true  },
  { date: 'Feb 12', type: 'Drawing', desc: 'Owner withdrawal',       product: '—',           amount: '-₦5,000',  credit: false },
  { date: 'Feb 10', type: 'Sale',    desc: 'Online order #1040',     product: 'The Proof Is You', amount: '+₦5,000', credit: true },
];

const today = new Date().toISOString().split('T')[0];

export function CashflowPage() {
  const { showToast, navigateTo } = useApp();
  const [activeAction, setActiveAction] = useState<ActionId>(null);

  function toggle(id: ActionId) {
    setActiveAction(prev => prev === id ? null : id);
  }

  function confirm(msg: string) {
    showToast(`✅ ${msg}`);
    setActiveAction(null);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Cashflow</h1>
      <p className={styles.sub}>Record all money and stock movements in your business. Every entry is logged and included in your financial statements. Keep your data clean and accurate.</p>

      {/* ── QUICK STATS ── */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Cash Balance',    value: '₦48,600',  color: 'var(--green,#1A7A50)' },
          { label: 'Stock Value',     value: '₦130,000', color: 'var(--text-1)' },
          { label: 'This Month In',   value: '+₦54,000', color: 'var(--green,#1A7A50)' },
          { label: 'This Month Out',  value: '-₦22,400', color: 'var(--red,#C0392B)' },
        ].map(s => (
          <div key={s.label} className={styles.statCard}>
            <div className={styles.statLabel}>{s.label}</div>
            <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── ACTION CARDS ── */}
      <div className={styles.actionGrid}>
        {ACTIONS.map(a => (
          <button
            key={a.id}
            className={`${styles.actionCard} ${activeAction === a.id ? styles.actionCardActive : ''}`}
            onClick={() => toggle(a.id)}
          >
            <div className={styles.actionIcon} style={{ background: a.color }}>{a.icon}</div>
            <div className={styles.actionName}>{a.name}</div>
            <div className={styles.actionDesc}>{a.desc}</div>
          </button>
        ))}
      </div>

      {/* ── ADD STOCK FORM ── */}
      {activeAction === 'add-stock' && (
        <TransactionForm
          icon="📦" title="Add Stock" sub="Record new inventory coming into your business"
          iconBg="var(--green-bg,#E6F5EE)" onClose={() => setActiveAction(null)}
        >
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Product <span className={styles.req}>*</span></label>
              <select className={styles.select}><option value="">Select product</option>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className={styles.group}><label className={styles.label}>Quantity to Add <span className={styles.req}>*</span></label>
              <input type="number" className={styles.input} placeholder="e.g. 50" min={1} /></div>
          </div>
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Date Received</label>
              <input type="date" className={styles.input} defaultValue={today} /></div>
            <div className={styles.group}><label className={styles.label}>Cost of This Batch (₦)</label>
              <div className={styles.prefixWrap}><span className={styles.prefix}>₦</span>
                <input type="number" className={styles.input} style={{ paddingLeft: 28 }} placeholder="0.00" /></div>
              <span className={styles.hint}>Records as a restocking expense automatically</span></div>
          </div>
          <div className={styles.group} style={{ marginBottom: 16 }}><label className={styles.label}>Source / Supplier Note</label>
            <input type="text" className={styles.input} placeholder="e.g. Alaba Market, Supplier: Yusuf & Sons" /></div>
          <button type="button" className={`${styles.confirmBtn} ${styles.confirmGreen}`} onClick={() => confirm('Stock added successfully')}>
            <CheckIcon /> Confirm Add Stock
          </button>
        </TransactionForm>
      )}

      {/* ── REDUCE STOCK FORM ── */}
      {activeAction === 'reduce-stock' && (
        <TransactionForm
          icon="📉" title="Reduce Stock" sub="Record a stock reduction that wasn't a sale"
          iconBg="var(--amber-bg,#FEF3C7)" onClose={() => setActiveAction(null)}
        >
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Product <span className={styles.req}>*</span></label>
              <select className={styles.select}><option value="">Select product</option>{PRODUCTS.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className={styles.group}><label className={styles.label}>Quantity to Remove <span className={styles.req}>*</span></label>
              <input type="number" className={styles.input} placeholder="e.g. 3" min={1} /></div>
          </div>
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Reason <span className={styles.req}>*</span></label>
              <select className={styles.select}>{['Damaged / Defective','Expired / Spoiled','Stolen / Lost','Given as Sample / Gift','Used Internally','Inventory Correction','Returned to Supplier'].map(r => <option key={r}>{r}</option>)}</select></div>
            <div className={styles.group}><label className={styles.label}>Date</label>
              <input type="date" className={styles.input} defaultValue={today} /></div>
          </div>
          <div className={styles.group} style={{ marginBottom: 16 }}><label className={styles.label}>Notes</label>
            <textarea className={styles.textarea} placeholder="Optional details about this stock reduction..." /></div>
          <div className={styles.infoAmber} style={{ marginBottom: 16 }}>This reduction will appear on your statement as a stock loss. If the items were damaged on delivery, link it to the corresponding expense for full traceability.</div>
          <button type="button" className={`${styles.confirmBtn} ${styles.confirmAmber}`} onClick={() => confirm('Stock reduced successfully')}>
            Confirm Stock Reduction
          </button>
        </TransactionForm>
      )}

      {/* ── ADD MONEY FORM ── */}
      {activeAction === 'add-money' && (
        <TransactionForm
          icon="💰" title="Add Money" sub="Record money coming into your business"
          iconBg="rgba(107,63,231,.08)" onClose={() => setActiveAction(null)}
        >
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Amount <span className={styles.req}>*</span></label>
              <div className={styles.prefixWrap}><span className={styles.prefix} style={{ color: '#1A7A50' }}>₦</span>
                <input type="number" className={styles.input} style={{ paddingLeft: 28, borderColor: '#1A7A50' }} placeholder="0.00" /></div></div>
            <div className={styles.group}><label className={styles.label}>Source / Type <span className={styles.req}>*</span></label>
              <select className={styles.select}>{['Manual Cash Sale','Online Sale (Busmo)','Loan / Credit Received','Personal Investment / Capital','Refund Received','Commission / Referral','Other Income'].map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Date Received</label>
              <input type="date" className={styles.input} defaultValue={today} /></div>
            <div className={styles.group}><label className={styles.label}>Payment Method</label>
              <select className={styles.select}>{['Cash','Bank Transfer','POS / Card','BusmoPay Wallet','Mobile Money'].map(m => <option key={m}>{m}</option>)}</select></div>
          </div>
          <div className={styles.group} style={{ marginBottom: 16 }}><label className={styles.label}>Description</label>
            <input type="text" className={styles.input} placeholder="e.g. Sold 3 polo shirts to walk-in customer" /></div>
          <button type="button" className={`${styles.confirmBtn} ${styles.confirmGreen}`} onClick={() => confirm('Money recorded successfully')}>
            <ArrowDownIcon /> Record Incoming Money
          </button>
        </TransactionForm>
      )}

      {/* ── TAKE MONEY FORM ── */}
      {activeAction === 'take-money' && (
        <TransactionForm
          icon="💸" title="Take Money" sub="Record money leaving your business"
          iconBg="var(--red-bg,#FDECEA)" onClose={() => setActiveAction(null)}
        >
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Amount <span className={styles.req}>*</span></label>
              <div className={styles.prefixWrap}><span className={styles.prefix} style={{ color: '#C0392B' }}>₦</span>
                <input type="number" className={styles.input} style={{ paddingLeft: 28, borderColor: '#C0392B' }} placeholder="0.00" /></div></div>
            <div className={styles.group}><label className={styles.label}>Reason / Type <span className={styles.req}>*</span></label>
              <select className={styles.select}>{['Owner Withdrawal / Drawing','Business Expense Payment','Loan Repayment','Supplier Payment','Staff Payment','Tax Payment','Other Outflow'].map(r => <option key={r}>{r}</option>)}</select></div>
          </div>
          <div className={styles.row2}>
            <div className={styles.group}><label className={styles.label}>Date</label>
              <input type="date" className={styles.input} defaultValue={today} /></div>
            <div className={styles.group}><label className={styles.label}>Payment Method</label>
              <select className={styles.select}>{['Cash','Bank Transfer','POS / Card','BusmoPay Wallet'].map(m => <option key={m}>{m}</option>)}</select></div>
          </div>
          <div className={styles.group} style={{ marginBottom: 16 }}><label className={styles.label}>Description</label>
            <input type="text" className={styles.input} placeholder="e.g. Owner took ₦5,000 for personal use" /></div>
          <div className={styles.infoAmber} style={{ marginBottom: 16 }}>Owner withdrawals are recorded as drawings and do not affect your profit/loss — they appear separately on your statement as equity movements.</div>
          <button type="button" className={`${styles.confirmBtn} ${styles.confirmRed}`} onClick={() => confirm('Transaction recorded successfully')}>
            <ArrowUpIcon /> Record Outgoing Money
          </button>
        </TransactionForm>
      )}

      {/* ── RECENT TRANSACTIONS ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <div className={styles.tableTitle}>Recent Transactions</div>
          <button className={styles.viewAllBtn} onClick={() => navigateTo('statement' as any)}>View Full Statement →</button>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Description</th><th>Product</th><th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.map((t, i) => (
                <tr key={i}>
                  <td>{t.date}</td>
                  <td><span className={`${styles.pill} ${t.type === 'Sale' ? styles.pillGreen : t.type === 'Expense' ? styles.pillRed : styles.pillAmber}`}>{t.type}</span></td>
                  <td>{t.desc}</td>
                  <td className={styles.mono}>{t.product}</td>
                  <td className={`${styles.mono} ${t.credit ? styles.amountCredit : styles.amountDebit}`}>{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: TransactionForm wrapper ──────────────
interface FormProps {
  icon: string; title: string; sub: string; iconBg: string;
  onClose: () => void; children: React.ReactNode;
}
function TransactionForm({ icon, title, sub, iconBg, onClose, children }: FormProps) {
  return (
    <div className={styles.transForm}>
      <div className={styles.transFormHeader}>
        <div className={styles.transFormIcon} style={{ background: iconBg }}>{icon}</div>
        <div>
          <div className={styles.transFormTitle}>{title}</div>
          <div className={styles.transFormSub}>{sub}</div>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>✕ Close</button>
      </div>
      {children}
    </div>
  );
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
}
function ArrowDownIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}><path d="M12 5v14M5 12l7 7 7-7" /></svg>;
}
function ArrowUpIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 15, height: 15 }}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
}
