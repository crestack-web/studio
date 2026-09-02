'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { getSupabase } from '@/lib/supabase';
import { fetchDocs } from '@/lib/supabase-client-data';
import {
  Calculator,
  Target,
  TrendingUp,
  Lightbulb,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
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

type ProductRow = {
  id: string;
  name: string;
  cost: number;
  price: number;
  productType?: string;
  margin: number;
};

function marginOf(cost: number, price: number) {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

/** Strip markdown noise (** *** __ `) and split into readable lines for the coach panel. */
function formatMoAdvice(raw: string): { kind: 'p' | 'li'; text: string }[] {
  if (!raw) return [];
  let s = raw
    .replace(/\r\n/g, '\n')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*{1,3}/g, '')
    .replace(/_{1,2}/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[\s>*-]+/gm, (m) => (m.includes('-') || m.includes('*') ? '- ' : ''))
    .trim();

  const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: { kind: 'p' | 'li'; text: string }[] = [];
  for (const line of lines) {
    if (/^[-•]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      out.push({ kind: 'li', text: line.replace(/^[-•]\s+/, '').replace(/^\d+[.)]\s+/, '') });
    } else {
      out.push({ kind: 'p', text: line });
    }
  }
  return out.length ? out : [{ kind: 'p', text: s.replace(/\s+/g, ' ') }];
}


export default function MarginCalculatorPage() {
  const { user, showToast, navigateTo } = useApp();
  const { formatMoney } = useCurrency();

  const [model, setModel] = useState<BizModel>('general');
  const [businessId, setBusinessId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [targetMargin, setTargetMargin] = useState<string>('25');
  const [mode, setMode] = useState<'from_cost_price' | 'from_cost_margin' | 'from_price_margin'>(
    'from_cost_price'
  );
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  const [moAdvice, setMoAdvice] = useState<string>('');
  const [moLoading, setMoLoading] = useState(false);
  const [moError, setMoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let category = '';
        let bid = user?.businessId || '';
        let bname = '';
        if (user?.id) {
          const { data } = await getSupabase()
            .from('users')
            .select('business_id, businessId, category, business_type, metadata, business_name, businessName, display_name')
            .eq('id', user.id)
            .maybeSingle();
          bid =
            bid ||
            (data as any)?.business_id ||
            (data as any)?.businessId ||
            '';
          category =
            (data as any)?.category ||
            (data as any)?.business_type ||
            (data as any)?.metadata?.category ||
            '';
          bname =
            (data as any)?.business_name ||
            (data as any)?.businessName ||
            (data as any)?.display_name ||
            '';
        }
        if (!cancelled) {
          const m = detectModel(category);
          setModel(m);
          setTargetMargin(String(MODEL_HINTS[m].targetMargin));
          setBusinessId(bid);
          setBusinessName(bname);
        }
        if (bid && !cancelled) {
          setLoadingProducts(true);
          const docs = await fetchDocs(`businesses/${bid}/products`, { limit: 100 });
          const list: ProductRow[] = (docs as any[])
            .filter((p) => String(p.productType || p.metadata?.productType || '') !== 'ingredient')
            .map((p) => {
              const c = Number(p.cost ?? p.costPrice ?? 0) || 0;
              const pr = Number(p.price ?? p.sellingPrice ?? 0) || 0;
              return {
                id: p.id,
                name: p.name || 'Item',
                cost: c,
                price: pr,
                productType: p.productType || p.metadata?.productType,
                margin: marginOf(c, pr),
              };
            })
            .filter((p) => p.price > 0 || p.cost > 0)
            .sort((a, b) => a.margin - b.margin)
            .slice(0, 50);
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

  /** Local MO-style portfolio intelligence (no API) */
  const portfolio = useMemo(() => {
    const priced = products.filter((p) => p.price > 0);
    if (!priced.length) {
      return {
        avgMargin: 0,
        weak: [] as ProductRow[],
        strong: [] as ProductRow[],
        missingCost: products.filter((p) => p.price > 0 && p.cost <= 0),
        summary: 'Add product costs and prices so MO can score your catalogue.',
      };
    }
    const avgMargin = priced.reduce((s, p) => s + p.margin, 0) / priced.length;
    const weak = priced.filter((p) => p.margin < hints.targetMargin * 0.7).slice(0, 8);
    const strong = [...priced].sort((a, b) => b.margin - a.margin).slice(0, 5);
    const missingCost = products.filter((p) => p.price > 0 && p.cost <= 0);
    let summary = '';
    if (avgMargin >= hints.targetMargin) {
      summary = `Catalogue average margin is ${avgMargin.toFixed(0)}% — on or above the ${hints.targetMargin}% guide for ${hints.label}.`;
    } else if (weak.length) {
      summary = `${weak.length} item(s) sit well below the ${hints.targetMargin}% ${hints.label.toLowerCase()} target. Fix those first.`;
    } else {
      summary = `Average margin ${avgMargin.toFixed(0)}% is below the ${hints.targetMargin}% guide — nudge prices or costs.`;
    }
    return { avgMargin, weak, strong, missingCost, summary };
  }, [products, hints]);

  const applyProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setCost(String(p.cost));
    setPrice(String(p.price));
    setMode('from_cost_price');
    setSelectedProductName(p.name);
    showToast(`Loaded ${p.name}`);
  };

  const applySuggestedPrice = () => {
    if (result?.suggestedPrice != null) {
      setPrice(String(Math.ceil(result.suggestedPrice)));
      setMode('from_cost_price');
      showToast('Applied MO-style suggested price');
    }
  };

  const askMo = useCallback(
    async (intent: 'item' | 'catalogue') => {
      if (!user?.id) {
        showToast('Sign in to ask MO');
        return;
      }
      setMoLoading(true);
      setMoError(null);
      setMoAdvice('');

      const target = parseFloat(targetMargin) || hints.targetMargin;
      const catalogueSample = products
        .slice(0, 15)
        .map(
          (p) =>
            `- ${p.name}: cost ${p.cost}, price ${p.price}, margin ${p.margin.toFixed(1)}%`
        )
        .join('\n');

      let message = '';
      if (intent === 'item') {
        message = `You are MO, Busmo pricing co-pilot. Give short, practical pricing advice (max 120 words) for an African ${hints.label} business${businessName ? ` named ${businessName}` : ''}.

Current calculator:
- Mode: ${mode}
- Cost: ${cost || 'n/a'}
- Price: ${price || 'n/a'}
- Target margin: ${target}%
- Item focus: ${selectedProductName || 'custom numbers'}
- Computed margin: ${result ? result.margin.toFixed(1) + '%' : 'n/a'}
- Computed profit/unit: ${result ? result.profit : 'n/a'}
- Industry guide margin: ~${hints.targetMargin}%

Respond with:
1) Verdict (healthy / thin / loss)
2) One concrete price or cost action
3) One operational tip for this business type
Do NOT use markdown. No asterisks, no bold, no bullet stars, no headings. Plain sentences only. Number actions 1) 2) 3).`;
      } else {
        message = `You are MO, Busmo pricing co-pilot. Analyse this ${hints.label} catalogue and give sharp pricing priorities (max 150 words).

Business: ${businessName || 'Owner business'}
Industry guide margin: ~${hints.targetMargin}%
Catalogue average margin: ${portfolio.avgMargin.toFixed(1)}%
Weak items (lowest margin): ${portfolio.weak.map((w) => w.name).join(', ') || 'none flagged'}
Items missing cost: ${portfolio.missingCost.length}

Sample lines:
${catalogueSample || '(empty catalogue)'}

Respond with:
1) Overall pricing health in one sentence
2) Top 3 actions ranked (what to change first)
3) One sentence on cash risk if they keep current prices
Plain language for a busy owner. No fluff. Do NOT use markdown, asterisks, or bold markers.`;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 28000);
        const response = await fetch('/api/ask-mo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message,
            userId: user.id,
            businessId: businessId || user.businessId || '',
            conversationHistory: [],
            plan: (user as any)?.plan || 'starter',
            context: {
              page: 'margin-calculator',
              businessModel: model,
              pricing: {
                cost: parseFloat(cost) || 0,
                price: parseFloat(price) || 0,
                targetMargin: target,
                result,
              },
            },
          }),
        });
        clearTimeout(timeout);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `MO error ${response.status}`);
        }
        const data = await response.json();
        const text =
          data.answer ||
          data.response ||
          data.message ||
          data.rendered?.text ||
          '';
        if (!text.trim()) throw new Error('MO returned an empty answer');
        setMoAdvice(text.trim());
      } catch (e: any) {
        console.error('MO pricing advice failed', e);
        // Local fallback so the page still feels smart offline / if MO is down
        const fallback =
          intent === 'item' && result
            ? health === 'healthy'
              ? `MO offline note: At ${result.margin.toFixed(0)}% margin you are at or above the ${hints.targetMargin}% ${hints.label} guide. Keep costs updated monthly so this stays true.`
              : health === 'ok'
                ? `MO offline note: Margin ${result.margin.toFixed(0)}% is workable but under the ${hints.targetMargin}% guide. Try selling near ${formatMoney(
                    (result.cost || 0) / (1 - hints.targetMargin / 100)
                  )} or trim cost by about ${formatMoney(Math.max(0, result.cost - result.price * (1 - hints.targetMargin / 100)))}.`
                : `MO offline note: Margin ${result.margin.toFixed(0)}% is thin for ${hints.label}. Prioritise a price increase or lower input cost before pushing volume.`
            : `MO offline note: ${portfolio.summary} ${
                portfolio.weak[0]
                  ? `Start with “${portfolio.weak[0].name}” (${portfolio.weak[0].margin.toFixed(0)}% margin).`
                  : ''
              }`;
        setMoAdvice(fallback);
        setMoError(e?.name === 'AbortError' ? 'MO took too long — showing local guidance' : null);
      } finally {
        setMoLoading(false);
      }
    },
    [
      user,
      businessId,
      businessName,
      hints,
      model,
      mode,
      cost,
      price,
      targetMargin,
      selectedProductName,
      result,
      health,
      products,
      portfolio,
      formatMoney,
      showToast,
    ]
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Pricing intelligence · powered by MO</div>
          <h1 className={styles.title}>
            <Calculator size={22} /> Margin calculator
          </h1>
          <p className={styles.sub}>
            Set healthy prices for what you sell — tuned for {hints.label.toLowerCase()}, with MO
            reading your numbers and catalogue.
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

      {/* Portfolio pulse */}
      <section className={styles.pulseBar}>
        <div className={styles.pulseStat}>
          <span>Avg catalogue margin</span>
          <strong>
            {products.length ? `${portfolio.avgMargin.toFixed(0)}%` : '—'}
          </strong>
        </div>
        <div className={styles.pulseStat}>
          <span>Below target</span>
          <strong className={portfolio.weak.length ? styles.warnText : undefined}>
            {portfolio.weak.length}
          </strong>
        </div>
        <div className={styles.pulseStat}>
          <span>Missing cost</span>
          <strong>{portfolio.missingCost.length}</strong>
        </div>
        <p className={styles.pulseSummary}>{portfolio.summary}</p>
      </section>

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

          {selectedProductName && (
            <p className={styles.selectedItem}>Focus: {selectedProductName}</p>
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
                <p className={styles.healthMsg}>
                  <CheckCircle2 size={14} /> On track for a healthy {hints.label.toLowerCase()} margin.
                </p>
              )}
              {health === 'ok' && (
                <p className={styles.healthMsg}>
                  Acceptable, but below the ~{hints.targetMargin}% guide for {hints.label.toLowerCase()}.
                </p>
              )}
              {health === 'low' && (
                <p className={styles.healthMsg}>
                  <AlertTriangle size={14} /> Margin is thin — raise price or lower cost before volume
                  grows losses.
                </p>
              )}
              {result.suggestedPrice != null && (
                <button type="button" className={styles.secondaryBtn} onClick={applySuggestedPrice}>
                  Use suggested price {formatMoney(Math.ceil(result.suggestedPrice))}
                </button>
              )}
            </div>
          ) : (
            <p className={styles.placeholder}>Enter values above to see margin, profit, and markup.</p>
          )}

          <div className={styles.moActions}>
            <button
              type="button"
              className={styles.moBtn}
              disabled={moLoading || !result}
              onClick={() => askMo('item')}
            >
              {moLoading ? <Loader2 size={16} className={styles.spin} /> : <Sparkles size={16} />}
              Ask MO about this price
            </button>
            <button
              type="button"
              className={styles.moBtnGhost}
              disabled={moLoading}
              onClick={() => askMo('catalogue')}
            >
              <Sparkles size={16} /> Scan my catalogue
            </button>
          </div>
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

          {portfolio.weak.length > 0 && (
            <div className={styles.weakBox}>
              <div className={styles.weakTitle}>
                <AlertTriangle size={14} /> Priority fixes
              </div>
              {portfolio.weak.slice(0, 5).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={styles.productRow}
                  onClick={() => applyProduct(w.id)}
                >
                  <span className={styles.productName}>{w.name}</span>
                  <span className={styles.productMeta}>
                    {formatMoney(w.cost)} → {formatMoney(w.price)} · {w.margin.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          )}

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
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.productRow}
                  onClick={() => applyProduct(p.id)}
                >
                  <span className={styles.productName}>{p.name}</span>
                  <span className={styles.productMeta}>
                    {formatMoney(p.cost)} → {formatMoney(p.price)} · {p.margin.toFixed(0)}%
                    {p.margin < hints.targetMargin * 0.7 ? ' · weak' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MO advice panel */}
      <section className={styles.moPanel}>
        <div className={styles.moPanelHead}>
          <Sparkles size={18} />
          <div>
            <h2>MO pricing coach</h2>
            <p>Uses your calculator inputs and catalogue — not generic blog tips.</p>
          </div>
        </div>
        {moError && <p className={styles.moError}>{moError}</p>}
        {moLoading && (
          <p className={styles.placeholder}>
            <Loader2 size={14} className={styles.spin} /> MO is reading your margins…
          </p>
        )}
        {moAdvice ? (
          <div className={styles.moAdvice}>
            {formatMoAdvice(moAdvice).map((line, i) =>
              line.kind === 'li' ? (
                <p key={i} className={styles.moAdviceBullet}>
                  {line.text}
                </p>
              ) : (
                <p key={i} className={styles.moAdviceLine}>
                  {line.text}
                </p>
              )
            )}
          </div>
        ) : (
          !moLoading && (
            <p className={styles.placeholder}>
              Tap “Ask MO about this price” after you enter numbers, or “Scan my catalogue” for a full
              pass. MO falls back to local guidance if the network is slow.
            </p>
          )
        )}
        <button
          type="button"
          className={styles.moBtnGhost}
          onClick={() => { try { navigateTo('mo' as any); } catch { /* ignore */ } }}
        >
          Open full Ask MO chat
        </button>
      </section>
    </div>
  );
}
