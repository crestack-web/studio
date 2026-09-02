'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs } from '@/lib/supabase-client-data';
import { evaluateCanIBuy } from '@/lib/mo-proactive-nudges';
import { ShoppingBag, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import styles from './CanIBuyThisPage.module.css';

export default function CanIBuyThisPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId: branchBiz } = useBranch();

  const [cashBalance, setCashBalance] = useState(0);
  const [supplierOwed, setSupplierOwed] = useState(0);
  const [monthlyBurn, setMonthlyBurn] = useState(0);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [what, setWhat] = useState('');
  const [useCredit, setUseCredit] = useState(false);
  const [moText, setMoText] = useState('');
  const [moLoading, setMoLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const businessId = branchBiz || user?.businessId;
        if (!businessId) {
          setLoading(false);
          return;
        }
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const [accounts, expenses, credits, suppliers] = await Promise.all([
          fetchDocs(`businesses/${businessId}/bankAccounts`).catch(() => []),
          fetchDocs(`businesses/${businessId}/expenses`, { limit: 120 }).catch(() => []),
          fetchDocs(`businesses/${businessId}/supplierCredit`, { limit: 200 }).catch(() => []),
          fetchDocs(`businesses/${businessId}/suppliers`).catch(() => []),
        ]);

        const cash = (accounts as any[]).reduce(
          (s, a) => s + (Number(a.currentBalance) || 0),
          0
        );

        const burn = (expenses as any[])
          .filter((e) => new Date(e.createdAt || e.created_at || e.date || 0) >= since)
          .reduce((s, e) => s + (Number(e.amount) || 0), 0);

        let owed = 0;
        for (const c of credits as any[]) {
          const bal =
            Number(c.balance ?? Math.max(0, Number(c.amount || 0) - Number(c.paid || 0))) || 0;
          if (bal > 0 && String(c.status || 'open').toLowerCase() !== 'paid') owed += bal;
        }
        if (owed === 0) {
          for (const s of suppliers as any[]) owed += Number(s.currentBalance) || 0;
        }

        if (!cancelled) {
          setCashBalance(cash);
          setMonthlyBurn(burn);
          setSupplierOwed(owed);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [branchBiz, user?.businessId]);

  const purchaseAmount = parseFloat(amount) || 0;

  const decision = useMemo(
    () =>
      evaluateCanIBuy({
        cashBalance,
        purchaseAmount,
        monthlyBurnEstimate: monthlyBurn,
        supplierOwed,
        useCredit,
      }),
    [cashBalance, purchaseAmount, monthlyBurn, supplierOwed, useCredit]
  );

  const askMo = async () => {
    if (!user?.id || purchaseAmount <= 0) {
      showToast('Enter an amount first');
      return;
    }
    setMoLoading(true);
    setMoText('');
    try {
      const message = `You are MO. Owner asks: Can I buy this?
Item: ${what || 'stock / supplies'}
Amount: ${purchaseAmount}
Pay with: ${useCredit ? 'supplier credit' : 'cash'}
Cash on hand: ${cashBalance}
Supplier already owed: ${supplierOwed}
Approx 30-day expenses: ${monthlyBurn}
System verdict: ${decision.verdict} — ${decision.title}. ${decision.body}

Give 3 short plain sentences. No markdown, no asterisks. Say yes/caution/no clearly and one next step.`;

      const res = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userId: user.id,
          businessId: branchBiz || user.businessId || '',
          conversationHistory: [],
          plan: (user as any)?.plan || 'starter',
          context: { page: 'can-i-buy', decision },
        }),
      });
      if (!res.ok) throw new Error('MO unavailable');
      const data = await res.json();
      const text = (data.answer || data.response || '')
        .replace(/\*{1,3}/g, '')
        .replace(/_{1,2}/g, '')
        .trim();
      setMoText(text || decision.body);
    } catch {
      setMoText(decision.body);
      showToast('MO offline — showing local decision');
    } finally {
      setMoLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.eyebrow}>Owner decision</div>
        <h1 className={styles.title}>
          <ShoppingBag size={22} /> Can I buy this?
        </h1>
        <p className={styles.sub}>
          Check cash, runway, and supplier credit before you commit — built for owners away from the
          till.
        </p>
      </header>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span>Spendable cash</span>
          <strong>{loading ? '…' : formatMoney(cashBalance)}</strong>
        </div>
        <div className={styles.stat}>
          <span>Supplier owed</span>
          <strong>{loading ? '…' : formatMoney(supplierOwed)}</strong>
        </div>
        <div className={styles.stat}>
          <span>~30d expenses</span>
          <strong>{loading ? '…' : formatMoney(monthlyBurn)}</strong>
        </div>
      </div>

      <section className={styles.card}>
        <label className={styles.field}>
          <span>What are you buying? (optional)</span>
          <input
            value={what}
            onChange={(e) => setWhat(e.target.value)}
            placeholder="e.g. Chicken, drinks, packaging"
          />
        </label>
        <label className={styles.field}>
          <span>Amount</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </label>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={useCredit}
            onChange={(e) => setUseCredit(e.target.checked)}
          />
          Buy on supplier credit (don’t take cash out today)
        </label>

        <div className={`${styles.verdict} ${styles[`v_${decision.verdict}`]}`}>
          <div className={styles.verdictTitle}>{decision.title}</div>
          <p>{decision.body}</p>
          {purchaseAmount > 0 && (
            <div className={styles.verdictMeta}>
              <span>Cash after: {formatMoney(decision.cashAfter)}</span>
              {decision.runwayAfterDays != null && (
                <span>Runway after: ~{decision.runwayAfterDays} days</span>
              )}
            </div>
          )}
          {decision.tips.length > 0 && (
            <ul className={styles.tips}>
              {decision.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.moBtn} onClick={askMo} disabled={moLoading}>
            {moLoading ? <Loader2 size={16} className={styles.spin} /> : <Sparkles size={16} />}
            Ask MO
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => navigateTo('cashflow' as any)}
          >
            Record purchase <ArrowRight size={14} />
          </button>
        </div>

        {moText && (
          <div className={styles.moBox}>
            <div className={styles.moLabel}>MO</div>
            <p>{moText}</p>
          </div>
        )}
      </section>
    </div>
  );
}
