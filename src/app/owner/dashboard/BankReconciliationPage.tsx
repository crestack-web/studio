'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { fetchDocs } from '@/lib/supabase-client-data';
import { getSupabase } from '@/lib/supabase';
import { getFirestoreUserId } from '@/lib/supabase-auth';
import { resolveOwnerScopeBusinessId } from '@/lib/resolve-business-scope';
import styles from './BankReconciliationPage.module.css';

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
  matched: boolean;
  matchedWith?: string;
}

interface BusmoTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'sale' | 'expense';
  paymentMethod: string;
  paymentMethods?: Record<string, number>;
  matched: boolean;
  matchedWith?: string;
  isSplitPayment?: boolean;
}

export function BankReconciliationPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(user?.businessId || null);
  const [resolveDone, setResolveDone] = useState(Boolean(user?.businessId));
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [busmoTransactions, setBusmoTransactions] = useState<BusmoTransaction[]>([]);
  const [selectedBankTx, setSelectedBankTx] = useState<string | null>(null);
  const [selectedBusmoTx, setSelectedBusmoTx] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [reconciliationSummary, setReconciliationSummary] = useState({
    totalBankBalance: 0,
    totalBusmoBalance: 0,
    unmatchedBank: 0,
    unmatchedBusmo: 0,
    discrepancy: 0,
  });

  // Resolve business scope — without this, loading stayed true forever
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (user?.businessId) {
          if (!cancelled) {
            setBusinessId(user.businessId);
            setResolveDone(true);
          }
          return;
        }
        const userIds = getFirestoreUserId();
        let authId = user?.id;
        if (!authId) {
          const { data } = await getSupabase().auth.getSession();
          authId = data.session?.user?.id;
        }
        if (!authId && userIds) authId = userIds.firestoreUid;
        if (!authId) {
          if (!cancelled) {
            setResolveDone(true);
            setLoading(false);
          }
          return;
        }
        const bid = await resolveOwnerScopeBusinessId(authId, user?.businessId);
        if (!cancelled) {
          if (bid) setBusinessId(bid);
          else setLoading(false);
          setResolveDone(true);
        }
      } catch (e) {
        console.error('Bank recon resolve business', e);
        if (!cancelled) {
          setResolveDone(true);
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user?.businessId, user?.id]);

  useEffect(() => {
    if (businessId) {
      fetchTransactions();
    } else if (resolveDone) {
      setLoading(false);
    }
  }, [businessId, resolveDone]);

  async function fetchTransactions() {
    if (!businessId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const salesData = await fetchDocs(`businesses/${businessId}/sales`, { orderBy: { field: 'created_at', ascending: false } });
      const expensesData = await fetchDocs(`businesses/${businessId}/expenses`, { orderBy: { field: 'created_at', ascending: false } });

      const busmoTx: BusmoTransaction[] = [];

      salesData.forEach((item: any) => {
        const data = item;
        const paymentMethod = data.paymentMethod || 'cash';
        const paymentMethods = data.paymentMethods || {};
        
        const hasBankPayment = paymentMethod === 'transfer' || 
                              paymentMethod === 'card' ||
                              paymentMethod === 'pos' ||
                              (paymentMethod === 'split' && (paymentMethods['Transfer'] || paymentMethods['Card'] || paymentMethods['transfer'] || paymentMethods['card'] || paymentMethods['pos']));
        
        if (hasBankPayment) {
          let bankAmount = data.totalRevenue || data.total || 0;
          let isSplit = false;
          
          if (paymentMethod === 'split' && paymentMethods) {
            isSplit = true;
            bankAmount = (paymentMethods['Transfer'] || paymentMethods['transfer'] || 0) + (paymentMethods['Card'] || paymentMethods['card'] || paymentMethods['pos'] || 0);
          }
          
          busmoTx.push({
            id: item.id,
            date: data.createdAt ? new Date(data.createdAt) : new Date(),
            description: isSplit 
              ? `Sale (Split): ${data.products?.[0]?.name || data.items?.[0]?.name || 'Multiple items'} - Bank portion`
              : `Sale: ${data.products?.[0]?.name || data.items?.[0]?.name || 'Multiple items'}`,
            amount: bankAmount,
            type: 'sale',
            paymentMethod: paymentMethod,
            paymentMethods: paymentMethods,
            matched: false,
            isSplitPayment: isSplit,
          });
        }
      });

      expensesData.forEach((item: any) => {
        const data = item;
        const paymentMethod = data.paymentMethod || 'transfer';
        const hasBankPayment = paymentMethod === 'transfer' || paymentMethod === 'card' || paymentMethod === 'pos' || paymentMethod === 'bank';
        
        if (hasBankPayment) {
          busmoTx.push({
            id: item.id,
            date: data.createdAt ? new Date(data.createdAt) : new Date(),
            description: data.description || data.category || 'Expense',
            amount: data.amount || 0,
            type: 'expense',
            paymentMethod: paymentMethod,
            matched: false,
          });
        }
      });

      setBusmoTransactions(busmoTx);

      const busmoBalance = busmoTx.reduce((acc, tx) => {
        return acc + (tx.type === 'sale' ? tx.amount : -tx.amount);
      }, 0);

      const bankBalance = bankTransactions.reduce((acc, tx) => {
        return acc + (tx.type === 'credit' ? tx.amount : -tx.amount);
      }, 0);

      setReconciliationSummary({
        totalBankBalance: bankBalance,
        totalBusmoBalance: busmoBalance,
        unmatchedBank: bankTransactions.filter(t => !t.matched).length,
        unmatchedBusmo: busmoTx.filter(t => !t.matched).length,
        discrepancy: bankBalance - busmoBalance,
      });

    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  function handleImportPDF() {
    if (!pdfFile) {
      showToast('Please select a PDF file');
      return;
    }
    showToast('PDF upload — use CSV import from bank export for reliable matching');
    setShowImportModal(false);
    setPdfFile(null);
  }

  function handleMatch() {
    if (!selectedBankTx || !selectedBusmoTx) {
      showToast('Please select both a bank and Busmo transaction');
      return;
    }

    setBankTransactions(prev => prev.map(tx => 
      tx.id === selectedBankTx ? { ...tx, matched: true, matchedWith: selectedBusmoTx } : tx
    ));
    setBusmoTransactions(prev => prev.map(tx => 
      tx.id === selectedBusmoTx ? { ...tx, matched: true, matchedWith: selectedBankTx } : tx
    ));

    setSelectedBankTx(null);
    setSelectedBusmoTx(null);
    showToast('Transactions matched successfully');
  }

  function handleUnmatch(bankId: string, busmoId?: string) {
    setBankTransactions(prev => prev.map(tx => 
      tx.id === bankId ? { ...tx, matched: false, matchedWith: undefined } : tx
    ));
    if (busmoId) {
      setBusmoTransactions(prev => prev.map(tx => 
        tx.id === busmoId ? { ...tx, matched: false, matchedWith: undefined } : tx
      ));
    }
    showToast('Match removed');
  }

  if (resolveDone && !businessId && !loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.heading}>Bank Reconciliation</h1>
            <p className={styles.sub}>Match bank transactions with Busmo sales and expenses</p>
          </div>
        </div>
        <div className={styles.empty}>
          <p>No business found. Finish onboarding or refresh and try again.</p>
          <button type="button" className={styles.importBtn} onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Bank Reconciliation</h1>
          <p className={styles.sub}>Match bank transactions with Busmo sales and expenses</p>
        </div>
        <button className={styles.importBtn} onClick={() => setShowImportModal(true)}>
          Import Statement
        </button>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Bank Balance</div>
          <div className={styles.cardValue}>{formatMoney(reconciliationSummary.totalBankBalance)}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Busmo Balance</div>
          <div className={styles.cardValue}>{formatMoney(reconciliationSummary.totalBusmoBalance)}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Discrepancy</div>
          <div className={`${styles.cardValue} ${Math.abs(reconciliationSummary.discrepancy) < 0.01 ? styles.positive : styles.negative}`}>
            {formatMoney(Math.abs(reconciliationSummary.discrepancy))}
          </div>
          <div className={styles.cardSub}>
            {reconciliationSummary.unmatchedBank} bank · {reconciliationSummary.unmatchedBusmo} Busmo unmatched
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading transactions…</p>
        </div>
      ) : (
        <div className={styles.transactionsGrid}>
          <div className={styles.transactionPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Bank Transactions</h3>
              <span className={styles.panelCount}>{bankTransactions.length}</span>
            </div>
            <div className={styles.transactionList}>
              {bankTransactions.length === 0 ? (
                <div className={styles.empty}>
                  <p>No bank transactions imported yet</p>
                  <p className={styles.emptySub}>Import a bank statement to get started</p>
                  <button type="button" className={styles.emptyBtn} onClick={() => setShowImportModal(true)}>Import Statement</button>
                </div>
              ) : (
                bankTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className={`${styles.transactionItem} ${selectedBankTx === tx.id ? styles.selected : ''} ${tx.matched ? styles.matched : ''}`}
                    onClick={() => !tx.matched && setSelectedBankTx(tx.id === selectedBankTx ? null : tx.id)}
                  >
                    <div className={styles.txInfo}>
                      <div className={styles.txDate}>{tx.date}</div>
                      <div className={styles.txDescription}>{tx.description}</div>
                      {tx.reference && <div className={styles.txRef}>Ref: {tx.reference}</div>}
                    </div>
                    <div className={styles.txAmount}>
                      <span className={`${styles.amount} ${tx.type === 'credit' ? styles.credit : styles.debit}`}>
                        {tx.type === 'credit' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                      {tx.matched && (
                        <button className={styles.unmatchBtn} onClick={(e) => { e.stopPropagation(); handleUnmatch(tx.id, tx.matchedWith); }}>
                          Unmatch
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.transactionPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Busmo Transactions</h3>
              <span className={styles.panelCount}>{busmoTransactions.length}</span>
            </div>
            <div className={styles.transactionList}>
              {busmoTransactions.length === 0 ? (
                <div className={styles.empty}>
                  <p>No bank-related sales or expenses found</p>
                  <p className={styles.emptySub}>Transfer, card, and POS payments appear here</p>
                </div>
              ) : (
                busmoTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className={`${styles.transactionItem} ${selectedBusmoTx === tx.id ? styles.selected : ''} ${tx.matched ? styles.matched : ''}`}
                    onClick={() => !tx.matched && setSelectedBusmoTx(tx.id === selectedBusmoTx ? null : tx.id)}
                  >
                    <div className={styles.txInfo}>
                      <div className={styles.txDate}>{tx.date.toLocaleDateString()}</div>
                      <div className={styles.txDescription}>{tx.description}</div>
                      <div className={styles.txMeta}>
                        <span className={styles.txType}>{tx.type}</span>
                        <span className={styles.txMethod}>{tx.paymentMethod}</span>
                        {tx.isSplitPayment && <span className={styles.txSplitBadge}>Split</span>}
                      </div>
                    </div>
                    <div className={styles.txAmount}>
                      <span className={`${styles.amount} ${tx.type === 'sale' ? styles.credit : styles.debit}`}>
                        {tx.type === 'sale' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                      {tx.matched && tx.matchedWith && (
                        <button className={styles.unmatchBtn} onClick={(e) => { e.stopPropagation(); handleUnmatch(tx.matchedWith!, tx.id); }}>
                          Unmatch
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBankTx && selectedBusmoTx && (
        <div className={styles.matchBar}>
          <div className={styles.matchInfo}>
            <span>Ready to match selected transactions</span>
          </div>
          <div className={styles.matchActions}>
            <button className={styles.cancelBtn} onClick={() => { setSelectedBankTx(null); setSelectedBusmoTx(null); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleMatch}>Confirm Match</button>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Import Bank Statement</h3>
            <p className={styles.modalSub}>Upload a PDF bank statement (CSV recommended for accurate parsing).</p>
            <input
              type="file"
              accept=".pdf,.csv"
              className={styles.fileInput}
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            />
            {pdfFile && (
              <div className={styles.fileInfo}>
                <span>{pdfFile.name}</span>
                <span>{(pdfFile.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowImportModal(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleImportPDF} disabled={!pdfFile}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankReconciliationPage;
