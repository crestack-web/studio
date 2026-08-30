'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { getSupabase } from '@/lib/supabase';
import styles from './WalletPage.module.css';

type Tx = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  purpose: string | null;
  reference: string | null;
  description: string | null;
  createdAt: string;
};

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

export default function WalletPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const businessId = user?.businessId || '';

  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('5000');
  const [funding, setFunding] = useState(false);

  const authHeaders = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const load = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/wallet?businessId=${encodeURIComponent(businessId)}`, {
        headers,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load wallet');
      setBalance(Number(json.balance) || 0);
      setTxs(Array.isArray(json.transactions) ? json.transactions : []);
    } catch (e: any) {
      showToast?.(e?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [businessId, authHeaders, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Return from Paystack
  useEffect(() => {
    if (typeof window === 'undefined' || !businessId) return;
    const params = new URLSearchParams(window.location.search);
    const ref =
      params.get('reference') ||
      params.get('trxref') ||
      (params.get('walletFunded') ? sessionStorage.getItem('busmo_wallet_ref') : null);
    if (!ref) return;

    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch('/api/wallet/verify', {
          method: 'POST',
          headers,
          body: JSON.stringify({ businessId, reference: ref }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          showToast?.('Wallet funded successfully');
          sessionStorage.removeItem('busmo_wallet_ref');
          await load();
        }
      } catch {
        /* ignore */
      }
    })();
  }, [businessId, authHeaders, load, showToast]);

  const fund = async () => {
    const n = Number(amount);
    if (!businessId) return;
    if (!Number.isFinite(n) || n < 100) {
      showToast?.('Enter at least ₦100');
      return;
    }
    setFunding(true);
    try {
      const headers = await authHeaders();
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          businessId,
          amount: n,
          callbackUrl: `${window.location.origin}/owner/dashboard?walletFunded=1`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not start funding');
      if (json.reference) sessionStorage.setItem('busmo_wallet_ref', json.reference);
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
        return;
      }
      throw new Error('No payment URL returned');
    } catch (e: any) {
      showToast?.(e?.message || 'Funding failed');
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Wallet</h1>
          <p className={styles.sub}>
            Fund once and spend across Busmo — MO credits, payroll, and other paid features.
          </p>
        </div>
      </header>

      <section className={styles.balanceCard}>
        <div className={styles.balanceInfo}>
          <div className={styles.balanceLabel}>Available balance</div>
          <div className={styles.balanceValue}>
            {loading ? '…' : formatMoney(balance)}
          </div>
          <p className={styles.balanceHint}>
            Money stays on your business until you use it in Busmo.
          </p>
        </div>
        <div className={styles.balanceBadge} aria-hidden>
          Busmo Wallet
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.fundCard}>
          <h2 className={styles.sectionTitle}>Add money</h2>
          <div className={styles.quickRow}>
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                className={`${styles.quickBtn} ${String(a) === amount ? styles.quickBtnActive : ''}`}
                onClick={() => setAmount(String(a))}
              >
                {formatMoney(a)}
              </button>
            ))}
          </div>
          <label className={styles.label}>
            Amount (NGN)
            <input
              className={styles.input}
              type="number"
              min={100}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={funding || loading}
            onClick={fund}
          >
            {funding ? 'Redirecting…' : 'Fund wallet'}
          </button>
        </section>

        <section className={styles.usesCard}>
          <h2 className={styles.sectionTitle}>What you can pay for</h2>
          <ul className={styles.usesList}>
            <li>MO Sales & Ask MO credit packs</li>
            <li>Staff payroll payouts</li>
            <li>Other Busmo paid features as they roll out</li>
          </ul>
          <div className={styles.linkRow}>
            <button type="button" className={styles.linkBtn} onClick={() => navigateTo?.('mo-sales')}>
              MO Sales
            </button>
            <button type="button" className={styles.linkBtn} onClick={() => navigateTo?.('payroll')}>
              Payroll
            </button>
          </div>
        </section>
      </div>

      <section className={styles.txCard}>
        <h2 className={styles.sectionTitle}>Recent activity</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : txs.length === 0 ? (
          <p className={styles.muted}>No wallet activity yet. Fund your wallet to get started.</p>
        ) : (
          <ul className={styles.txList}>
            {txs.map((tx) => (
              <li key={tx.id} className={styles.txItem}>
                <div>
                  <div className={styles.txTitle}>
                    {tx.description || tx.purpose || tx.type}
                  </div>
                  <div className={styles.txMeta}>
                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}
                    {tx.reference ? ` · ${tx.reference}` : ''}
                  </div>
                </div>
                <div
                  className={
                    tx.type === 'credit' ? styles.txCredit : styles.txDebit
                  }
                >
                  {tx.type === 'credit' ? '+' : '−'}
                  {formatMoney(tx.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
