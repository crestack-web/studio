'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { notifyExpense } from '@/lib/deviceNotifications';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, addDoc, updateDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { getAuthCurrentUser, getFirestoreUserId } from '@/lib/supabase-auth';
import { subscribeToActionEvents } from '@/utils/dataRefresh';
import { sendLargeExpenseAlertEmail, sendUnusualSpendingAlertEmail } from '@/services/email/cashflow-emails';
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

  const [form, setForm] = useState<ExpenseForm>({
    category: '', amount: '', date: today, paymentMethod: 'Cash',
    description: '', linkedProduct: '', quantityReceived: '',
    isRecurring: false, recurFrequency: 'Monthly', recurNextDate: '',
  });
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const set = useCallback((key: keyof ExpenseForm, val: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  const showStockLink = form.category === 'stock' || form.category === 'raw';

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ File size exceeds 5MB limit');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      showToast('⚠️ Only JPG, PNG, and PDF files are allowed');
      return;
    }

    setIsUploadingReceipt(true);

    try {
      const userIds = getFirestoreUserId();
      if (!userIds) {
        showToast('⚠️ User not authenticated');
        return;
      }

      const { data: userDoc } = await getSupabase()
        .from('users')
        .select('*')
        .eq('id', userIds.firestoreUid)
        .single();
      if (!userDoc) {
        showToast('⚠️ User document not found');
        return;
      }

      let bizId = userDoc.businessId || userDoc.business_id || '';
      if (!bizId) {
        const { resolveOwnedBusinessId } = await import('@/lib/resolve-business-scope');
        bizId = (await resolveOwnedBusinessId(userIds?.supabaseUid || userIds?.firestoreUid)) || '';
      }
      if (!bizId) {
        showToast('⚠️ Business ID not found');
        return;
      }

      const filePath = `merchants/${bizId}/documents/${Date.now()}_${file.name}`;
      const { error: uploadError } = await getSupabase().storage
        .from('receipts')
        .upload(filePath, file, { contentType: file.type });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = getSupabase().storage
        .from('receipts')
        .getPublicUrl(filePath);

      setReceipt(urlData.publicUrl);
      showToast('✅ Receipt uploaded successfully');
    } catch (error) {
      console.error('Error uploading receipt:', error);
      showToast('🔥 Failed to upload receipt');
    } finally {
      setIsUploadingReceipt(false);
    }
  }

  function handleReceiptClick() {
    fileInputRef.current?.click();
  }

  async function handleSave() {
    if (!form.category) { showToast('⚠️ Please select a category'); return; }
    if (!form.amount)   { showToast('⚠️ Please enter an amount'); return; }
    if (isSubmitting) return; // Prevent duplicate submissions

    if (!user) {
      showToast('⚠️ User not authenticated');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get business ID from user document
      const userIds = getFirestoreUserId();
      
      if (!userIds) {
        showToast('⚠️ User not authenticated');
        return;
      }

      // Firebase-shaped alias so downstream writes keep using .uid / .email / .displayName
      const currentUser = {
        uid: userIds.firestoreUid,
        email: userIds.email,
        displayName: getAuthCurrentUser()?.displayName ?? null,
      };

      const { data: userDoc } = await getSupabase()
        .from('users')
        .select('*')
        .eq('id', currentUser.uid)
        .single();
      if (!userDoc) {
        showToast('⚠️ User document not found');
        return;
      }

      const businessId = userDoc.businessId || userDoc.business_id;
      if (!businessId) {
        showToast('⚠️ Business ID not found');
        return;
      }

      // Check for potential duplicates (same category and amount within last 5 seconds)
      const recentExpenses = await fetchDocs(`businesses/${businessId}/expenses`, {
        filters: [
          { field: 'category', op: '=', value: form.category },
          { field: 'amount', op: '=', value: parseFloat(form.amount) },
        ],
      });
      
      // Check if any of the recent expenses were created in the last 5 seconds
      const fiveSecondsAgo = Date.now() - 5000;
      const hasRecentDuplicate = recentExpenses.some(doc => {
        const createdAt = new Date(doc.createdAt || doc.created_at || 0).getTime();
        return createdAt >= fiveSecondsAgo;
      });
      
      if (hasRecentDuplicate) {
        showToast('⚠️ Possible duplicate expense detected. Please wait a moment before adding the same expense again.');
        setIsSubmitting(false);
        return;
      }

      // Create expense document
      const expenseData = {
        category: form.category,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        paymentMethod: form.paymentMethod,
        description: form.description,
        linkedProduct: form.linkedProduct || null,
        quantityReceived: form.quantityReceived ? parseInt(form.quantityReceived) : null,
        isRecurring: form.isRecurring,
        recurFrequency: form.isRecurring ? form.recurFrequency : null,
        recurNextDate: form.isRecurring && form.recurNextDate ? new Date(form.recurNextDate).toISOString() : null,
        receiptUrl: receipt || null,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
      };

      const expenseId = await addDoc(`businesses/${businessId}/expenses`, { ...expenseData, id: crypto.randomUUID() });
      const expenseAmount = parseFloat(form.amount) || 0;

      try {
        const amountLabel = Number.isFinite(expenseAmount)
          ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(expenseAmount)
          : form.amount;
        await notifyExpense({ amountLabel, category: form.category });
      } catch { /* non-blocking */ }

      // Debit a bank/cash account so Cash balance & period out stay accurate
      try {
        if (expenseAmount > 0) {
          const accountsRaw: any[] = await fetchDocs(`businesses/${businessId}/bankAccounts`);
          const accounts = (accountsRaw || []).filter((a) => a.isActive !== false);
          const method = String(form.paymentMethod || 'Cash').toLowerCase();
          const pickAccount = () => {
            if (method.includes('pos') || method.includes('card')) {
              return (
                accounts.find((a) => a.isPosDefault) ||
                accounts.find((a) => a.isDefault || a.isPrimary) ||
                accounts[0]
              );
            }
            if (method.includes('cash')) {
              return (
                accounts.find(
                  (a) =>
                    /cash/i.test(String(a.accountName || a.name || '')) ||
                    /cash/i.test(String(a.bankName || ''))
                ) ||
                accounts.find((a) => a.isDefault || a.isPrimary) ||
                accounts[0]
              );
            }
            return accounts.find((a) => a.isDefault || a.isPrimary) || accounts[0];
          };
          const account = pickAccount();
          if (account?.id) {
            const bal = Number(account.currentBalance ?? account.current_balance ?? 0) || 0;
            const newBal = bal - expenseAmount;
            await updateDoc(`businesses/${businessId}/bankAccounts`, account.id, {
              currentBalance: newBal,
            });
            await addDoc(`businesses/${businessId}/bankTransactions`, {
              id: crypto.randomUUID(),
              bankAccountId: account.id,
              accountName: account.accountName || account.name || 'Account',
              type: 'money_out',
              amount: expenseAmount,
              balanceAfter: newBal,
              description: `Expense: ${form.category}${form.description ? ` — ${form.description}` : ''} (${expenseId})`,
              reference: expenseId,
              createdAt: new Date().toISOString(),
            });
            console.log('✅ Bank account debited for expense');
          } else {
            console.warn('⚠️ No bank/cash account to debit for expense — cash balance unchanged');
          }
        }
      } catch (bankErr) {
        console.error('⚠️ Failed to debit account for expense:', bankErr);
      }

      // Mirror in cash_flow ledger (secondary; KPIs use bank_transactions)
      try {
        await addDoc(`businesses/${businessId}/cashFlow`, {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          moneyIn: 0,
          moneyOut: expenseAmount,
          type: 'out',
          amount: expenseAmount,
          category: form.category,
          description: `Expense - ${form.category}`,
          expenseId: expenseId,
          paymentMethod: form.paymentMethod,
          createdAt: new Date().toISOString(),
        });
        console.log('✅ Cash flow entry created for expense');
      } catch (cashFlowError) {
        console.error('⚠️ Failed to create cash flow entry:', cashFlowError);
      }

      // Record audit trail for expense creation
      try {
        const { data: userData } = await getSupabase()
          .from('users')
          .select('*')
          .eq('id', currentUser.uid)
          .single();
        
        await addDoc(`businesses/${businessId}/auditTrail`, {
          id: crypto.randomUUID(),
          userId: currentUser.uid,
          userName: userData?.displayName || userData?.name || currentUser.displayName || 'Unknown',
          userEmail: currentUser.email || userData?.email || '',
          action: 'create',
          entityType: 'expense',
          entityId: expenseId,
          entityName: `Expense - ${form.category}`,
          previousValues: null,
          newValues: {
            category: form.category,
            amount: parseFloat(form.amount),
            date: new Date(form.date).toISOString(),
            paymentMethod: form.paymentMethod,
            description: form.description,
            linkedProduct: form.linkedProduct || null,
            quantityReceived: form.quantityReceived ? parseInt(form.quantityReceived) : null,
            isRecurring: form.isRecurring,
            recurFrequency: form.isRecurring ? form.recurFrequency : null,
            receiptUrl: receipt || null,
          },
          timestamp: new Date().toISOString(),
          ipAddress: null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });
        console.log('✅ Audit trail recorded for expense');
      } catch (auditError) {
        console.error('⚠️ Failed to record audit trail:', auditError);
        // Don't fail the expense creation if audit fails
      }

      // Check for large expense or unusual spending and send alerts
      try {
        const { data: ownerDoc } = await getSupabase()
          .from('users')
          .select('*')
          .eq('id', currentUser.uid)
          .single();
        const businessName = ownerDoc?.businessName || ownerDoc?.business_name || 'Your Business';
        const ownerEmail = ownerDoc?.email;
        const ownerName = ownerDoc?.fullName || ownerDoc?.full_name || ownerDoc?.displayName || ownerDoc?.display_name || 'Business Owner';
        const emailPrefs = ownerDoc?.emailPreferences || ownerDoc?.email_preferences;
        const expenseAmount = parseFloat(form.amount);

        if (emailPrefs?.largeExpense !== false && ownerEmail) {
          // Check for large expense (more than 100,000 NGN as threshold)
          const LARGE_EXPENSE_THRESHOLD = 100000;
          if (expenseAmount > LARGE_EXPENSE_THRESHOLD) {
            await sendLargeExpenseAlertEmail({
              email: ownerEmail,
              name: ownerName,
              businessName,
              expenseAmount,
              expenseCategory: form.category,
              expenseDescription: form.description,
              averageExpense: expenseAmount / 2, // Estimate average for alert
              currency: currency.code,
            });
            console.log('Large expense alert email sent');
          }
        }

        if (emailPrefs?.unusualSpending !== false && ownerEmail) {
          // Check for unusual spending by comparing with average expenses
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const expensesSnapshot = await fetchDocs(`businesses/${businessId}/expenses`, {
            filters: [
              { field: 'date', op: '>=', value: thirtyDaysAgo },
            ],
          });
          
          if (expensesSnapshot.length > 0) {
            let totalExpenses = 0;
            expensesSnapshot.forEach(doc => {
              totalExpenses += (doc as any).amount || 0;
            });
            const averageExpense = totalExpenses / expensesSnapshot.length;
            
            // If current expense is 3x the average, flag as unusual
            if (expenseAmount > averageExpense * 3) {
              // Log unusual spending for now - this could trigger a different alert type
              console.log('Unusual spending detected:', {
                expenseAmount,
                averageExpense,
                category: form.category,
              });
            }
          }
        }
      } catch (emailError) {
        console.error('Failed to send expense email alerts:', emailError);
      }

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
    } finally {
      setIsSubmitting(false);
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
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleReceiptUpload}
          style={{ display: 'none' }}
        />
        <div
          className={`${styles.uploadZone} ${receipt ? styles.uploadZoneFilled : ''}`}
          onClick={handleReceiptClick}
          style={{ cursor: isUploadingReceipt ? 'not-allowed' : 'pointer', opacity: isUploadingReceipt ? 0.6 : 1 }}
        >
          <div className={styles.uploadIcon}>
            {isUploadingReceipt ? '⏳' : receipt ? '✅' : '🧾'}
          </div>
          <div className={styles.uploadLabel}>
            {isUploadingReceipt ? 'Uploading...' : receipt ? 'Receipt uploaded' : 'Upload receipt (optional)'}
          </div>
          <div className={styles.uploadHint}>JPG, PNG, PDF · Max 5MB</div>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              Recording...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Record Expense
            </>
          )}
        </button>
        <button type="button" className={styles.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

