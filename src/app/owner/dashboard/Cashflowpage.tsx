'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, query, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';
import styles from './Cashflowpage.module.css';

// ═══════════════════════════════════════════
//  CashflowPage — 4 action forms + transaction log
// ═══════════════════════════════════════════

type ActionId = 'add-stock' | 'reduce-stock' | 'add-money' | 'take-money' | null;

interface Transaction {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  credit: boolean;
}

export function CashflowPage() {
  const { showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const firestore = useFirestore();
  const [activeAction, setActiveAction] = useState<ActionId>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cashBalance: 0,
    stockValue: 0,
    monthIn: 0,
    monthOut: 0,
  });

  // Fetch real transactions from Firestore
  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      
      try {
        setLoading(true);
        
        // Fetch recent transactions
        const transactionsQuery = query(
          collection(firestore, 'transactions'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(transactionsQuery);
        const fetchedTransactions: Transaction[] = [];
        let cashBalance = 0;
        let monthIn = 0;
        let monthOut = 0;
        
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;
          const isCredit = data.type === 'income' || data.type === 'sale';
          const date = data.createdAt?.toDate() || new Date();
          
          fetchedTransactions.push({
            id: doc.id,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            type: data.type || 'Other',
            description: data.description || '',
            amount: amount,
            credit: isCredit,
          });
          
          if (isCredit) {
            cashBalance += amount;
            if (date >= monthStart) monthIn += amount;
          } else {
            cashBalance -= amount;
            if (date >= monthStart) monthOut += amount;
          }
        });
        
        setTransactions(fetchedTransactions);
        setStats({
          cashBalance,
          stockValue: 0, // Would need separate products query
          monthIn,
          monthOut,
        });
      } catch (error) {
        console.error('Error fetching cashflow data:', error);
        showToast('Failed to load cashflow data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [firestore, showToast]);

  function toggle(id: ActionId) {
    setActiveAction(prev => prev === id ? null : id);
  }

  function confirm(msg: string) {
    showToast(`✅ ${msg}`);
    setActiveAction(null);
  }

  function handleSubmit(e: React.FormEvent, action: string) {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const amount = formData.get('amount') as string;
    const description = formData.get('description') as string;
    
    if (!amount || !description) {
      showToast('❌ Please fill all fields');
      return;
    }
    
    confirm(`${action}: ${description} - ${formatMoney(parseFloat(amount))}`);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>{t('cashflow.title')}</h1>
      <p className={styles.sub}>{t('cashflow.subtitle')}</p>

      {/* ── QUICK STATS ── */}
      <div className={styles.statsGrid}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            {t('common.loading')}...
          </div>
        ) : (
          [
            { label: t('cashflow.cashBalance'),    value: formatMoney(stats.cashBalance),  color: 'var(--green,#1A7A50)' },
            { label: t('cashflow.stockValue'),     value: formatMoney(stats.stockValue), color: 'var(--text-1)' },
            { label: t('cashflow.monthIn'),   value: '+' + formatMoney(stats.monthIn), color: 'var(--green,#1A7A50)' },
            { label: t('cashflow.monthOut'),  value: '-' + formatMoney(stats.monthOut), color: 'var(--red,#C0392B)' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statLabel}>{s.label}</div>
              <div className={styles.statValue} style={{ color: s.color }}>{s.value}</div>
            </div>
          ))
        )}
      </div>

      {/* ── ACTION CARDS ── */}
      <div className={styles.actionGrid}>
        {[
          { id: 'add-stock' as ActionId, icon: '📦', name: t('cashflow.addStock'), desc: t('cashflow.addStockDesc'), color: 'var(--green-bg,#E6F5EE)' },
          { id: 'reduce-stock' as ActionId, icon: '📉', name: t('cashflow.reduceStock'), desc: t('cashflow.reduceStockDesc'), color: 'var(--amber-bg,#FEF3C7)' },
          { id: 'add-money' as ActionId, icon: '💰', name: t('cashflow.addMoney'), desc: t('cashflow.addMoneyDesc'), color: 'rgba(107,63,231,.08)' },
          { id: 'take-money' as ActionId, icon: '💸', name: t('cashflow.takeMoney'), desc: t('cashflow.takeMoneyDesc'), color: 'var(--red-bg,#FDECEA)' },
        ].map(a => (
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

      {/* ── ACTION FORMS (shown when active) ── */}
      {activeAction && (
        <div className={styles.actionFormOverlay} onClick={() => setActiveAction(null)}>
          <div className={styles.actionForm} onClick={e => e.stopPropagation()}>
            <button className={styles.closeFormBtn} onClick={() => setActiveAction(null)}>✕</button>
            
            {activeAction === 'add-stock' && (
              <form onSubmit={e => handleSubmit(e, t('cashflow.addStock'))}>
                <h3>{t('cashflow.addStock')}</h3>
                <p className={styles.formDesc}>{t('cashflow.addStockDesc')}</p>
                <div className={styles.formGroup}>
                  <label>{t('products.selectProduct')}</label>
                  <select name="productId" required className={styles.formInput}>
                    <option value="">{t('products.selectProduct')}</option>
                    <option value="1">Product 1</option>
                    <option value="2">Product 2</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('products.quantity')}</label>
                  <input type="number" name="quantity" required min="1" className={styles.formInput} placeholder="e.g., 50" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('products.costPrice')}</label>
                  <input type="number" name="amount" required min="0.01" step="0.01" className={styles.formInput} placeholder="₦0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.description')}</label>
                  <textarea name="description" required className={styles.formInput} placeholder={t('cashflow.addStockDesc')} rows={3} />
                </div>
                <button type="submit" className={styles.submitBtn}>{t('common.confirm')}</button>
              </form>
            )}

            {activeAction === 'reduce-stock' && (
              <form onSubmit={e => handleSubmit(e, t('cashflow.reduceStock'))}>
                <h3>{t('cashflow.reduceStock')}</h3>
                <p className={styles.formDesc}>{t('cashflow.reduceStockDesc')}</p>
                <div className={styles.formGroup}>
                  <label>{t('products.selectProduct')}</label>
                  <select name="productId" required className={styles.formInput}>
                    <option value="">{t('products.selectProduct')}</option>
                    <option value="1">Product 1</option>
                    <option value="2">Product 2</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('products.quantity')}</label>
                  <input type="number" name="quantity" required min="1" className={styles.formInput} placeholder="e.g., 10" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.reason')}</label>
                  <select name="reason" required className={styles.formInput}>
                    <option value="">{t('common.selectReason')}</option>
                    <option value="damaged">{t('products.damaged')}</option>
                    <option value="expired">{t('products.expired')}</option>
                    <option value="theft">{t('products.theft')}</option>
                    <option value="other">{t('products.other')}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.description')}</label>
                  <textarea name="description" required className={styles.formInput} placeholder={t('cashflow.reduceStockDesc')} rows={3} />
                </div>
                <button type="submit" className={styles.submitBtn}>{t('common.confirm')}</button>
              </form>
            )}

            {activeAction === 'add-money' && (
              <form onSubmit={e => handleSubmit(e, t('cashflow.addMoney'))}>
                <h3>{t('cashflow.addMoney')}</h3>
                <p className={styles.formDesc}>{t('cashflow.addMoneyDesc')}</p>
                <div className={styles.formGroup}>
                  <label>{t('common.amount')}</label>
                  <input type="number" name="amount" required min="0.01" step="0.01" className={styles.formInput} placeholder="₦0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.source')}</label>
                  <select name="source" required className={styles.formInput}>
                    <option value="">{t('common.selectSource')}</option>
                    <option value="loan">{t('cashflow.loan')}</option>
                    <option value="investment">{t('cashflow.investment')}</option>
                    <option value="personal">{t('cashflow.personal')}</option>
                    <option value="other">{t('cashflow.other')}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.description')}</label>
                  <textarea name="description" required className={styles.formInput} placeholder={t('cashflow.addMoneyDesc')} rows={3} />
                </div>
                <button type="submit" className={styles.submitBtn}>{t('common.confirm')}</button>
              </form>
            )}

            {activeAction === 'take-money' && (
              <form onSubmit={e => handleSubmit(e, t('cashflow.takeMoney'))}>
                <h3>{t('cashflow.takeMoney')}</h3>
                <p className={styles.formDesc}>{t('cashflow.takeMoneyDesc')}</p>
                <div className={styles.formGroup}>
                  <label>{t('common.amount')}</label>
                  <input type="number" name="amount" required min="0.01" step="0.01" className={styles.formInput} placeholder="₦0.00" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.category')}</label>
                  <select name="category" required className={styles.formInput}>
                    <option value="">{t('common.selectCategory')}</option>
                    <option value="rent">{t('expenses.rent')}</option>
                    <option value="utilities">{t('expenses.utilities')}</option>
                    <option value="salary">{t('expenses.salary')}</option>
                    <option value="supplies">{t('expenses.supplies')}</option>
                    <option value="other">{t('expenses.other')}</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{t('common.description')}</label>
                  <textarea name="description" required className={styles.formInput} placeholder={t('cashflow.takeMoneyDesc')} rows={3} />
                </div>
                <button type="submit" className={styles.submitBtn}>{t('common.confirm')}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── TRANSACTIONS LIST ── */}
      <div className={styles.transactionsSection}>
        <h2 className={styles.sectionTitle}>{t('cashflow.recentTransactions')}</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            {t('common.loading')}...
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{t('cashflow.noTransactions')}</div>
            <div style={{ fontSize: '0.8rem' }}>{t('cashflow.addTransactionsFirst')}</div>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map(t => (
              <div key={t.id} className={styles.transactionItem}>
                <div className={styles.transDate}>{t.date}</div>
                <div className={styles.transInfo}>
                  <div className={styles.transType} style={{ color: t.credit ? 'var(--green)' : 'var(--red)' }}>
                    {t.credit ? '↑' : '↓'} {t.type}
                  </div>
                  <div className={styles.transDesc}>{t.description}</div>
                </div>
                <div className={styles.transAmount} style={{ color: t.credit ? 'var(--green)' : 'var(--red)' }}>
                  {t.credit ? '+' : '-'}{formatMoney(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
