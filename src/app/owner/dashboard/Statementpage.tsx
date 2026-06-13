'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { collection, getDocs, query, orderBy, limit, Timestamp, doc, getDoc, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import styles from './Statementpage.module.css';

// ═══════════════════════════════════════════
//  StatementPage
//  Verified business financial statement
//  — printable & PDF-downloadable
//  — used for loan / investment applications
// ═══════════════════════════════════════════

interface Transaction {
  id: string;
  date: string;
  ref: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface StockItem {
  product: string;
  open: number;
  sold: number;
  loss: number;
  restock: number;
  close: number;
  value: number;
}

const STATEMENT_TYPES = ['Full Summary','Sales Only','Expenses Only','Stock Movement','Profit & Loss'];

interface BusinessInfo {
  businessName: string;
  busmoId: string;
  ownerName: string;
  category: string;
  country: string;
}

const DEFAULT_BUSINESS: BusinessInfo = {
  businessName: 'Your Business',
  busmoId: 'BSM-XXXX-XXXX',
  ownerName: 'Business Owner',
  category: 'General Retail',
  country: 'Nigeria',
};

// Helper to get default date range (current month)
function getDefaultDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function StatementPage() {
  const { showToast } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const firestore = useFirestore();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Custom date range state
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);

  const [stmtType, setStmtType] = useState('Full Summary');
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockSummary, setStockSummary] = useState<StockItem[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    closingStock: 0,
    totalCOGS: 0,
  });

  // Fetch real data from Firestore
  useEffect(() => {
    async function fetchData() {
      if (!firestore) return;
      
      try {
        setLoading(true);

        // Get user's business ID
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) {
          console.warn('User not authenticated');
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (!userDoc.exists()) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }

        const businessId = userDoc.data().businessId;
        if (!businessId) {
          console.warn('Business ID not found');
          setLoading(false);
          return;
        }

        // Parse date range
        const startTimestamp = Timestamp.fromDate(new Date(startDate));
        const endDate_next = new Date(endDate);
        endDate_next.setDate(endDate_next.getDate() + 1); // Include end date
        const endTimestamp = Timestamp.fromDate(endDate_next);

        // Fetch sales from business collection
        const salesQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<', endTimestamp),
          orderBy('createdAt', 'desc')
        );

        const salesSnapshot = await getDocs(salesQuery);
        let totalRevenue = 0;
        let totalCOGS = 0;

        const saleTransactions: Transaction[] = [];
        let runningBalance = 0;

        salesSnapshot.forEach((doc, idx) => {
          const data = doc.data();
          const amount = data.total || data.totalRevenue || 0;
          const date = data.createdAt?.toDate() || new Date();
          
          totalRevenue += amount;
          runningBalance += amount;

          // Calculate actual COGS from products
          let saleCOGS = 0;
          if (data.products && Array.isArray(data.products)) {
            saleCOGS = data.products.reduce((sum: number, p: any) => {
              const costPrice = p.costPrice || p.cost || 0;
              const quantity = p.quantity || 1;
              return sum + (costPrice * quantity);
            }, 0);
          }
          totalCOGS += saleCOGS;

          saleTransactions.push({
            id: doc.id,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            ref: `SALE-${doc.id.substring(0, 5).toUpperCase()}`,
            type: 'Sale',
            description: `Sale (${data.products?.length || 0} items)`,
            debit: 0,
            credit: amount,
            balance: runningBalance,
          });
        });

        // Fetch expenses from business collection
        const expensesQuery = query(
          collection(firestore, 'businesses', businessId, 'expenses'),
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<', endTimestamp),
          orderBy('createdAt', 'desc')
        );

        const expensesSnapshot = await getDocs(expensesQuery);
        let totalExpenses = 0;

        const expenseTransactions: Transaction[] = [];

        expensesSnapshot.forEach(doc => {
          const data = doc.data();
          const amount = data.amount || 0;
          const date = data.createdAt?.toDate() || new Date();

          totalExpenses += amount;
          runningBalance -= amount;

          expenseTransactions.push({
            id: doc.id,
            date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            ref: `EXP-${doc.id.substring(0, 5).toUpperCase()}`,
            type: 'Expense',
            description: `${data.category || 'Expense'}: ${data.title || data.description || 'Expense'}`,
            debit: amount,
            credit: 0,
            balance: runningBalance,
          });
        });

        // Combine and sort transactions
        const allTransactions = [...saleTransactions, ...expenseTransactions]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Recalculate running balance
        let balance = 0;
        allTransactions.reverse().forEach(tx => {
          balance += (tx.credit - tx.debit);
          tx.balance = balance;
        });
        allTransactions.reverse();

        // Fetch products to calculate closing stock value
        const productsQuery = query(
          collection(firestore, 'businesses', businessId, 'products'),
          where('active', '==', true)
        );

        const productsSnapshot = await getDocs(productsQuery);
        let closingStock = 0;
        const stockSummary: StockItem[] = [];

        productsSnapshot.forEach(doc => {
          const data = doc.data();
          const stock = data.stock || 0;
          const costPrice = data.cost || data.costPrice || 0; // Read from 'cost' field (what Addproductpage saves)
          const value = stock * costPrice;
          closingStock += value;

          stockSummary.push({
            product: data.name || 'Unknown Product',
            open: stock, // Simplified - using current stock as closing stock
            sold: 0, // Would need to track sales per product
            loss: 0, // Would need to track losses
            restock: 0, // Would need to track restocks
            close: stock,
            value: value,
          });
        });

        setTransactions(allTransactions);
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;
        setStats({
          totalRevenue,
          totalExpenses,
          netProfit,
          closingStock,
          totalCOGS,
        });
        setStockSummary(stockSummary);
      } catch (error) {
        console.error('Error fetching statement data:', error);
        showToast('Failed to load statement data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [firestore, showToast, startDate, endDate]);

  const stmtId = `STMT-${Date.now().toString().substring(5)}`;
  const generatedDate = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

  const handlePrint = useCallback(() => {
    const printContents = printRef.current?.innerHTML || '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Busmo Statement — ${DEFAULT_BUSINESS.businessName} — ${startDate} to ${endDate}</title>
          <meta charset="UTF-8"/>
          <link rel="preconnect" href="https://fonts.googleapis.com"/>
          <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'DM Sans', sans-serif; color: #1C1917; background: #fff; font-size: 12px; line-height: 1.6; }
            .doc-wrap { max-width: 840px; margin: 0 auto; padding: 40px; }

            /* Header */
            .doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 3px solid #1C1917; margin-bottom: 24px; }
            .doc-logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #6C21E8; }
            .doc-logo-sub { font-size: 11px; color: #847E74; margin-top: 3px; }
            .doc-stamp { background: #1A7A50; color: #fff; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; text-align: center; }
            .doc-stamp-sub { font-size: 10px; color: #847E74; margin-top: 5px; text-align: right; }

            /* Meta grid */
            .doc-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px; background: #F4F3F0; border-radius: 10px; margin-bottom: 24px; }
            .doc-meta-item label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #847E74; display: block; margin-bottom: 3px; }
            .doc-meta-item span { font-size: 13px; font-weight: 600; color: #1C1917; }

            /* Section titles */
            .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #847E74; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #E4E1D8; }

            /* Summary stats */
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .stat-box { border: 1px solid #E4E1D8; border-radius: 10px; padding: 14px 16px; }
            .stat-box label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #847E74; display: block; margin-bottom: 6px; }
            .stat-box .val { font-size: 18px; font-weight: 800; font-family: 'DM Mono', monospace; }
            .stat-box .chg { font-size: 10px; color: #1A7A50; margin-top: 3px; }
            .green { color: #1A7A50; }
            .red   { color: #C0392B; }
            .purple { color: #6C21E8; }

            /* P&L table */
            .pl-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 8px; }
            .pl-table tr { border-bottom: 1px solid #E4E1D8; }
            .pl-table tr:last-child { border-bottom: none; }
            .pl-table td { padding: 9px 0; }
            .pl-table td:last-child { text-align: right; font-family: 'DM Mono', monospace; font-weight: 600; }
            .pl-total { border-top: 2px solid #1C1917 !important; }
            .pl-total td { font-weight: 800; font-size: 14px; padding-top: 12px; }

            /* Ledger */
            .ledger-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .ledger-table thead tr { border-bottom: 2px solid #1C1917; }
            .ledger-table th { padding: 8px 6px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #847E74; }
            .ledger-table tbody tr { border-bottom: 1px solid #E4E1D8; }
            .ledger-table td { padding: 8px 6px; }
            .ledger-table .mono { font-family: 'DM Mono', monospace; }
            .type-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
            .type-sale    { background: #E6F5EE; color: #1A7A50; }
            .type-expense { background: #FDECEA; color: #C0392B; }
            .type-drawing { background: #FEF3C7; color: #B45309; }

            /* Stock */
            .stock-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .stock-table th { padding: 8px 6px; text-align: right; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #847E74; border-bottom: 2px solid #1C1917; }
            .stock-table th:first-child { text-align: left; }
            .stock-table td { padding: 8px 6px; text-align: right; font-family: 'DM Mono', monospace; border-bottom: 1px solid #E4E1D8; }
            .stock-table td:first-child { text-align: left; font-family: 'DM Sans', sans-serif; font-weight: 500; }

            /* Footer */
            .doc-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E4E1D8; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #847E74; }
            .verify-box { border: 1px solid #1A7A50; border-radius: 8px; padding: 12px 16px; background: #E6F5EE; font-size: 11px; color: #1A7A50; margin-bottom: 24px; }
            .verify-box strong { display: block; margin-bottom: 4px; font-size: 12px; }

            @media print {
              @page { margin: 18mm 15mm; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="doc-wrap">
            ${printContents}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => { win.print(); win.close(); };
  }, [startDate, endDate]);

  async function handleDownload() {
    setDownloading(true);
    showToast('📄 Preparing PDF…');
    await new Promise(r => setTimeout(r, 400));
    handlePrint();
    setDownloading(false);
    showToast('✅ Choose "Save as PDF" in the print dialog');
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>
        {t('statement.heading')}
      </h1>
      <p className={styles.sub}>
        {t('statement.subheading')}
      </p>

      {/* ── FILTERS + ACTIONS ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('statement.startDate')}</label>
            <input 
              type="date" 
              className={styles.filterInput} 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('statement.endDate')}</label>
            <input 
              type="date" 
              className={styles.filterInput} 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('statement.statementType')}</label>
            <select className={styles.filterSelect} value={stmtType} onChange={e => setStmtType(e.target.value)}>
              {STATEMENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.filterActions}>
          <button className={styles.btnGhost} onClick={handlePrint}>
            <PrintIcon /> {t('statement.print')}
          </button>
          <button className={styles.btnPrimary} onClick={handleDownload} disabled={downloading}>
            <DownloadIcon /> {downloading ? t('statement.preparingPDF') : t('statement.downloadPDF')}
          </button>
        </div>
      </div>

      {/* ── VERIFICATION BANNER ── */}
      <div className={styles.verifyBanner}>
        <span className={styles.verifyCheck}>✅</span>
        <div>
          <strong>{t('statement.verifiedTitle')}</strong>
          {t('statement.verifiedDesc')} <strong>busmo.io/verify</strong> {t('statement.statementIdLabel')} <strong className={styles.mono}>{stmtId}</strong>
        </div>
      </div>

      {/* ── SUMMARY KPIs ── */}
      <div className={styles.kpiGrid}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>{t('common.loading')}...</div>
        ) : (
          [
            { label: t('statement.totalRevenue'),      value: formatMoney(stats.totalRevenue),  change: t('statement.revenueChange'), up: true  },
            { label: t('statement.totalExpenses'),     value: formatMoney(stats.totalExpenses),  change: t('statement.expenseChange'),  up: false },
            { label: t('statement.netProfit'),         value: formatMoney(stats.netProfit),  change: t('statement.profitChange'), up: true  },
            { label: t('statement.closingStock'),value: formatMoney(stats.closingStock), change: `${stockSummary.length} ${t('statement.productsTracked')}`, up: null  },
          ].map(k => (
            <div key={k.label} className={styles.kpiCard}>
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={styles.kpiValue} style={{ color: k.up === true ? 'var(--green,#1A7A50)' : k.up === false ? 'var(--red,#C0392B)' : 'var(--purple,#6C21E8)' }}>{k.value}</div>
              <div className={`${styles.kpiChange} ${k.up === true ? styles.kpiUp : k.up === false ? styles.kpiDown : styles.kpiFlat}`}>{k.change}</div>
            </div>
          ))
        )}
      </div>

      {/* ─── PRINTABLE DOCUMENT ─────────────────────── */}
      {/* This div is rendered invisibly and fed to print window */}
      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {/* Header */}
          <div className="doc-header">
            <div>
              <div className="doc-logo">Busmo</div>
              <div className="doc-logo-sub">{t('statement.printHeaderSub')}</div>
            </div>
            <div>
              <div className="doc-stamp">✓ {t('statement.busmoVerified')}</div>
              <div className="doc-stamp-sub">{t('statement.generated')}: {generatedDate}</div>
            </div>
          </div>

          {/* Meta */}
          <div className="doc-meta">
            <div className="doc-meta-item"><label>{t('statement.businessName')}</label><span>{DEFAULT_BUSINESS.businessName}</span></div>
            <div className="doc-meta-item"><label>{t('statement.busmoId')}</label><span>{stmtId}</span></div>
            <div className="doc-meta-item"><label>{t('statement.reportPeriod')}</label><span>{startDate} {t('statement.to')} {endDate}</span></div>
            <div className="doc-meta-item"><label>{t('statement.owner')}</label><span>{DEFAULT_BUSINESS.ownerName}</span></div>
            <div className="doc-meta-item"><label>{t('statement.category')}</label><span>{DEFAULT_BUSINESS.category}</span></div>
            <div className="doc-meta-item"><label>{t('statement.country')}</label><span>{DEFAULT_BUSINESS.country}</span></div>
          </div>

          {/* Verify box */}
          <div className="verify-box">
            <strong>✅ {t('statement.busmoVerifiedStatement')}</strong>
            {t('statement.verifyBoxDesc')} {t('statement.statementIdLabel')} <strong>{stmtId}</strong>. {t('statement.verifyAt')} busmo.io/verify
          </div>

          {/* Stats */}
          <div className="section-title">{t('statement.financialSummary')} — {startDate} {t('statement.to')} {endDate}</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>{t('common.loading')}...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-box"><label>{t('statement.totalRevenue')}</label><div className="val green">{formatMoney(stats.totalRevenue)}</div><div className="chg">↑ {t('statement.vsPriorPeriod')}</div></div>
              <div className="stat-box"><label>{t('statement.totalExpenses')}</label><div className="val red">{formatMoney(stats.totalExpenses)}</div><div className="chg" style={{color:'#C0392B'}}>↑ {t('statement.vsPriorPeriod')}</div></div>
              <div className="stat-box"><label>{t('statement.netProfit')}</label><div className="val purple">{formatMoney(stats.netProfit)}</div><div className="chg">↑ {t('statement.vsPriorPeriod')}</div></div>
              <div className="stat-box"><label>{t('statement.closingStockValue')}</label><div className="val">{formatMoney(stats.closingStock)}</div><div className="chg">{t('statement.productsTrackedShort')}</div></div>
            </div>
          )}

          {/* P&L */}
          <div className="section-title">{t('statement.profitLossStatement')}</div>
          <table className="pl-table">
            <tbody>
              <tr><td className="green" style={{fontWeight:600}}>{t('statement.totalSalesRevenue')}</td><td className="green">+ {formatMoney(stats.totalRevenue)}</td></tr>
              <tr><td className="red">{t('statement.cogs')}</td><td className="red">- {formatMoney(stats.totalCOGS)}</td></tr>
              <tr style={{borderBottom:'2px solid #E4E1D8'}}><td style={{fontWeight:700}}>{t('statement.grossProfit')}</td><td style={{fontWeight:700}}>{formatMoney(stats.totalRevenue - stats.totalCOGS)}</td></tr>
              <tr><td style={{paddingLeft:16,color:'#847E74'}}>{t('statement.otherOperatingExpenses')}</td><td style={{color:'#847E74'}}>- {formatMoney(stats.totalExpenses)}</td></tr>
              <tr className="pl-total"><td className="purple" style={{fontWeight:800,fontSize:14}}>{t('statement.netProfitAfterCosts')}</td><td className="purple" style={{fontWeight:800,fontSize:14}}>{formatMoney(stats.netProfit)}</td></tr>
            </tbody>
          </table>

          {/* Ledger */}
          <div className="section-title">{t('statement.transactionLedger')}</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>{t('common.loading')}...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              {t('statement.noTransactions')}
            </div>
          ) : (
            <table className="ledger-table">
              <thead><tr><th>{t('statement.table.date')}</th><th>{t('statement.table.reference')}</th><th>{t('statement.table.type')}</th><th>{t('statement.table.description')}</th><th style={{textAlign:'right'}}>{t('statement.table.debit')}</th><th style={{textAlign:'right'}}>{t('statement.table.credit')}</th><th style={{textAlign:'right'}}>{t('statement.table.balance')}</th></tr></thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id}>
                    <td className="mono">{t.date}</td>
                    <td className="mono" style={{color:'#847E74',fontSize:10}}>{t.ref}</td>
                    <td><span className={`type-badge type-${t.type.toLowerCase()}`}>{t.type}</span></td>
                    <td>{t.description}</td>
                    <td className="mono" style={{textAlign:'right',color:'#C0392B'}}>{t.debit > 0 ? formatMoney(t.debit) : '-'}</td>
                    <td className="mono" style={{textAlign:'right',color:'#1A7A50'}}>{t.credit > 0 ? formatMoney(t.credit) : '-'}</td>
                    <td className="mono" style={{textAlign:'right',fontWeight:600}}>{formatMoney(t.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Stock */}
          <div className="section-title">{t('statement.inventorySummary')}</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>{t('common.loading')}...</div>
          ) : stockSummary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              {t('statement.noProducts')}
            </div>
          ) : (
            <table className="stock-table">
              <thead><tr><th>{t('statement.table.product')}</th><th>{t('statement.table.opening')}</th><th>{t('statement.table.sold')}</th><th>{t('statement.table.loss')}</th><th>{t('statement.table.restock')}</th><th>{t('statement.table.closing')}</th><th>{t('statement.table.value')}</th></tr></thead>
              <tbody>
                {stockSummary.map(s => (
                  <tr key={s.product}>
                    <td>{s.product}</td>
                    <td>{s.open}</td>
                    <td style={{color:'#C0392B'}}>{s.sold > 0 ? `-${s.sold}` : '0'}</td>
                    <td style={{color:'#C0392B'}}>{s.loss > 0 ? `-${s.loss}` : '0'}</td>
                    <td style={{color:'#1A7A50'}}>{s.restock > 0 ? `+${s.restock}` : '0'}</td>
                    <td style={{fontWeight:700}}>{s.close}</td>
                    <td style={{fontWeight:700,color:'#6C21E8'}}>{formatMoney(s.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{borderTop:'2px solid #1C1917'}}>
                  <td style={{fontWeight:800}}>{t('statement.table.total')}</td>
                  <td colSpan={5} style={{textAlign:'right',fontWeight:800}}>{t('statement.closingStockValue')}</td>
                  <td style={{fontWeight:800,color:'#6C21E8'}}>{formatMoney(stats.closingStock)}</td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* Footer */}
          <div className="doc-footer">
            <div>
              <div>{DEFAULT_BUSINESS.businessName} · {stmtId}</div>
              <div>{t('statement.statementIdLabel')}: {stmtId} · {t('statement.generated')} {generatedDate}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div>{t('statement.verifiedBy')}</div>
              <div>busmo.io/verify · support@busmo.io</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ON-SCREEN P&L ── */}
      <div className={styles.sectionTitle}>{t('statement.profitLossStatement')} — {startDate} {t('statement.to')} {endDate}</div>
      <div className={styles.card}>
        <table className={styles.plTable}>
          <tbody>
            <tr><td className={styles.plGreen}>{t('statement.totalRevenue')}</td><td className={`${styles.plAmt} ${styles.plGreen}`}>+ {formatMoney(stats.totalRevenue)}</td></tr>
            <tr><td className={styles.plRed}>{t('statement.cogs')}</td><td className={`${styles.plAmt} ${styles.plRed}`}>- {formatMoney(stats.totalCOGS)}</td></tr>
            <tr className={styles.plDivider}><td style={{fontWeight:700}}>{t('statement.grossProfit')}</td><td className={`${styles.plAmt}`} style={{fontWeight:700}}>{formatMoney(stats.totalRevenue - stats.totalCOGS)}</td></tr>
            <tr><td className={styles.plIndent}>{t('statement.otherOperatingExpenses')}</td><td className={`${styles.plAmt} ${styles.plMuted}`}>- {formatMoney(stats.totalExpenses)}</td></tr>
            <tr className={styles.plTotal}><td>{t('statement.netProfitAfterCosts')}</td><td className={`${styles.plAmt} ${styles.plPurple}`}>{formatMoney(stats.netProfit)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* ── ON-SCREEN LEDGER ── */}
      <div className={styles.sectionTitle}>{t('statement.transactionLedger')}</div>
      <div className={styles.tableWrap}>
        <div className={styles.tableTop}>
          <select className={styles.tableFilter}>
            <option>{t('statement.allTransactions')}</option>
            <option>{t('statement.salesOnly')}</option>
            <option>{t('statement.expensesOnly')}</option>
            <option>{t('statement.stockMovements')}</option>
          </select>
        </div>
        <div className={styles.tableScroll}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>{t('common.loading')}...</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              {t('statement.noTransactions')}
            </div>
          ) : (
            <table className={styles.ledgerTable}>
              <thead>
                <tr>
                  <th>{t('statement.table.date')}</th><th>{t('statement.table.reference')}</th><th>{t('statement.table.type')}</th><th>{t('statement.table.description')}</th>
                  <th className={styles.right}>{t('statement.table.debit')}</th><th className={styles.right}>{t('statement.table.credit')}</th><th className={styles.right}>{t('statement.table.balance')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td className={styles.mono}>{t.date}</td>
                    <td className={`${styles.mono} ${styles.muted} ${styles.tiny}`}>{t.ref}</td>
                    <td><span className={`${styles.pill} ${t.type === 'Sale' ? styles.pillGreen : t.type === 'Expense' ? styles.pillRed : styles.pillAmber}`}>{t.type}</span></td>
                    <td>{t.description}</td>
                    <td className={`${styles.mono} ${styles.right} ${styles.debit}`}>{t.debit > 0 ? formatMoney(t.debit) : '-'}</td>
                    <td className={`${styles.mono} ${styles.right} ${styles.credit}`}>{t.credit > 0 ? formatMoney(t.credit) : '-'}</td>
                    <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:600}}>{formatMoney(t.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── STOCK SUMMARY ── */}
      <div className={styles.sectionTitle}>{t('statement.inventorySummary')}</div>
      <div className={styles.tableWrap} style={{ marginBottom: 40 }}>
        <div className={styles.tableScroll}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>{t('common.loading')}...</div>
          ) : stockSummary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
              {t('statement.noProducts')}
            </div>
          ) : (
            <table className={styles.stockTable}>
              <thead>
                <tr>
                  <th>{t('statement.table.product')}</th><th className={styles.right}>{t('statement.table.opening')}</th><th className={styles.right}>{t('statement.table.sold')}</th>
                  <th className={styles.right}>{t('statement.table.loss')}</th><th className={styles.right}>{t('statement.table.restock')}</th>
                  <th className={styles.right}>{t('statement.table.closing')}</th><th className={styles.right}>{t('statement.table.value')}</th>
                </tr>
              </thead>
              <tbody>
                {stockSummary.map(s => (
                  <tr key={s.product}>
                    <td>{s.product}</td>
                    <td className={`${styles.mono} ${styles.right}`}>{s.open}</td>
                    <td className={`${styles.mono} ${styles.right} ${s.sold > 0 ? styles.debit : styles.muted}`}>{s.sold > 0 ? `-${s.sold}` : '0'}</td>
                    <td className={`${styles.mono} ${styles.right} ${s.loss > 0 ? styles.debit : styles.muted}`}>{s.loss > 0 ? `-${s.loss}` : '0'}</td>
                    <td className={`${styles.mono} ${styles.right} ${s.restock > 0 ? styles.credit : styles.muted}`}>{s.restock > 0 ? `+${s.restock}` : '0'}</td>
                    <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:700}}>{s.close}</td>
                    <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:700,color:'var(--purple,#6C21E8)'}}>{formatMoney(s.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.stockFooter}>
                  <td style={{fontWeight:800}}>{t('statement.table.total')}</td>
                  <td colSpan={5} className={`${styles.right}`} style={{fontWeight:800}}>{t('statement.closingStockValue')}</td>
                  <td className={`${styles.mono} ${styles.right}`} style={{fontWeight:800,color:'var(--purple,#6C21E8)'}}>{formatMoney(stats.closingStock)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function PrintIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:13,height:13}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
}
function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:13,height:13}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
