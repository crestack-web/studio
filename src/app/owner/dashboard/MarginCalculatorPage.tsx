'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { getSupabase } from '@/lib/supabase';
import { fetchDocs } from '@/lib/supabase-client-data';
import { Calculator, Target, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import styles from './MarginCalculatorPage.module.css';

type BizModel =
  | 'restaurant'
  | 'retail'
  | 'wholesale'
  | 'services'
  | 'manufacturing'
  | 'general';

const MODEL_HINTS: Record<
  BizModel,
  { label: string; targetMargin: number; tips: string[]; costLabel: string; priceLabel: string }
> = {
  restaurant: {
    label: 'Restaurant / Cafe',
    targetMargin: 65,
    costLabel: 'Plate / meal cost',
    priceLabel: 'Menu selling price',
    tips: [
      'Food cost is often 28–35% of selling price (≈65–72% gross margin).',
      'Use recipes for accurate plate cost, or set cost manually when you already know it.',
      'Raise price or trim portion cost if margin falls under ~55%.',
    ],
  },
  retail: {
    label: 'Retail / Shop',
    targetMargin: 30,
    costLabel: 'Product cost (COGS)',
    priceLabel: 'Shelf / selling price',
    tips: [
      'Many FMCG items run 15–35% margin; specialty goods can be higher.',
      'Include wastage and transport in cost when possible.',
      'Watch slow movers — low margin + low turnover hurts cash.',
    ],
  },
  wholesale: {
    label: 'Wholesale / Distributor',
    targetMargin: 12,
    costLabel: 'Landed cost',
    priceLabel: 'Wholesale price',
    tips: [
      'Wholesale margins are thinner (8–15%); volume and payment terms matter.',
      'Protect cash with clear credit limits on customers.',
      'Revisit price when supplier costs move.',
    ],
  },
  services: {
    label: 'Services',
    targetMargin: 50,
    costLabel: 'Delivery cost (time, materials, tools)',
    priceLabel: 'Service fee',
    tips: [
      'Price for expertise and time, not only materials.',
      'Build in buffer for admin, travel, and rework.',
      'Package tiers (basic / standard / premium) improve average margin.',
    ],
  },
  manufacturing: {
    label: 'Manufacturing',
    targetMargin: 25,
    costLabel: 'Unit production cost',
    priceLabel: 'Factory / trade price',
    tips: [
      'Include materials, labour, and overhead in unit cost.',
      'Margin targets often sit 20–35% depending on competition.',
      'Scrap and downtime silently erode margin — track them.',
    ],
  },
  general: {
    label: 'General business',
    targetMargin: 25,
    costLabel: 'Cost to deliver',
    priceLabel: 'Selling price',
    tips: [
      'Aim for a healthy gap between cost and price so cash covers expenses.',
      'Use this tool before adding products or changing price lists.',
      'Review margins monthly as costs change.',
    ],
  },
};

function detectModel(category: string): BizModel {
  const c = (category || '').toLowerCase();
  if (/restaurant|cafe|food|bar|kitchen/.test(c)) return 'restaurant';
  if (/wholesale|distributor|bulk/.test(c)) return 'wholesale';
  if (/retail|shop|store|supermarket|grocery|pharmacy/.test(c)) return 'retail';
  if (/service|consult|salon|education|agency/.test(c)) return 'services';
  if (/manufactur|factory|production/.test(c)) return 'manufacturing';
  return 'general';
}

export default function MarginCalculatorPage() {
  const { user, showToast } = useApp();
  const { formatMoney } = useCurrency();

  const [model, setModel] = useState<BizModel>('general');
  const [cost, setCost] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [targetMargin, setTargetMargin] = useState<string>('25');
  const [mode, setMode] = useState<'from_cost_price' | 'from_cost_margin' | 'from_price_margin'>(
    'from_cost_price'
  );
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; cost: number; price: number; productType?: string }>
  >([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let category = '';
        let businessId = user?.businessId || '';
        if (user?.id) {
          const { data } = await getSupabase()
            .from('users')
            .select('business_id, businessId, category, business_type, metadata')
            .eq('id', user.id)
            .maybeSingle();
          businessId =
            businessId ||
            (data as any)?.business_id ||
            (data as any)?.businessId ||
            '';
          category =
            (data as any)?.category ||
            (data as any)?.business_type ||
            (data as any)?.metadata?.category ||
            '';
        }
        if (!cancelled) {
          const m = detectModel(category);
          setModel(m);
          setTargetMargin(String(MODEL_HINTS[m].targetMargin));
        }
        if (businessId && !cancelled) {
          setLoadingProducts(true);
          const docs = await fetchDocs(`businesses/${businessId}/products`, { limit: 80 });
          const list = (docs as any[])
            .filter((p) => String(p.productType || p.metadata?.productType || '') !== 'ingredient')
            .map((p) => ({
              id: p.id,
              name: p.name || 'Item',
              cost: Number(p.cost ?? p.costPrice ?? 0) || 0,
              price: Number(p.price ?? p.sellingPrice ?? 0) || 0,
              productType: p.productType || p.metadata?.productType,
            }))
            .filter((p) => p.price > 0 || p.cost > 0)
            .slice(0, 40);
          if (!cancelled) setProducts(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.businessId]);

  const hints = MODEL_HINTS[model];

  const result = useMemo(() => {
    const c = parseFloat(cost) || 0;
    const p = parseFloat(price) || 0;
    const tm = Math.min(95, Math.max(0, parseFloat(targetMargin) || 0));

    if (mode === 'from_cost_margin') {
      // price from cost + target margin on selling price: margin = (p-c)/p => p = c/(1-m)
      if (tm >= 100 || c <= 0) return null;
      const suggestedPrice = c / (1 - tm / 100);
      const profit = suggestedPrice - c;
      return {
        cost: c,
        price: suggestedPrice,
        profit,
        margin: tm,
        markup: c > 0 ? (profit / c) * 100 : 0,
        suggestedPrice,
      };
    }
    if (mode === 'from_price_margin') {
      // max cost for target margin: c = p * (1 - m)
      if (p <= 0) return null;
      const maxCost = p * (1 - tm / 100);
      const profit = p - maxCost;
      return {
        cost: maxCost,
        price: p,
        profit,
        margin: tm,
        markup: maxCost > 0 ? (profit / maxCost) * 100 : 0,
        maxCost,
      };
    }
    // from cost + price
    if (c < 0 || p <= 0) return null;
    const profit = p - c;
    const margin = (profit / p) * 100;
    const markup = c > 0 ? (profit / c) * 100 : 0;
    return { cost: c, price: p, profit, margin, markup };
  }, [cost, price, targetMargin, mode]);

  const health =
    result == null
      ? null
      : result.margin >= hints.targetMargin
        ? 'healthy'
        : result.margin >= hints.targetMargin * 0.7
          ? 'ok'
          : 'low';

  const applyProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setCost(String(p.cost));
    setPrice(String(p.price));
    setMode('from_cost_price');
    showToast(`Loaded ${p.name}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Pricing intelligence</div>
          <h1 className={styles.title}>
            <Calculator size={22} /> Margin calculator
          </h1>
          <p className={styles.sub}>
            Set healthy prices for what you sell — tuned for {hints.label.toLowerCase()}, and works for
            every Busmo business model.
          </p>
        </div>
      </header>

      <div className={styles.modelRow}>
        {(Object.keys(MODEL_HINTS) as BizModel[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`${styles.modelChip} ${model === m ? styles.modelChipActive : ''}`}
            onClick={() => {
              setModel(m);
              setTargetMargin(String(MODEL_HINTS[m].targetMargin));
            }}
          >
            {MODEL_HINTS[m].label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Calculate</h2>
          <div className={styles.modeTabs}>
            <button
              type="button"
              className={mode === 'from_cost_price' ? styles.tabActive : styles.tab}
              onClick={() => setMode('from_cost_price')}
            >
              Cost + price
            </button>
            <button
              type="button"
              className={mode === 'from_cost_margin' ? styles.tabActive : styles.tab}
              onClick={() => setMode('from_cost_margin')}
            >
              Price from margin
            </button>
            <button
              type="button"
              className={mode === 'from_price_margin' ? styles.tabActive : styles.tab}
              onClick={() => setMode('from_price_margin')}
            >
              Max cost from price
            </button>
          </div>

          {(mode === 'from_cost_price' || mode === 'from_cost_margin') && (
            <label className={styles.field}>
              <span>{hints.costLabel}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
              />
            </label>
          )}

          {(mode === 'from_cost_price' || mode === 'from_price_margin') && (
            <label className={styles.field}>
              <span>{hints.priceLabel}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </label>
          )}

          {(mode === 'from_cost_margin' || mode === 'from_price_margin') && (
            <label className={styles.field}>
              <span>Target margin %</span>
              <input
                type="number"
                min={0}
                max={95}
                step="0.1"
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value)}
              />
            </label>
          )}

          {result ? (
            <div className={`${styles.result} ${styles[`health_${health}`]}`}>
              <div className={styles.resultRow}>
                <span>Cost</span>
                <strong>{formatMoney(result.cost)}</strong>
              </div>
              <div className={styles.resultRow}>
                <span>Selling price</span>
                <strong>{formatMoney(result.price)}</strong>
              </div>
              <div className={styles.resultRow}>
                <span>Profit / unit</span>
                <strong>{formatMoney(result.profit)}</strong>
              </div>
              <div className={styles.resultRow}>
                <span>
                  <TrendingUp size={14} /> Gross margin
                </span>
                <strong>{result.margin.toFixed(1)}%</strong>
              </div>
              <div className={styles.resultRow}>
                <span>Markup on cost</span>
                <strong>{result.markup.toFixed(1)}%</strong>
              </div>
              {health === 'healthy' && (
                <p className={styles.healthMsg}>On track for a healthy {hints.label.toLowerCase()} margin.</p>
              )}
              {health === 'ok' && (
                <p className={styles.healthMsg}>
                  Acceptable, but below the ~{hints.targetMargin}% guide for {hints.label.toLowerCase()}.
                </p>
              )}
              {health === 'low' && (
                <p className={styles.healthMsg}>
                  Margin is thin — raise price or lower cost before volume grows losses.
                </p>
              )}
            </div>
          ) : (
            <p className={styles.placeholder}>Enter values above to see margin, profit, and markup.</p>
          )}
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>
            <Target size={16} /> Target for {hints.label}
          </h2>
          <p className={styles.targetBig}>~{hints.targetMargin}% gross margin</p>
          <ul className={styles.tips}>
            {hints.tips.map((t) => (
              <li key={t}>
                <Lightbulb size={14} /> {t}
              </li>
            ))}
          </ul>

          <h3 className={styles.subTitle}>
            <RefreshCw size={14} /> Your catalogue
          </h3>
          {loadingProducts ? (
            <p className={styles.placeholder}>Loading products…</p>
          ) : products.length === 0 ? (
            <p className={styles.placeholder}>
              No products with cost/price yet. Add items in Inventory or Menu, then return here.
            </p>
          ) : (
            <div className={styles.productList}>
              {products.map((p) => {
                const m = p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.productRow}
                    onClick={() => applyProduct(p.id)}
                  >
                    <span className={styles.productName}>{p.name}</span>
                    <span className={styles.productMeta}>
                      {formatMoney(p.cost)} → {formatMoney(p.price)} · {m.toFixed(0)}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
