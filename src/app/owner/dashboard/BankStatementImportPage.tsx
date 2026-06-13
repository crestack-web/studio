'use client';

import React, { useState, useRef } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { BankTransaction } from './types';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import styles from './BankStatementImportPage.module.css';

export default function BankStatementImportPage() {
  const { user, showToast, navigateTo } = useApp();
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<BankTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const parseCSV = (content: string): BankTransaction[] => {
    const lines = content.split('\n');
    const transactions: BankTransaction[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',');
      if (columns.length < 4) continue;
      
      // Expected CSV format: Date,Description,Amount,Type,Reference,Account
      const date = new Date(columns[0]);
      const narration = columns[1] || '';
      const amount = parseFloat(columns[2]) || 0;
      const type = columns[3]?.toLowerCase() === 'debit' ? 'debit' : 'credit';
      const reference = columns[4] || '';
      const accountNumber = columns[5] || '';
      
      transactions.push({
        id: '',
        merchantId: user.businessId || '',
        date,
        amount,
        type,
        narration,
        reference,
        accountNumber,
        accountName: '',
        bankName: '',
        importedAt: new Date(),
      });
    }
    
    return transactions;
  };

  const handleImport = async () => {
    if (!selectedFile || !user.businessId) {
      showToast('Please select a file and ensure you have a business ID');
      return;
    }

    setLoading(true);
    try {
      const content = await selectedFile.text();
      const transactions = parseCSV(content);
      
      if (transactions.length === 0) {
        showToast('No transactions found in file');
        setLoading(false);
        return;
      }

      const { firestore } = initializeFirebase();
      const bankTransactionsRef = collection(firestore, 'merchants', user.businessId, 'bankTransactions');
      
      const savedTransactions: BankTransaction[] = [];
      
      for (const transaction of transactions) {
        const docRef = await addDoc(bankTransactionsRef, {
          ...transaction,
          merchantId: user.businessId,
          importedAt: Timestamp.now(),
        });
        
        savedTransactions.push({
          ...transaction,
          id: docRef.id,
        });
      }
      
      setImportedTransactions(savedTransactions);
      showToast(`Successfully imported ${savedTransactions.length} transactions`);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing bank statement:', error);
      showToast('Failed to import bank statement. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const TransactionRow = ({ transaction }: { transaction: BankTransaction }) => (
    <div className={styles.transactionRow}>
      <div className={styles.transactionDate}>{transaction.date.toLocaleDateString()}</div>
      <div className={styles.transactionNarration}>{transaction.narration}</div>
      <div className={styles.transactionReference}>{transaction.reference || '-'}</div>
      <div className={`${styles.transactionAmount} ${transaction.type === 'credit' ? styles.credit : styles.debit}`}>
        {transaction.type === 'credit' ? '+' : '-'}{formatMoney(transaction.amount)}
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Import Bank Statement</h1>
          <p className={styles.pageDesc}>Upload your bank statement to automatically reconcile transactions</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('money-control')}>← Back to Money Control</Button>
      </div>

      <div className={styles.content}>
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </CardIcon>
            Upload Bank Statement
          </CardHeader>
          
          <div className={styles.uploadSection}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className={styles.fileInput}
            />
            <div className={styles.uploadInstructions}>
              <h3>Supported Formats</h3>
              <ul>
                <li>CSV files with columns: Date, Description, Amount, Type, Reference, Account</li>
                <li>Date format: YYYY-MM-DD or DD/MM/YYYY</li>
                <li>Type: credit or debit</li>
              </ul>
            </div>
            {selectedFile && (
              <div className={styles.selectedFile}>
                <span className={styles.fileName}>{selectedFile.name}</span>
                <span className={styles.fileSize}>{(selectedFile.size / 1024).toFixed(2)} KB</span>
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!selectedFile || loading}
              className={styles.importBtn}
            >
              {loading ? 'Importing...' : 'Import Transactions'}
            </Button>
          </div>
        </Card>

        {/* Imported Transactions */}
        {importedTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardIcon bg="var(--green-bg)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </CardIcon>
              Imported Transactions ({importedTransactions.length})
            </CardHeader>
            
            <div className={styles.transactionsList}>
              <div className={styles.transactionHeader}>
                <div className={styles.headerDate}>Date</div>
                <div className={styles.headerNarration}>Description</div>
                <div className={styles.headerReference}>Reference</div>
                <div className={styles.headerAmount}>Amount</div>
              </div>
              {importedTransactions.map(transaction => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </div>
            
            <div className={styles.actions}>
              <Button variant="primary" onClick={() => navigateTo('money-control')}>
                Proceed to Reconciliation
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
