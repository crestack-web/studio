'use client';

import React, { useState, useCallback } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import styles from './Addexpensepage.module.css';

// ═══════════════════════════════════════════
//  AddExpensePage
// ═══════════════════════════════════════════

const EXPENSE_CATEGORIES = [
  { group: 'Inventory & Goods', items: [
    { value: 'stock', label: 'Restocking / Purchase of Goods' },
    { value: 'raw',   label: 'Raw Materials' },
  ]},
  { group: 'Operations', items: [
    { value: 'rent',      label: 'Rent / Shop / Office Space' },
    { value: 'util',      label: 'Utilities (Light, Water, Internet)' },
    { value: 'transport', label: 'Transport / Logistics / Delivery' },
    { value: 'fuel',      label: 'Fuel / Generator' },
  ]},
  { group: 'Staff', items: [
    { value: 'salary',     label: 'Staff Salaries / Wages' },
    { value: 'commission', label: 'Staff Commission' },
    { value: 'casual',     label: 'Casual Labour' },
  ]},
  { group: 'Marketing', items: [
    { value: 'marketing',  label: 'Marketing & Advertising' },
    { value: 'packaging',  label: 'Packaging & Branding' },
  ]},
  { group: 'Finance', items: [
    { value: 'bank', label: 'Bank Charges / Fees' },
    { value: 'loan', label: 'Loan Repayment' },
    { value: 'tax',  label: 'Tax / Government Fees' },
  ]},
  { group: 'Other', items: [
    { value: 'equipment', label: 'Equipment Purchase / Repair' },
    { value: 'other',     label: 'Other / Miscellaneous' },
  ]},
];

const PRODUCTS = ['Premium Ribbed Polo Co-Ord', 'School Bag', 'The Proof Is You', 'Sabuni Premium Bar'];
const today = new Date().toISOString().split('T')[0];

interface ExpenseForm {
  category: string;
  amount: string;
  date: string;
  paymentMethod: string;
  description: string;
  linkedProduct: string;
  quantityReceived: string;
  isRecurring: boolean;
  recurFrequency: string;
  recurNextDate: string;
}

export function AddExpensePage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currency } = useCurrency();
  const firestore = useFirestore();

  const [form, setForm] = useState<ExpenseForm>({
    category: '', amount: '', date: today, paymentMethod: 'Cash',
    description: '', linkedProduct: '', quantityReceived: '',
    isRecurring: false, recurFrequency: 'Monthly', recurNextDate: '',
  });

  const [receipt, setReceipt] = useState<string | null>(null);

  const set = useCallback((key: keyof ExpenseForm, val: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const showStockLink = form.category === 'stock' || form.category === 'raw';

  async function handleSave() {
    if (!form.category) { showToast('⚠️ Please select a category'); return; }
    if (!form.amount)   { showToast('⚠️ Please enter an amount'); return; }

    if (!firestore) {
      showToast('⚠️ Database not connected');
      return;
    }

    if (!user) {
      showToast('⚠️ User not authenticated');
      return;
    }

    try {
      // Get business ID from user document
      const { auth } = initializeFirebase();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        showToast('⚠️ User not authenticated');
        return;
      }

      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      if (!userDoc.exists()) {
        showToast('⚠️ User document not found');
        return;
      }

      const businessId = userDoc.data().businessId;
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        return;
      }

      // Create expense document
      const expenseData = {
        category: form.category,
        amount: parseFloat(form.amount),
        date: Timestamp.fromDate(new Date(form.date)),
        paymentMethod: form.paymentMethod,
        description: form.description,
        linkedProduct: form.linkedProduct || null,
        quantityReceived: form.quantityReceived ? parseInt(form.quantityReceived) : null,
        isRecurring: form.isRecurring,
        recurFrequency: form.isRecurring ? form.recurFrequency : null,
        recurNextDate: form.isRecurring && form.recurNextDate ? Timestamp.fromDate(new Date(form.recurNextDate)) : null,
        receiptUrl: receipt || null,
        createdAt: Timestamp.now(),
        createdBy: currentUser.uid,
      };

      await addDoc(collection(firestore, 'businesses', businessId, 'expenses'), expenseData);

      const amt = parseFloat(form.amount).toLocaleString();
      showToast(`✅ Expense of ${currency.symbol}${amt} recorded`);
      
      // Reset form
      setForm({
        category: '', amount: '', date: today, paymentMethod: 'Cash',
        description: '', linkedProduct: '', quantityReceived: '',
        isRecurring: false, recurFrequency: 'Monthly', recurNextDate: '',
      });
      setReceipt(null);
    } catch (error) {
      console.error('Failed to save expense:', error);
      showToast('🔥 Error saving expense: ' + (error as any).message);
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Add Expense</h1>
      <p className={styles.sub}>Record a business expense. Expenses are deducted from revenue on your financial statements and give you an accurate picture of your true profit.</p>

      <div className={styles.infoAmber}>
        <strong>Why record expenses?</strong> Busmo uses your recorded expenses alongside sales to generate verified financial statements — which you can use to apply for loans, business registration, and financing within or outside the platform.
      </div>

      {/* ── EXPENSE DETAILS ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Expense Details</div>

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Category <span className={styles.req}>*</span></label>
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Amount ({currency.symbol}) <span className={styles.req}>*</span></label>
            <div className={styles.prefixWrap}>
              <span className={styles.prefix}>{currency.symbol}</span>
              <input type="number" className={styles.input} style={{ paddingLeft: 28 }} placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.group}>
            <label className={styles.label}>Date of Expense <span className={styles.req}>*</span></label>
            <input type="date" className={styles.input} value={form.date} onChange={e => set('date', e.target.value)} />
          </div>
          <div className={styles.group}>
            <label className={styles.label}>Payment Method</label>
            <select className={styles.select} value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {['Cash','Bank Transfer','POS / Card','BusmoPay Wallet','Mobile Money','Cheque'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.group} style={{ marginBottom: 14 }}>
          <label className={styles.label}>Description / Notes</label>
          <textarea className={styles.textarea} placeholder="What was this expense for? e.g. Purchased 50 units of polo shirts from supplier in Aba" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        {/* Stock link */}
        {showStockLink && (
          <>
            <hr className={styles.divider} />
            <div className={styles.sectionTitle}>Link to Product (Restock)</div>
            <div className={styles.row2}>
              <div className={styles.group}>
                <label className={styles.label}>Product Restocked</label>
                <select className={styles.select} value={form.linkedProduct} onChange={e => set('linkedProduct', e.target.value)}>
                  <option value="">Select product...</option>
                  {PRODUCTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Quantity Received</label>
                <input type="number" className={styles.input} placeholder="Units added to stock" value={form.quantityReceived} onChange={e => set('quantityReceived', e.target.value)} />
              </div>
            </div>
            <div className={styles.infoGreen}>Linking this expense to a product will automatically update its stock count and calculate the cost-per-unit for profit tracking.</div>
          </>
        )}

        {/* Recurring */}
        <hr className={styles.divider} />
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>This is a recurring expense</div>
            <div className={styles.toggleSub}>Rent, utilities, salaries — expenses that repeat on a schedule</div>
          </div>
          <label className={styles.toggle}>
            <input type="checkbox" checked={form.isRecurring} onChange={e => set('isRecurring', e.target.checked)} />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleThumb} />
          </label>
        </div>

        {form.isRecurring && (
          <div style={{ marginTop: 14 }}>
            <div className={styles.row2}>
              <div className={styles.group}>
                <label className={styles.label}>Repeat Frequency</label>
                <select className={styles.select} value={form.recurFrequency} onChange={e => set('recurFrequency', e.target.value)}>
                  {['Weekly','Monthly','Quarterly','Annually'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className={styles.group}>
                <label className={styles.label}>Next Due Date</label>
                <input type="date" className={styles.input} value={form.recurNextDate} onChange={e => set('recurNextDate', e.target.value)} />
              </div>
            </div>
            <div className={styles.infoPurple}>Busmo will remind you when this expense is due and automatically include it in your monthly projections.</div>
          </div>
        )}

        {/* Receipt upload */}
        <hr className={styles.divider} />
        <div className={styles.cardTitle} style={{ marginBottom: 4 }}>Receipt / Proof of Payment</div>
        <div className={styles.cardSub} style={{ marginBottom: 12 }}>Upload a photo of your receipt. This strengthens the credibility of your financial statements when used for loan or verification purposes.</div>
        <div
          className={`${styles.uploadZone} ${receipt ? styles.uploadZoneFilled : ''}`}
          onClick={() => { showToast('📎 Receipt upload coming soon'); setReceipt('demo'); }}
        >
          <div className={styles.uploadIcon}>{receipt ? '✅' : '🧾'}</div>
          <div className={styles.uploadLabel}>{receipt ? 'Receipt uploaded' : 'Upload receipt (optional)'}</div>
          <div className={styles.uploadHint}>JPG, PNG, PDF · Max 5MB</div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={handleSave}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Record Expense
        </button>
        <button type="button" className={styles.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}
