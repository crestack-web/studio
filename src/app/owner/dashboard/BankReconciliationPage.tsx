'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, orderBy } from 'firebase/firestore';
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
  matched: boolean;
  matchedWith?: string;
}

export function BankReconciliationPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const firestore = useFirestore();
  
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
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

  useEffect(() => {
    async function fetchBusinessId() {
      try {
        const { auth } = initializeFirebase();
        const currentUser = auth.currentUser;
        
        if (!currentUser) return;

        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBusinessId(userData.businessId || null);
        }
      } catch (error) {
        console.error('Error fetching business ID:', error);
      }
    }

    fetchBusinessId();
  }, [firestore]);

  useEffect(() => {
    if (businessId) {
      fetchTransactions();
    }
  }, [businessId]);

  async function fetchTransactions() {
    if (!businessId || !firestore) return;

    try {
      setLoading(true);

      // Fetch Busmo sales
      const salesQuery = query(
        collection(firestore, 'businesses', businessId, 'sales'),
        orderBy('createdAt', 'desc')
      );
      const salesSnapshot = await getDocs(salesQuery);

      // Fetch Busmo expenses
      const expensesQuery = query(
        collection(firestore, 'businesses', businessId, 'expenses'),
        orderBy('createdAt', 'desc')
      );
      const expensesSnapshot = await getDocs(expensesQuery);

      // Convert to Busmo transactions
      const busmoTx: BusmoTransaction[] = [];

      salesSnapshot.forEach(doc => {
        const data = doc.data();
        busmoTx.push({
          id: doc.id,
          date: data.createdAt?.toDate() || new Date(),
          description: `Sale: ${data.products?.[0]?.name || 'Multiple items'}`,
          amount: data.totalRevenue || data.total || 0,
          type: 'sale',
          paymentMethod: data.paymentMethod || 'cash',
          matched: false,
        });
      });

      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        busmoTx.push({
          id: doc.id,
          date: data.createdAt?.toDate() || new Date(),
          description: data.description || data.category || 'Expense',
          amount: data.amount || 0,
          type: 'expense',
          paymentMethod: data.paymentMethod || 'transfer',
          matched: false,
        });
      });

      setBusmoTransactions(busmoTx);

      // Calculate summary
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

    // For now, we'll simulate PDF processing
    // In a real implementation, you would use a PDF parsing library like pdf-parse
    showToast('PDF upload functionality - PDF parsing will be implemented');
    setShowImportModal(false);
    setPdfFile(null);
    
    // TODO: Implement actual PDF parsing logic
    // This would typically involve:
    // 1. Reading the PDF file
    // 2. Extracting transaction data
    // 3. Converting to BankTransaction format
  }

  function handleMatchTransactions() {
    if (!selectedBankTx || !selectedBusmoTx) {
      showToast('Please select one bank transaction and one Busmo transaction to match');
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
    fetchTransactions();
  }

  function handleUnmatchTransaction(txId: string, type: 'bank' | 'busmo') {
    if (type === 'bank') {
      const bankTx = bankTransactions.find(t => t.id === txId);
      if (bankTx?.matchedWith) {
        setBankTransactions(prev => prev.map(tx => 
          tx.id === txId ? { ...tx, matched: false, matchedWith: undefined } : tx
        ));
        setBusmoTransactions(prev => prev.map(tx => 
          tx.id === bankTx.matchedWith ? { ...tx, matched: false, matchedWith: undefined } : tx
        ));
      }
    } else {
      const busmoTx = busmoTransactions.find(t => t.id === txId);
      if (busmoTx?.matchedWith) {
        setBusmoTransactions(prev => prev.map(tx => 
          tx.id === txId ? { ...tx, matched: false, matchedWith: undefined } : tx
        ));
        setBankTransactions(prev => prev.map(tx => 
          tx.id === busmoTx.matchedWith ? { ...tx, matched: false, matchedWith: undefined } : tx
        ));
      }
    }
    showToast('Transaction unmatched');
    fetchTransactions();
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Bank Reconciliation</h1>
          <p className={styles.sub}>Match your bank transactions with Busmo sales and expenses</p>
        </div>
        <button className={styles.importBtn} onClick={() => setShowImportModal(true)}>
          Import Bank Statement
        </button>
      </div>

      {/* Reconciliation Summary */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Bank Balance</div>
          <div className={styles.cardValue}>{formatMoney(reconciliationSummary.totalBankBalance)}</div>
          <div className={styles.cardSub}>{reconciliationSummary.unmatchedBank} unmatched</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Busmo Balance</div>
          <div className={styles.cardValue}>{formatMoney(reconciliationSummary.totalBusmoBalance)}</div>
          <div className={styles.cardSub}>{reconciliationSummary.unmatchedBusmo} unmatched</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Discrepancy</div>
          <div className={`${styles.cardValue} ${Math.abs(reconciliationSummary.discrepancy) < 0.01 ? 'positive' : 'negative'}`}>
            {formatMoney(Math.abs(reconciliationSummary.discrepancy))}
          </div>
          <div className={styles.cardSub}>
            {Math.abs(reconciliationSummary.discrepancy) < 0.01 ? 'Reconciled ✓' : 'Needs attention'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading transactions...</p>
        </div>
      ) : (
        <div className={styles.transactionsGrid}>
          {/* Bank Transactions */}
          <div className={styles.transactionPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Bank Transactions</h3>
              <span className={styles.panelCount}>{bankTransactions.length} transactions</span>
            </div>
            <div className={styles.transactionList}>
              {bankTransactions.length === 0 ? (
                <div className={styles.empty}>
                  <p>No bank transactions imported yet</p>
                  <button className={styles.emptyBtn} onClick={() => setShowImportModal(true)}>
                    Import Bank Statement
                  </button>
                </div>
              ) : (
                bankTransactions.map(tx => (
                  <div
                    key={tx.id}
                    className={`${styles.transactionItem} ${selectedBankTx === tx.id ? styles.selected : ''} ${tx.matched ? styles.matched : ''}`}
                    onClick={() => setSelectedBankTx(tx.id)}
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
                        <button
                          className={styles.unmatchBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatchTransaction(tx.id, 'bank');
                          }}
                        >
                          Unmatch
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Busmo Transactions */}
          <div className={styles.transactionPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Busmo Transactions</h3>
              <span className={styles.panelCount}>{busmoTransactions.length} transactions</span>
            </div>
            <div className={styles.transactionList}>
              {busmoTransactions.map(tx => (
                <div
                  key={tx.id}
                  className={`${styles.transactionItem} ${selectedBusmoTx === tx.id ? styles.selected : ''} ${tx.matched ? styles.matched : ''}`}
                  onClick={() => setSelectedBusmoTx(tx.id)}
                >
                  <div className={styles.txInfo}>
                    <div className={styles.txDate}>{tx.date.toLocaleDateString()}</div>
                    <div className={styles.txDescription}>{tx.description}</div>
                    <div className={styles.txMeta}>
                      <span className={styles.txType}>{tx.type}</span>
                      <span className={styles.txMethod}>{tx.paymentMethod}</span>
                    </div>
                  </div>
                  <div className={styles.txAmount}>
                    <span className={`${styles.amount} ${tx.type === 'sale' ? styles.credit : styles.debit}`}>
                      {tx.type === 'sale' ? '+' : '-'}{formatMoney(tx.amount)}
                    </span>
                    {tx.matched && (
                      <button
                        className={styles.unmatchBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnmatchTransaction(tx.id, 'busmo');
                        }}
                      >
                        Unmatch
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Button */}
      {selectedBankTx && selectedBusmoTx && (
        <div className={styles.matchBar}>
          <div className={styles.matchInfo}>
            <span>Match selected transactions?</span>
          </div>
          <div className={styles.matchActions}>
            <button className={styles.cancelBtn} onClick={() => {
              setSelectedBankTx(null);
              setSelectedBusmoTx(null);
            }}>
              Cancel
            </button>
            <button className={styles.confirmBtn} onClick={handleMatchTransactions}>
              Match Transactions
            </button>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay} onClick={() => setShowImportModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Import Bank Statement</h3>
            <p className={styles.modalSub}>
              Upload your bank statement PDF file
            </p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPdfFile(file);
                }
              }}
              className={styles.fileInput}
            />
            {pdfFile && (
              <div className={styles.fileInfo}>
                <span>{pdfFile.name}</span>
                <span>({(pdfFile.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button className={styles.confirmBtn} onClick={handleImportPDF} disabled={!pdfFile}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankReconciliationPage;
