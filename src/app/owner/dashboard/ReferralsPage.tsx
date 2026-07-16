import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { initializeFirebase } from '@/firebase';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import styles from './ReferralsPage.module.css';

// ═══════════════════════════════════════════
//  ReferralsPage
// ═══════════════════════════════════════════

const DEFAULT_REFERRAL_LINK = 'https://busmo.io/welcome/signup?ref=';

export function ReferralsPage() {
  const { navigateTo, showToast, user } = useApp();
  const [referralLink, setReferralLink] = useState(DEFAULT_REFERRAL_LINK);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeSubs: 0,
    totalEarned: 0,
    balance: 0,
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankAccountNumber: '',
    bankCode: '',
    bankName: '',
    accountName: '',
  });

  const MINIMUM_WITHDRAWAL = 2000;

  // Generate referral link based on authenticated user
  useEffect(() => {
    if (user.id) {
      // Use user's ID as referral code
      const userReferralLink = `${DEFAULT_REFERRAL_LINK}${user.id}`;
      setReferralLink(userReferralLink);
    }
  }, [user.id]);

  // Load real referral data from Firestore
  useEffect(() => {
    async function loadReferralData() {
      if (!user.id) return;

      try {
        const { firestore } = initializeFirebase();
        if (!firestore) return;

        setLoading(true);

        // Get user's referral data
        const userRef = doc(firestore, 'users', user.id);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStats({
            totalReferrals: userData.totalReferrals || 0,
            activeSubs: userData.activeReferrals || 0,
            totalEarned: userData.totalEarned || 0,
            balance: userData.referralBalance || 0,
          });
          
          // Load bank details
          setBankDetails({
            bankAccountNumber: userData.bankAccountNumber || '',
            bankCode: userData.bankCode || '',
            bankName: userData.bankName || '',
            accountName: userData.accountName || '',
          });
        }

        // Load referral transactions for history
        const referralsQuery = query(
          collection(firestore, 'referrals'),
          where('referrerId', '==', user.id),
          orderBy('createdAt', 'desc')
        );
        const referralsSnapshot = await getDocs(referralsQuery);

        // Calculate stats from referrals
        const totalReferrals = referralsSnapshot.size;
        const activeSubs = referralsSnapshot.docs.filter(doc => {
          const data = doc.data();
          return data.status === 'active' || data.hasSubscribed === true;
        }).length;
        const totalEarned = referralsSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.commissionEarned || 0);
        }, 0);

        // Load recent transactions
        const transactionsQuery = query(
          collection(firestore, 'referral_transactions'),
          where('referrerId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsList = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStats(prev => ({
          ...prev,
          totalReferrals,
          activeSubs,
          totalEarned,
        }));
        setTransactions(transactionsList);
      } catch (error) {
        console.error('Error loading referral data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadReferralData();
  }, [user.id]);

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() =>
      showToast('📋 Referral link copied! Share it with your friends!')
    );
  }

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < MINIMUM_WITHDRAWAL) {
      showToast(`❌ Minimum withdrawal is ₦${MINIMUM_WITHDRAWAL.toLocaleString()}`);
      return;
    }

    if (amount > stats.balance) {
      showToast('❌ Insufficient balance');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await fetch('/api/referrals/initiate-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`✅ Withdrawal request of ₦${amount.toLocaleString()} submitted!`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        // Reload data to show updated balance
        window.location.reload();
      } else {
        if (data.needsBankDetails) {
          showToast('❌ Please update your bank details in Settings first');
        } else {
          showToast(`❌ ${data.error}`);
        }
      }
    } catch (error) {
      showToast('❌ Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Referral Programme</h2>
          <p className={styles.pageDesc}>Share Busmo and earn 20% recurring commission.</p>
        </div>
        <Button variant="subtle" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h2 className={styles.heroTitle}>Earn While You Share 🎁</h2>
          <p className={styles.heroDesc}>
            Every time someone signs up with your link and subscribes, you earn 20% of their subscription — month after month.
          </p>
          <Button
            variant="primary"
            size="lg"
            style={{ background: '#fff', color: 'var(--purple)', border: 'none', marginTop: 14 }}
            onClick={copyLink}
          >
            Share Your Link Now
          </Button>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroBalanceLabel}>Your Balance</div>
          <div className={styles.heroBalance}>₦{stats.balance.toLocaleString()}</div>
          <div className={styles.heroMinWithdraw}>Withdraw when ≥₦{MINIMUM_WITHDRAWAL.toLocaleString()}</div>
          <Button
            variant="primary"
            size="sm"
            disabled={stats.balance < MINIMUM_WITHDRAWAL}
            onClick={() => setShowWithdrawModal(true)}
            style={{ marginTop: 10, background: stats.balance >= MINIMUM_WITHDRAWAL ? '#fff' : '#ccc', color: 'var(--purple)' }}
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{stats.totalReferrals}</div>
          <div className={styles.statLabel}>Total Referrals</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{stats.activeSubs}</div>
          <div className={styles.statLabel}>Active Subs</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>₦{stats.totalEarned.toLocaleString()}</div>
          <div className={styles.statLabel}>Total Earned</div>
        </div>
      </div>

      {/* Referral link box */}
      <Card>
        <div className={styles.linkLabel}>Your unique referral link</div>
        <div className={styles.linkRow}>
          <input
            className={styles.linkInput}
            value={referralLink}
            readOnly
            aria-label="Referral link"
          />
          <Button variant="primary" onClick={copyLink}>Copy</Button>
        </div>
        <div className={styles.shareButtons}>
          {SHARE_BUTTONS.map(btn => (
            <button
              key={btn.label}
              className={styles.shareBtn}
              onClick={() => showToast(`Opening ${btn.label}…`)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
                <path d={btn.icon}/>
              </svg>
              {btn.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Transaction History */}
      <Card style={{ marginTop: 12 }}>
        <CardHeader>
          <CardIcon bg="var(--amber-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </CardIcon>
          Transaction History
        </CardHeader>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8888A0' }}>
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="58" />
                <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(124,58,237,.12)" strokeWidth="1.5" strokeDasharray="6,4" />
                <circle cx="60" cy="24" r="8" fill="rgba(124,58,237,.1)" stroke="rgba(124,58,237,.25)" strokeWidth="1.5" strokeDasharray="2,2" />
                <circle cx="28" cy="72" r="8" fill="rgba(124,58,237,.08)" stroke="rgba(124,58,237,.18)" strokeWidth="1.5" strokeDasharray="2,2" />
                <circle cx="92" cy="72" r="8" fill="rgba(124,58,237,.08)" stroke="rgba(124,58,237,.18)" strokeWidth="1.5" strokeDasharray="2,2" />
                <line x1="54" y1="30" x2="34" y2="64" stroke="rgba(124,58,237,.2)" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="66" y1="30" x2="86" y2="64" stroke="rgba(124,58,237,.2)" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="36" y1="72" x2="84" y2="72" stroke="rgba(124,58,237,.15)" strokeWidth="1.5" strokeDasharray="4,4" />
                <text x="60" y="27" fontSize="7" fill="rgba(124,58,237,.4)" textAnchor="middle">?</text>
                <text x="28" y="75" fontSize="7" fill="rgba(124,58,237,.3)" textAnchor="middle">?</text>
                <text x="92" y="75" fontSize="7" fill="rgba(124,58,237,.3)" textAnchor="middle">?</text>
                <circle cx="60" cy="52" r="11" fill="#F5C9A0" />
                <path d="M49 49 C49 42 71 42 71 49 L71 46 C71 39 49 39 49 46 Z" fill="#2C1A0E" />
                <circle cx="55" cy="51" r="2.5" fill="#1A2B3C" />
                <circle cx="65" cy="51" r="2.5" fill="#1A2B3C" />
                <path d="M55 57 Q60 61 65 57" stroke="#CC7A3A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <rect x="52" y="90" width="16" height="14" rx="2" fill="rgba(124,58,237,.15)" stroke="#7C3AED" strokeWidth="1.2" />
                <line x1="60" y1="90" x2="60" y2="104" stroke="#7C3AED" strokeWidth="1.2" />
                <path d="M52 94 L68 94" stroke="#7C3AED" strokeWidth="1.2" />
                <path d="M60 88 Q55 84 52 86 Q50 90 55 90 Q58 90 60 88 Z" fill="#7C3AED" opacity=".7" />
                <path d="M60 88 Q65 84 68 86 Q70 90 65 90 Q62 90 60 88 Z" fill="#7C3AED" opacity=".5" />
                <path d="M71 56 Q70 70 68 88" stroke="#F5C9A0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M49 56 Q50 66 52 88" stroke="#F5C9A0" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </svg>
              <div style={{ marginTop: 10 }}>No transactions yet. Share your link to get started! 🚀</div>
            </div>
          </div>
        ) : (
          <div className={styles.transactionList}>
            {transactions.map((tx) => (
              <div key={tx.id} className={styles.transactionItem}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0A0A0F' }}>
                    {tx.type === 'commission' ? '💰 Commission' : '💸 Withdrawal'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8888A0', marginTop: 2 }}>
                    {tx.plan && `${tx.plan} plan`}
                    {tx.type === 'withdrawal' && ' - Pending'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: tx.type === 'commission' ? '#1DB954' : '#D97706' }}>
                    {tx.type === 'commission' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#8888A0', marginTop: 2 }}>
                    {tx.createdAt?.toDate?.()?.toLocaleDateString?.() || 'Recent'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
        }} onClick={() => setShowWithdrawModal(false)}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 24, maxWidth: 400, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: '#0A0A0F' }}>Withdraw Funds</h3>
            <p style={{ fontSize: 13, color: '#8888A0', marginBottom: 14 }}>
              Minimum withdrawal: ₦{MINIMUM_WITHDRAWAL.toLocaleString()}
            </p>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#555568', display: 'block', marginBottom: 6 }}>
                Amount (₦)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Minimum ${MINIMUM_WITHDRAWAL}`}
                min={MINIMUM_WITHDRAWAL}
                max={stats.balance}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #E8E8F0',
                  fontSize: 14, fontFamily: "'DM Sans', sans-serif"
                }}
              />
              <p style={{ fontSize: 11, color: '#8888A0', marginTop: 4 }}>
                Available: ₦{stats.balance.toLocaleString()}
              </p>
            </div>

            {!bankDetails.bankAccountNumber && (
              <div style={{
                padding: 10, background: '#FEF3C7', borderRadius: 8, marginBottom: 12,
                fontSize: 12, color: '#D97706'
              }}>
                ⚠️ Please add your bank details in Settings before withdrawing
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="subtle"
                onClick={() => setShowWithdrawModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleWithdraw}
                disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) < MINIMUM_WITHDRAWAL}
                style={{ flex: 1 }}
              >
                {withdrawing ? 'Processing...' : 'Withdraw'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SHARE_BUTTONS = [
  { label: 'WhatsApp', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { label: 'Email',    icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7-10-7' },
  { label: 'SMS',      icon: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .09h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z' },
];
