"use client";

import React, { useState } from 'react';
import { Navbar } from '../welcome/components/Navbar';
import { Footer } from '../welcome/components/Footer';
import { LangProvider } from '../owner/dashboard/LangContext';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import styles from './verify.module.css';
import type { Page } from '../welcome/types';

export default function VerifyPage() {
  const [statementId, setStatementId] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: any;
    error?: string;
  }>({ status: 'idle' });

  const handleNavigate = (page: Page) => {
    if (page === 'signup') window.location.href = '/welcome/signup';
    else if (page === 'login') window.location.href = '/login';
    else if (page === 'pricing') window.location.href = '/pricing';
    else if (page === 'seller') window.location.href = '/seller';
    else if (page === 'invest') window.location.href = '/invest';
    else if (page === 'verify') window.location.href = '/verify';
    else window.location.href = '/welcome';
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementId.trim()) return;

    setVerificationResult({ status: 'loading' });

    try {
      const { firestore } = initializeFirebase();
      
      // Query Firestore for the statement
      const statementDoc = await getDoc(doc(firestore, 'statements', statementId.trim()));
      
      if (statementDoc.exists()) {
        const data = statementDoc.data();
        setVerificationResult({
          status: 'success',
          data: {
            businessName: data.businessName || 'Unknown Business',
            statementDate: data.createdAt?.toDate?.() || new Date(),
            totalRevenue: `₦${(data.totalRevenue || 0).toLocaleString()}`,
            totalExpenses: `₦${(data.totalExpenses || 0).toLocaleString()}`,
            netProfit: `₦${((data.totalRevenue || 0) - (data.totalExpenses || 0)).toLocaleString()}`,
            verifiedBy: 'Busmo',
            verificationId: statementId,
          },
        });
      } else {
        setVerificationResult({
          status: 'error',
          error: 'Statement ID not found. Please verify the ID and try again.',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        status: 'error',
        error: 'Unable to verify statement. Please check the ID and try again.',
      });
    }
  };

  return (
    <div className={styles.verifyPage}>
      <LangProvider>
        <Navbar currentPage="verify" onNavigate={handleNavigate} />
      </LangProvider>

      <main className={styles.verifyMain}>
        <div className={styles.maxW}>
          <div className={styles.verifyContainer}>
            <div className={styles.verifyHeader}>
              <div className={styles.verifyIcon}>✓</div>
              <h1 className={styles.verifyTitle}>Verify Business Statement</h1>
              <p className={styles.verifySubtitle}>
                Enter the statement ID to verify if a business statement is authentic and from Busmo.
              </p>
            </div>

            <form className={styles.verifyForm} onSubmit={handleVerify}>
              <div className={styles.formGroup}>
                <label htmlFor="statementId">Statement ID *</label>
                <input
                  type="text"
                  id="statementId"
                  value={statementId}
                  onChange={(e) => setStatementId(e.target.value)}
                  placeholder="Enter the statement ID from the document"
                  required
                />
                <p className={styles.formHint}>
                  The statement ID is typically found at the top or bottom of the Busmo statement document.
                </p>
              </div>

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={verificationResult.status === 'loading' || !statementId.trim()}
              >
                {verificationResult.status === 'loading' ? 'Verifying...' : 'Verify Statement'}
              </button>
            </form>

            {verificationResult.status === 'success' && verificationResult.data && (
              <div className={`${styles.verificationResult} ${styles.success}`}>
                <div className={styles.resultHeader}>
                  <span className={`${styles.resultIcon} ${styles.successIcon}`}>✓</span>
                  <h2>Statement Verified</h2>
                </div>
                <div className={styles.resultContent}>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Business Name:</span>
                    <span className={styles.resultValue}>{verificationResult.data.businessName}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Statement Date:</span>
                    <span className={styles.resultValue}>
                      {new Date(verificationResult.data.statementDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Total Revenue:</span>
                    <span className={styles.resultValue}>{verificationResult.data.totalRevenue}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Total Expenses:</span>
                    <span className={styles.resultValue}>{verificationResult.data.totalExpenses}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Net Profit:</span>
                    <span className={styles.resultValue}>{verificationResult.data.netProfit}</span>
                  </div>
                  <div className={styles.resultItem}>
                    <span className={styles.resultLabel}>Verified By:</span>
                    <span className={styles.resultValue}>{verificationResult.data.verifiedBy}</span>
                  </div>
                </div>
                <div className={styles.resultFooter}>
                  <p className={styles.resultNote}>
                    This statement has been verified as authentic and generated by Busmo.
                  </p>
                </div>
              </div>
            )}

            {verificationResult.status === 'error' && (
              <div className={`${styles.verificationResult} ${styles.error}`}>
                <div className={styles.resultHeader}>
                  <span className={`${styles.resultIcon} ${styles.errorIcon}`}>✕</span>
                  <h2>Verification Failed</h2>
                </div>
                <p className={styles.resultMessage}>{verificationResult.error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <LangProvider>
        <Footer onNavigate={handleNavigate} />
      </LangProvider>
    </div>
  );
}
