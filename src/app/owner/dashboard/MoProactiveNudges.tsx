'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs } from '@/lib/supabase-client-data';
import { buildProactiveNudges, type MoNudge } from '@/lib/mo-proactive-nudges';
import { getCategoryDepth, isLikelyDeadStock } from '@/lib/categoryDepth';
import { getSupabase } from '@/lib/supabase';
import { Sparkles, ChevronRight } from 'lucide-react';
import styles from './MoProactiveNudges.module.css';

interface Props {
  /** Optional overrides from HomePage so we don’t double-fetch everything */
  seed?: {
    cashBalance?: number;
    salesToday?: number;
    expensesToday?: number;
    cashRunwayDays?: number;
    lowStockCount?: number;
    pendingCollections?: number;
  };
}

export function MoProactiveNudges({ seed }: Props) {
  const { navigateTo, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId: branchBiz } = useBranch();
  const [nudges, setNudges] = useState<MoNudge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const businessId = branchBiz || user?.businessId;
        if (!businessId) {
          setLoading(false);
          return;
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let category = '';
        try {
          const { data: ud } = await getSupabase()
            .from('users')
            .select('category, business_type, metadata')
            .eq('id', user?.id || '')
            .maybeSingle();
          category =
            (ud as any)?.category ||
            (ud as any)?.business_type ||
            (ud as any)?.metadata?.category ||
            '';
        } catch { /* ignore */ }
        const depth = getCategoryDepth(category);
        const TARGET = depth.targetMarginPct;

        const [accounts, expenses, products, suppliers, credits, sales] = await Promise.all([
          fetchDocs(`businesses/${businessId}/bankAccounts`).catch(() => []),
          fetchDocs(`businesses/${businessId}/expenses`, { limit: 80 }).catch(() => []),
          fetchDocs(`businesses/${businessId}/products`, { limit: 100 }).catch(() => []),
          fetchDocs(`businesses/${businessId}/suppliers`).catch(() => []),
          fetchDocs(`businesses/${businessId}/supplierCredit`, { limit: 200 }).catch(() => []),
          fetchDocs(`businesses/${businessId}/sales`, {
            orderBy: { field: 'created_at', ascending: false },
            limit: 80,
          }).catch(() => []),
        ]);

        const cashBalance =
          seed?.cashBalance ??
          (accounts as any[]).reduce((s, a) => s + (Number(a.currentBalance) || 0), 0);

        const expensesToday =
          seed?.expensesToday ??
          (expenses as any[])
            .filter((e) => {
              const d = new Date(e.createdAt || e.created_at || e.date || 0);
              return d >= startOfDay;
            })
            .reduce((s, e) => s + (Number(e.amount) || 0), 0);

        const salesToday =
          seed?.salesToday ??
          (sales as any[])
            .filter((e) => {
              const d = new Date(e.createdAt || e.created_at || e.date || 0);
              return d >= startOfDay;
            })
            .reduce(
              (s, e) => s + (Number(e.totalRevenue ?? e.total_amount ?? e.total ?? 0) || 0),
              0
            );

        let supplierOwed = 0;
        for (const c of credits as any[]) {
          const bal =
            Number(c.balance ?? Math.max(0, Number(c.amount || 0) - Number(c.paid || 0))) || 0;
          if (bal > 0 && String(c.status || 'open').toLowerCase() !== 'paid') {
            supplierOwed += bal;
          }
        }
        if (supplierOwed === 0) {
          for (const s of suppliers as any[]) {
            supplierOwed += Number(s.currentBalance) || 0;
          }
        }

        const thin: string[] = [];
        let deadStockCount = 0;
        for (const p of products as any[]) {
          const type = String(p.productType || p.metadata?.productType || '').toLowerCase();
          if (type === 'ingredient') continue;
          const cost = Number(p.cost ?? p.costPrice ?? 0) || 0;
          const price = Number(p.price ?? p.sellingPrice ?? 0) || 0;
          if (price > 0) {
            const margin = ((price - cost) / price) * 100;
            if (margin < TARGET * depth.thinMarginFactor) thin.push(p.name || 'Item');
          }
          if (depth.model === 'retail' || depth.model === 'wholesale' || depth.model === 'pharmacy') {
            if (
              isLikelyDeadStock({
                stock: Number(p.stock ?? p.stockLevel ?? 0),
                unitsSold30d: Number(p.unitsSold30d ?? p.metadata?.unitsSold30d ?? 0),
                reorderLevel: Number(p.reorderLevel ?? p.lowStockThreshold ?? 5),
              })
            ) {
              deadStockCount += 1;
            }
          }
        }

        const lowStockCount =
          seed?.lowStockCount ??
          (products as any[]).filter((p) => {
            const stock = Number(p.stock ?? p.stockLevel ?? 0) || 0;
            const reorder = Number(p.reorderLevel ?? p.lowStockThreshold ?? 5) || 5;
            return stock <= reorder;
          }).length;

        const cashRunwayDays = seed?.cashRunwayDays ?? 30;
        const pendingCollections = seed?.pendingCollections ?? 0;

        if (cancelled) return;
        setNudges(
          buildProactiveNudges({
            cashBalance,
            salesToday,
            expensesToday,
            cashRunwayDays,
            lowStockCount,
            pendingCollections,
            supplierOwed,
            thinMarginCount: thin.length,
            thinMarginNames: thin,
            formatMoney,
            targetMarginPct: TARGET,
            deadStockCount,
            categoryNudgeCopy: depth.nudgeCopy,
          })
        );
      } catch (e) {
        console.error('[MoProactiveNudges]', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    branchBiz,
    user?.businessId,
    seed?.cashBalance,
    seed?.salesToday,
    seed?.expensesToday,
    seed?.cashRunwayDays,
    seed?.lowStockCount,
    seed?.pendingCollections,
    formatMoney,
  ]);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.head}>
          <Sparkles size={16} />
          <span>MO nudges</span>
        </div>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (!nudges.length) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <Sparkles size={16} />
        <div>
          <strong>MO nudges</strong>
          <span className={styles.sub}>Proactive — tuned to your business type</span>
        </div>
      </div>
      <ul className={styles.list}>
        {nudges.map((n) => (
          <li key={n.id} className={`${styles.item} ${styles[`sev_${n.severity}`]}`}>
            <div className={styles.itemBody}>
              <div className={styles.itemTitle}>{n.title}</div>
              <div className={styles.itemText}>{n.body}</div>
            </div>
            <button
              type="button"
              className={styles.action}
              onClick={() => navigateTo(n.href as any)}
            >
              {n.actionLabel}
              <ChevronRight size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
