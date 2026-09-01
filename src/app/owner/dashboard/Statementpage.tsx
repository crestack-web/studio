'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs, fetchDoc } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
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
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Custom date range state
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const [stmtType, setStmtType] = useState('Full Summary');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'sale' | 'expense' | 'purchase' | 'stock'>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [activePreset, setActivePreset] = useState<'this_month' | 'last_month' | 'last_30' | 'this_year' | 'custom'>('this_month');
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockSummary, setStockSummary] = useState<StockItem[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    closingStock: 0,
    openingStock: 0,
    totalCOGS: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // 1) Resolve auth + businessId the same way Home / Cashflow do
        const supabase = getSupabase();
        let authUserId = user?.id || '';
        let businessId = user?.businessId || '';

        if (!authUserId) {
          const { data: { session } } = await supabase.auth.getSession();
          authUserId = session?.user?.id || '';
        }

        if (!businessId && authUserId) {
          try {
            let { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUserId)
              .maybeSingle();
            if (!userData) {
              const { data: byEmail } = await supabase
                .from('users')
                .select('*')
                .eq('email', user?.email || '')
                .maybeSingle();
              userData = byEmail;
            }
            businessId = (userData?.businessId || userData?.business_id || '') as string;
          } catch (e) {
            console.warn('Statement user lookup failed', e);
          }
        }

        // Last-resort: fetchDoc helpers
        if (!businessId && authUserId) {
          const userData = await fetchDoc('users', authUserId);
          businessId = (userData?.businessId || userData?.business_id || '') as string;
        }

        if (!businessId) {
          console.warn('Statement: Business ID not found', { authUserId, userBiz: user?.businessId });
          setTransactions([]);
          setStockSummary([]);
          setStats({
            totalRevenue: 0,
            totalExpenses: 0,
            netProfit: 0,
            closingStock: 0,
            openingStock: 0,
            totalCOGS: 0,
          });
          setLoading(false);
          return;
        }

        console.log('[Statement] loading for businessId:', businessId);

        const rangeStartMs = new Date(startDate + 'T00:00:00').getTime();
        const rangeEndMs = new Date(endDate + 'T23:59:59.999').getTime();

        const eventMs = (data: any): number => {
          const candidates = [
            data?.date,
            data?.entryDate,
            data?.entry_date,
            data?.metadata?.date,
            data?.createdAt,
            data?.created_at,
          ];
          for (const c of candidates) {
            if (!c) continue;
            if (typeof c === 'string' || c instanceof Date) {
              const t = new Date(c).getTime();
              if (!Number.isNaN(t) && t > 0) return t;
            }
            if (typeof c?.toDate === 'function') {
              const t = c.toDate().getTime();
              if (!Number.isNaN(t) && t > 0) return t;
            }
            if (typeof c?.seconds === 'number') return c.seconds * 1000;
          }
          return 0;
        };

        const inRange = (d: any) => {
          const ms = eventMs(d);
          if (!ms) return true; // keep undated rather than hide
          return ms >= rangeStartMs && ms <= rangeEndMs;
        };

        const fmtDate = (ms: number) =>
          (ms ? new Date(ms) : new Date()).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

        const listLimit = 500;
        const [salesDocs, expensesDocs, purchaseDocs, bankTxDocs, cashFlowDocs, productsDocs] =
          await Promise.all([
            fetchDocs(`businesses/${businessId}/sales`, {
              orderBy: { field: 'created_at', ascending: false },
              limit: listLimit,
            }),
            fetchDocs(`businesses/${businessId}/expenses`, {
              orderBy: { field: 'created_at', ascending: false },
              limit: listLimit,
            }),
            fetchDocs(`businesses/${businessId}/purchases`, {
              orderBy: { field: 'created_at', ascending: false },
              limit: listLimit,
            }),
            fetchDocs(`businesses/${businessId}/bankTransactions`, {
              orderBy: { field: 'created_at', ascending: false },
              limit: listLimit,
            }),
            fetchDocs(`businesses/${businessId}/cashFlow`, {
              orderBy: { field: 'created_at', ascending: false },
              limit: listLimit,
            }),
            fetchDocs(`businesses/${businessId}/products`),
          ]);

        console.log('[Statement] fetched counts', {
          sales: salesDocs?.length || 0,
          expenses: expensesDocs?.length || 0,
          purchases: purchaseDocs?.length || 0,
          bankTx: bankTxDocs?.length || 0,
          cashFlow: cashFlowDocs?.length || 0,
          products: productsDocs?.length || 0,
        });

        const applyRange = (docs: any[]) => {
          const list = docs || [];
          const ranged = list.filter(inRange);
          // If range is empty but data exists, fall back so the statement is never blank
          if (ranged.length === 0 && list.length > 0) return list;
          return ranged;
        };

        const rangedSales = applyRange(salesDocs || []);
        const rangedExpenses = applyRange(expensesDocs || []);
        const rangedPurchases = applyRange(purchaseDocs || []);
        const rangedBankTx = applyRange(bankTxDocs || []);
        const rangedCashFlow = applyRange(cashFlowDocs || []);

        type LedgerRow = Transaction & { sortAt: number };
        const ledger: LedgerRow[] = [];

        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalCOGS = 0;
        let totalPurchases = 0;

        // Sales → credits
        for (const data of rangedSales) {
          const amount =
            Number(
              data.totalRevenue ?? data.total ?? data.totalAmount ?? data.total_amount ?? 0
            ) || 0;
          if (amount <= 0) continue;
          const ms = eventMs(data);
          totalRevenue += amount;
          const products = (data.products || data.items || []) as any[];
          if (products.length > 0) {
            totalCOGS += products.reduce((sum: number, p: any) => {
              const costPrice = Number(p.costPrice || p.cost || 0) || 0;
              const quantity = Number(p.quantity || 1) || 1;
              return sum + costPrice * quantity;
            }, 0);
          }
          ledger.push({
            id: `sale-${data.id}`,
            date: fmtDate(ms),
            sortAt: ms || 0,
            ref: `SALE-${String(data.id || '').substring(0, 6).toUpperCase()}`,
            type: 'Sale',
            description: `Sale (${products.length} items)`,
            debit: 0,
            credit: amount,
            balance: 0,
          });
        }

        // Expenses → debits
        for (const data of rangedExpenses) {
          const amount = Number(data.amount) || 0;
          if (amount <= 0) continue;
          const ms = eventMs(data);
          totalExpenses += amount;
          const category = data.category || data.metadata?.category || 'Expense';
          const desc =
            data.description ||
            data.title ||
            data.metadata?.description ||
            category;
          ledger.push({
            id: `exp-${data.id}`,
            date: fmtDate(ms),
            sortAt: ms || 0,
            ref: `EXP-${String(data.id || '').substring(0, 6).toUpperCase()}`,
            type: 'Expense',
            description: `${category}: ${desc}`,
            debit: amount,
            credit: 0,
            balance: 0,
          });
        }

        // Purchases → debits (inventory / supplier activity)
        for (const data of rangedPurchases) {
          const amount =
            Number(data.total ?? data.totalCost ?? data.totalAmount ?? data.total_amount ?? 0) || 0;
          if (amount <= 0) continue;
          const ms = eventMs(data);
          totalPurchases += amount;
          // Count cash/partial paid portion toward operating outflows summary
          const paid = Number(data.paid ?? data.paidAmount ?? 0) || 0;
          const balanceDue = Number(data.balance ?? Math.max(0, amount - paid)) || 0;
          const method =
            balanceDue <= 0 ? 'cash' : paid > 0 ? 'partial' : 'credit';
          const note = data.note || data.receiptNumber || String(data.id || '').slice(-6);
          ledger.push({
            id: `pur-${data.id}`,
            date: fmtDate(ms),
            sortAt: ms || 0,
            ref: `PUR-${String(data.id || '').substring(0, 6).toUpperCase()}`,
            type: 'Purchase',
            description: `Purchase ${note}${method !== 'cash' ? ` (${method})` : ''}`,
            debit: amount,
            credit: 0,
            balance: 0,
          });
        }

        // Bank transactions (money in / out) — skip sale-linked rows already covered
        for (const data of rangedBankTx) {
          const amount = Number(data.amount) || 0;
          if (amount <= 0) continue;
          if (data.saleId || data.sale_id) continue;
          const typeRaw = String(data.type || '').toLowerCase();
          const isCredit =
            typeRaw === 'money_in' || typeRaw === 'in' || typeRaw === 'inflow';
          const ms = eventMs(data);
          const category = data.category || (isCredit ? 'Money In' : 'Money Out');
          // Avoid double-counting pure expense mirrors
          if (/^expense/i.test(String(category)) || /^purchase/i.test(String(category))) continue;
          if (isCredit) totalRevenue += amount;
          else totalExpenses += amount;
          ledger.push({
            id: `bank-${data.id}`,
            date: fmtDate(ms),
            sortAt: ms || 0,
            ref: `BNK-${String(data.id || '').substring(0, 6).toUpperCase()}`,
            type: isCredit ? 'Money In' : 'Money Out',
            description: data.description || category,
            debit: isCredit ? 0 : amount,
            credit: isCredit ? amount : 0,
            balance: 0,
          });
        }

        // cash_flow rows not already represented as expense/purchase
        for (const data of rangedCashFlow) {
          const amount = Number(data.amount) || Number(data.moneyOut) || Number(data.moneyIn) || 0;
          if (amount <= 0) continue;
          const category = String(data.category || '').toLowerCase();
          if (
            category === 'expense' ||
            category === 'purchase' ||
            category === 'purchases' ||
            category === 'stock' ||
            data.expenseId ||
            data.expense_id
          ) {
            continue;
          }
          const typeRaw = String(data.type || '').toLowerCase();
          const moneyIn = Number(data.moneyIn || data.money_in || 0) || 0;
          const isCredit =
            moneyIn > 0 ||
            typeRaw === 'in' ||
            typeRaw === 'inflow' ||
            typeRaw === 'money_in' ||
            typeRaw === 'income';
          const ms = eventMs(data);
          if (isCredit) totalRevenue += amount;
          else totalExpenses += amount;
          ledger.push({
            id: `cf-${data.id}`,
            date: fmtDate(ms),
            sortAt: ms || 0,
            ref: `CF-${String(data.id || '').substring(0, 6).toUpperCase()}`,
            type: isCredit ? 'Cash In' : 'Cash Out',
            description: data.description || data.category || 'Cash flow',
            debit: isCredit ? 0 : amount,
            credit: isCredit ? amount : 0,
            balance: 0,
          });
        }

        // Sort oldest → newest, compute running balance, then reverse for display
        ledger.sort((a, b) => a.sortAt - b.sortAt);
        let balance = 0;
        for (const tx of ledger) {
          balance += tx.credit - tx.debit;
          tx.balance = balance;
        }
        ledger.reverse();

        const allTransactions: Transaction[] = ledger.map(({ sortAt: _s, ...tx }) => tx);

        // Products / stock
        const visibleProducts = (productsDocs || []).filter((data: any) => {
          const status = String(data.status || '').toLowerCase();
          if (['inactive', 'archived', 'deleted', 'draft'].includes(status)) return false;
          return true;
        });

        let closingStock = 0;
        let openingStock = 0;
        const stockSummaryItems: StockItem[] = [];

        for (const data of visibleProducts) {
          const stock = Number(data.stock ?? data.stockLevel ?? data.quantity ?? 0) || 0;
          const cost = Number(data.cost ?? data.costPrice ?? 0) || 0;
          const value = stock * cost;
          closingStock += value;
          openingStock += value;
          stockSummaryItems.push({
            product: data.name || 'Product',
            open: stock,
            sold: 0,
            loss: 0,
            restock: 0,
            close: stock,
            value,
          });
        }

        // Purchases count toward expenses for statement P&L summary
        const expensesWithPurchases = totalExpenses + totalPurchases;

        setTransactions(allTransactions);
        setStockSummary(stockSummaryItems);
        setStats({
          totalRevenue,
          totalExpenses: expensesWithPurchases,
          netProfit: totalRevenue - expensesWithPurchases - totalCOGS,
          closingStock,
          openingStock,
          totalCOGS,
        });
      } catch (error: any) {
        console.error('Statement fetch error:', error);
        showToast(error?.message || 'Failed to load statement');
        setTransactions([]);
        setStockSummary([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [startDate, endDate, user?.id, user?.businessId, user?.email, showToast]);


  const stmtId = `STMT-${Date.now().toString().substring(5)}`;

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


  function applyPreset(preset: typeof activePreset) {
    const now = new Date();
    let start: Date;
    let end: Date;
    if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'last_30') {
      end = new Date(now);
      start = new Date(now);
      start.setDate(start.getDate() - 29);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else {
      setActivePreset('custom');
      return;
    }
    setActivePreset(preset);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (ledgerFilter === 'sale' && tx.type !== 'Sale') return false;
    if (ledgerFilter === 'expense' && !/expense|money out|cash out/i.test(tx.type)) return false;
    if (ledgerFilter === 'purchase' && tx.type !== 'Purchase') return false;
    if (
      ledgerFilter === 'stock' &&
      tx.type !== 'Stock' &&
      !/stock|inventory|restock|purchase/i.test(`${tx.type} ${tx.description}`)
    ) {
      return false;
    }
    if (stmtType === 'Sales Only' && tx.type !== 'Sale') return false;
    if (
      stmtType === 'Expenses Only' &&
      !/expense|purchase|money out|cash out/i.test(tx.type)
    ) {
      return false;
    }
    if (stmtType === 'Stock Movement' && tx.type === 'Sale') return false;
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.trim().toLowerCase();
      const hay = `${tx.date} ${tx.ref} ${tx.type} ${tx.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const marginPct =
    stats.totalRevenue > 0
      ? Math.round((stats.netProfit / stats.totalRevenue) * 1000) / 10
      : 0;

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
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <div className={styles.eyebrow}>Finance</div>
          <h1 className={styles.heading}>{t('statement.heading')}</h1>
          <p className={styles.sub}>{t('statement.subheading')}</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnGhost} onClick={handlePrint}>
            <PrintIcon /> {t('statement.print')}
          </button>
          <button type="button" className={styles.btnPrimary} onClick={handleDownload} disabled={downloading}>
            <DownloadIcon /> {downloading ? t('statement.preparingPDF') : t('statement.downloadPDF')}
          </button>
        </div>
      </header>

      {/* Period presets */}
      <div className={styles.presetRow} role="tablist" aria-label="Report period">
        {[
          { id: 'this_month' as const, label: 'This month' },
          { id: 'last_month' as const, label: 'Last month' },
          { id: 'last_30' as const, label: 'Last 30 days' },
          { id: 'this_year' as const, label: 'This year' },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={activePreset === p.id}
            className={`${styles.presetChip} ${activePreset === p.id ? styles.presetChipActive : ''}`}
            onClick={() => applyPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className={styles.filterLeft}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="stmt-start">{t('statement.startDate')}</label>
            <input
              id="stmt-start"
              type="date"
              className={styles.filterInput}
              value={startDate}
              onChange={(e) => {
                setActivePreset('custom');
                setStartDate(e.target.value);
              }}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel} htmlFor="stmt-end">{t('statement.endDate')}</label>
            <input
              id="stmt-end"
              type="date"
              className={styles.filterInput}
              value={endDate}
              onChange={(e) => {
                setActivePreset('custom');
                setEndDate(e.target.value);
              }}
            />
          </div>
        </div>
        <div className={styles.typeChips} role="group" aria-label="Statement type">
          {STATEMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`${styles.typeChip} ${stmtType === type ? styles.typeChipActive : ''}`}
              onClick={() => setStmtType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Insight + verify */}
      <div className={styles.topCards}>
        <div
          className={`${styles.insightCard} ${
            stats.netProfit >= 0 ? styles.insightPositive : styles.insightNegative
          }`}
        >
          <div className={styles.insightLabel}>
            {loading ? '…' : stats.netProfit >= 0 ? 'Profitable period' : 'Loss-making period'}
          </div>
          <div className={styles.insightValue}>
            {loading ? '—' : formatMoney(stats.netProfit)}
          </div>
          <div className={styles.insightMeta}>
            {loading
              ? 'Loading figures…'
              : `${marginPct}% net margin · ${startDate} → ${endDate}`}
          </div>
        </div>
        <div className={styles.verifyBanner}>
          <span className={styles.verifyCheck} aria-hidden>
            ✓
          </span>
          <div>
            <strong>{t('statement.verifiedTitle')}</strong>
            <p className={styles.verifyText}>
              {t('statement.verifiedDesc')} <strong>busmo.io/verify</strong> · ID{' '}
              <strong className={styles.mono}>{stmtId}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`${styles.kpiCard} ${styles.skeletonCard}`}>
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
                <div className={styles.skeletonLine} style={{ width: '70%', height: 22 }} />
                <div className={styles.skeletonLine} style={{ width: '50%' }} />
              </div>
            ))
          : [
              {
                label: t('statement.totalRevenue'),
                value: formatMoney(stats.totalRevenue),
                hint: t('statement.revenueChange'),
                tone: 'green' as const,
              },
              {
                label: t('statement.totalExpenses'),
                value: formatMoney(stats.totalExpenses),
                hint: t('statement.expenseChange'),
                tone: 'red' as const,
              },
              {
                label: t('statement.netProfit'),
                value: formatMoney(stats.netProfit),
                hint: t('statement.profitChange'),
                tone: 'purple' as const,
              },
              {
                label: 'Opening stock',
                value: formatMoney(stats.openingStock),
                hint: `${stockSummary.length} products`,
                tone: 'neutral' as const,
              },
              {
                label: t('statement.closingStock'),
                value: formatMoney(stats.closingStock),
                hint: `${stockSummary.length} ${t('statement.productsTracked')}`,
                tone: 'neutral' as const,
              },
            ].map((k) => (
              <div key={k.label} className={`${styles.kpiCard} ${styles[`kpiTone_${k.tone}`]}`}>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiValue}>{k.value}</div>
                <div className={styles.kpiChange}>{k.hint}</div>
              </div>
            ))}
      </div>

      {/* Hidden print document — unchanged structure below */}
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
              <div className="stat-box"><label>Opening Stock Value</label><div className="val">{formatMoney(stats.openingStock)}</div><div className="chg">{stockSummary.length} products</div></div>
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
                  <td style={{textAlign:'right',fontWeight:800}}>{formatMoney(stats.openingStock)}</td>
                  <td colSpan={4} style={{textAlign:'right',fontWeight:800}}>{t('statement.closingStockValue')}</td>
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

      {/* P&L */}
      {(stmtType === 'Full Summary' || stmtType === 'Profit & Loss') && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              {t('statement.profitLossStatement')}
            </h2>
            <span className={styles.sectionPeriod}>
              {startDate} → {endDate}
            </span>
          </div>
          <div className={styles.card}>
            {loading ? (
              <div className={styles.loadingBlock}>Loading profit & loss…</div>
            ) : (
              <table className={styles.plTable}>
                <tbody>
                  <tr>
                    <td className={styles.plGreen}>{t('statement.totalRevenue')}</td>
                    <td className={`${styles.plAmt} ${styles.plGreen}`}>+ {formatMoney(stats.totalRevenue)}</td>
                  </tr>
                  <tr>
                    <td className={styles.plRed}>{t('statement.cogs')}</td>
                    <td className={`${styles.plAmt} ${styles.plRed}`}>- {formatMoney(stats.totalCOGS)}</td>
                  </tr>
                  <tr className={styles.plDivider}>
                    <td style={{ fontWeight: 700 }}>{t('statement.grossProfit')}</td>
                    <td className={styles.plAmt} style={{ fontWeight: 700 }}>
                      {formatMoney(stats.totalRevenue - stats.totalCOGS)}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.plIndent}>{t('statement.otherOperatingExpenses')}</td>
                    <td className={`${styles.plAmt} ${styles.plMuted}`}>- {formatMoney(stats.totalExpenses)}</td>
                  </tr>
                  <tr className={styles.plTotal}>
                    <td>{t('statement.netProfitAfterCosts')}</td>
                    <td className={`${styles.plAmt} ${styles.plPurple}`}>{formatMoney(stats.netProfit)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* Ledger */}
      {(stmtType === 'Full Summary' || stmtType === 'Sales Only' || stmtType === 'Expenses Only') && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('statement.transactionLedger')}</h2>
            <span className={styles.sectionCount}>
              {loading ? '…' : `${filteredTransactions.length} rows`}
            </span>
          </div>
          <div className={styles.tableWrap}>
            <div className={styles.tableTop}>
              <div className={styles.ledgerFilters}>
                {[
                  { id: 'all' as const, label: t('statement.allTransactions') },
                  { id: 'sale' as const, label: t('statement.salesOnly') },
                  { id: 'expense' as const, label: t('statement.expensesOnly') },
                  { id: 'purchase' as const, label: 'Purchases' },
                  { id: 'stock' as const, label: t('statement.stockMovements') },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.ledgerChip} ${ledgerFilter === f.id ? styles.ledgerChipActive : ''}`}
                    onClick={() => setLedgerFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search date, ref, description…"
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                aria-label="Search transactions"
              />
            </div>
            <div className={styles.tableScroll}>
              {loading ? (
                <div className={styles.loadingBlock}>Loading transactions…</div>
              ) : filteredTransactions.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden>
                    📋
                  </div>
                  <div className={styles.emptyTitle}>{t('statement.noTransactions')}</div>
                  <p className={styles.emptyDesc}>
                    Try another date range or statement type. Sales, expenses, purchases, and bank activity in this period will show here.
                  </p>
                </div>
              ) : (
                <table className={styles.ledgerTable}>
                  <thead>
                    <tr>
                      <th>{t('statement.table.date')}</th>
                      <th>{t('statement.table.reference')}</th>
                      <th>{t('statement.table.type')}</th>
                      <th>{t('statement.table.description')}</th>
                      <th className={styles.right}>{t('statement.table.debit')}</th>
                      <th className={styles.right}>{t('statement.table.credit')}</th>
                      <th className={styles.right}>{t('statement.table.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className={styles.mono}>{tx.date}</td>
                        <td className={`${styles.mono} ${styles.muted} ${styles.tiny}`}>{tx.ref}</td>
                        <td>
                          <span
                            className={`${styles.pill} ${
                              tx.type === 'Sale' || /money in|cash in/i.test(tx.type)
                                ? styles.pillGreen
                                : tx.type === 'Expense' ||
                                    tx.type === 'Purchase' ||
                                    /money out|cash out/i.test(tx.type)
                                  ? styles.pillRed
                                  : styles.pillAmber
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td>{tx.description}</td>
                        <td className={`${styles.mono} ${styles.right} ${styles.debit}`}>
                          {tx.debit > 0 ? formatMoney(tx.debit) : '—'}
                        </td>
                        <td className={`${styles.mono} ${styles.right} ${styles.credit}`}>
                          {tx.credit > 0 ? formatMoney(tx.credit) : '—'}
                        </td>
                        <td className={`${styles.mono} ${styles.right}`} style={{ fontWeight: 600 }}>
                          {formatMoney(tx.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Stock */}
      {(stmtType === 'Full Summary' || stmtType === 'Stock Movement') && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{t('statement.inventorySummary')}</h2>
            <span className={styles.sectionCount}>
              {loading ? '…' : `${stockSummary.length} products`}
            </span>
          </div>
          <div className={styles.tableWrap}>
            <div className={styles.tableScroll}>
              {loading ? (
                <div className={styles.loadingBlock}>Loading inventory…</div>
              ) : stockSummary.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden>
                    📦
                  </div>
                  <div className={styles.emptyTitle}>{t('statement.noProducts')}</div>
                  <p className={styles.emptyDesc}>
                    Add products on Inventory to include stock movement on this statement.
                  </p>
                </div>
              ) : (
                <table className={styles.stockTable}>
                  <thead>
                    <tr>
                      <th>{t('statement.table.product')}</th>
                      <th className={styles.right}>{t('statement.table.opening')}</th>
                      <th className={styles.right}>{t('statement.table.sold')}</th>
                      <th className={styles.right}>{t('statement.table.loss')}</th>
                      <th className={styles.right}>{t('statement.table.restock')}</th>
                      <th className={styles.right}>{t('statement.table.closing')}</th>
                      <th className={styles.right}>{t('statement.table.value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSummary.map((s) => (
                      <tr key={s.product}>
                        <td>{s.product}</td>
                        <td className={`${styles.mono} ${styles.right}`}>{s.open}</td>
                        <td
                          className={`${styles.mono} ${styles.right} ${
                            s.sold > 0 ? styles.debit : styles.muted
                          }`}
                        >
                          {s.sold > 0 ? `-${s.sold}` : '0'}
                        </td>
                        <td
                          className={`${styles.mono} ${styles.right} ${
                            s.loss > 0 ? styles.debit : styles.muted
                          }`}
                        >
                          {s.loss > 0 ? `-${s.loss}` : '0'}
                        </td>
                        <td
                          className={`${styles.mono} ${styles.right} ${
                            s.restock > 0 ? styles.credit : styles.muted
                          }`}
                        >
                          {s.restock > 0 ? `+${s.restock}` : '0'}
                        </td>
                        <td className={`${styles.mono} ${styles.right}`} style={{ fontWeight: 700 }}>
                          {s.close}
                        </td>
                        <td
                          className={`${styles.mono} ${styles.right}`}
                          style={{ fontWeight: 700, color: 'var(--purple)' }}
                        >
                          {formatMoney(s.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={styles.stockFooter}>
                      <td style={{ fontWeight: 800 }}>{t('statement.table.total')}</td>
                      <td colSpan={5} className={styles.right} style={{ fontWeight: 800 }}>
                        {t('statement.closingStockValue')}
                      </td>
                      <td
                        className={`${styles.mono} ${styles.right}`}
                        style={{ fontWeight: 800, color: 'var(--purple)' }}
                      >
                        {formatMoney(stats.closingStock)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function PrintIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:13,height:13}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;
}
function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width:13,height:13}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}

