import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { useFirestore } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Card, CardHeader, CardIcon } from './Card';
import { MetricCard } from './Badge';
import { Button, ActionLink } from './Button';
import { NavIcons } from './NavIcons';
import { MoIcon } from './NavIcons';
import styles from './HomePage.module.css';

// MO Suggestion chips with translation keys
const MO_SUGGESTION_KEYS = [
  'mo.suggest.howBusiness',
  'mo.suggest.cashBalance',
  'mo.suggest.restock',
  'mo.suggest.expenses',
  'mo.suggest.recordSale',
  'mo.suggest.addProduct',
];

// Initialize Firebase once
let firestore: ReturnType<typeof getFirestore> | null = null;
try {
  const firebaseApp = initializeFirebase();
  firestore = getFirestore(firebaseApp.firebaseApp);
} catch (error) {
  console.warn('Firebase not initialized:', error);
}

// ═══════════════════════════════════════════
//  HomePage
// ═══════════════════════════════════════════

export function HomePage() {
  const { navigateTo, showToast, user } = useApp();
  const { t, lang } = useTranslation();  // Add lang to trigger re-renders
  const { formatMoney } = useCurrency();
  const firestore = useFirestore();

  const [moResponse, setMoResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Real data state
  const [todayData, setTodayData] = useState({ sales: 0, profit: 0, transactions: 0 });
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalExpenses: 0,
    cashBalance: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProduct, setTopProduct] = useState<any>(null);
  const [forecastItems, setForecastItems] = useState<any[]>([]);

  // Fetch real data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Check if firestore is available
        if (!firestore) {
          console.warn('Firestore not initialized, using empty state');
          setLoading(false);
          return;
        }

        // Check if user ID is available
        if (!user.id) {
          console.warn('User not loaded yet, using empty state');
          setLoading(false);
          return;
        }

        // Get user's business ID from Firestore
        const userDocRef = doc(firestore, 'users', user.id);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.warn('User document not found');
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const businessId = userData.businessId;

        if (!businessId) {
          console.warn('No business ID found for user');
          setLoading(false);
          return;
        }

        // Fetch today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          where('createdAt', '>=', Timestamp.fromDate(today))
        );

        const salesSnapshot = await getDocs(salesQuery);
        let sales = 0, profit = 0, transactions = 0;
        const productRevenue = new Map<string, { name: string; revenue: number; quantity: number }>();

        salesSnapshot.forEach(doc => {
          const data = doc.data();
          sales += data.total || 0;
          profit += data.profit || 0;
          transactions += 1;
          
          // Track product revenue
          if (data.products && Array.isArray(data.products)) {
            data.products.forEach((p: any) => {
              const existing = productRevenue.get(p.productId || p.name) || {
                name: p.name,
                revenue: 0,
                quantity: 0,
              };
              existing.revenue += (p.price || 0) * (p.quantity || 0);
              existing.quantity += p.quantity || 0;
              productRevenue.set(p.productId || p.name, existing);
            });
          }
        });

        // Get top product
        const topProductData = Array.from(productRevenue.values())
          .sort((a, b) => b.revenue - a.revenue)[0];
        setTopProduct(topProductData || null);

        setTodayData({ sales, profit, transactions });
        setMetrics({
          totalRevenue: sales,
          totalProfit: profit,
          totalExpenses: 0,
          cashBalance: sales - profit,
        });

        // Fetch low stock products from businesses collection
        const productsQuery = query(
          collection(firestore, 'businesses', businessId, 'products'),
          where('active', '==', true)
        );

        const productsSnapshot = await getDocs(productsQuery);
        const lowStock: any[] = [];
        const allProducts: any[] = [];

        productsSnapshot.forEach(doc => {
          const data = doc.data();
          const threshold = data.lowStockThreshold || 10;
          const productData = { id: doc.id, name: data.name, stock: data.stock || 0, threshold, costPrice: data.costPrice || 0, sellPrice: data.price || 0 };
          allProducts.push(productData);
          
          if (data.stock <= threshold) {
            lowStock.push(productData);
          }
        });

        setLowStockProducts(lowStock.sort((a, b) => a.stock - b.stock));

        // Fetch expenses to calculate cash runway
        const expensesQuery = query(
          collection(firestore, 'businesses', businessId, 'expenses'),
          where('createdAt', '>=', Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
        );
        
        const expensesSnapshot = await getDocs(expensesQuery);
        let totalExpenses = 0;
        expensesSnapshot.forEach(doc => {
          const data = doc.data();
          totalExpenses += data.amount || 0;
        });

        // Calculate cash balance (simplified: revenue - expenses - COGS)
        const cogs = sales - profit; // Cost of goods sold
        const cashBalance = sales - totalExpenses - cogs;
        
        setMetrics({
          totalRevenue: sales,
          totalProfit: profit,
          totalExpenses: totalExpenses,
          cashBalance,
        });

        // Calculate and set forecast data
        const forecastData = calculateForecast(allProducts, sales, profit);
        setForecastItems(forecastData);

      } catch (error) {
        console.error('Error fetching data:', error);
        // Keep empty state as fallback
        setTodayData({ sales: 0, profit: 0, transactions: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate profit margin
  const profitMargin = metrics.totalRevenue > 0
    ? ((metrics.totalProfit / metrics.totalRevenue) * 100).toFixed(1)
    : '0';

  // Calculate cash runway
  const dailyBurn = metrics.totalExpenses / 30;
  // For new users with no expenses or negative cash balance, show appropriate message
  const cashRunway = dailyBurn > 0 && metrics.cashBalance > 0
    ? Math.round(metrics.cashBalance / dailyBurn)
    : metrics.totalExpenses === 0 && metrics.totalRevenue === 0
      ? 0  // New user with no data
      : metrics.cashBalance <= 0
        ? 0  // Negative or zero cash
        : 999; // No expenses but positive cash (unlimited runway)

  // Format metrics for display
  const displayMetrics = [
    { label: t('home.totalSales'), value: formatMoney(todayData.sales), trend: `+${todayData.transactions} txns`, trendType: 'up' as const },
    { label: t('home.netProfit'), value: formatMoney(todayData.profit), trend: `${profitMargin}% margin`, trendType: profitMargin >= '25' ? 'up' : 'down' as const },
    { label: t('home.totalExpenses'), value: formatMoney(metrics.totalExpenses), trend: dailyBurn > 0 ? `${Math.round(dailyBurn)}/day` : t('home.noExpenses'), trendType: 'neutral' as const },
    { label: t('home.cashBalance'), value: formatMoney(metrics.cashBalance), trend: metrics.totalExpenses === 0 && metrics.totalRevenue === 0 ? t('home.noDataYet') : `${cashRunway} days runway`, trendType: cashRunway >= 30 ? 'up' : cashRunway >= 14 ? 'neutral' : 'down' as const },
  ];

  function handleChip(reply: string, actionType?: 'question' | 'record-sale' | 'add-product') {
    // Handle action commands differently from questions
    if (actionType === 'record-sale' || actionType === 'add-product') {
      // Navigate to the appropriate page with the command
      if (actionType === 'record-sale') {
        navigateTo('sale');
        showToast('Opening Record Sale page...');
      } else if (actionType === 'add-product') {
        navigateTo('add-product');
        showToast('Opening Add Product page...');
      }
      return;
    }
    
    // For questions, make API call to Ask MO
    fetch('/api/ask-mo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: reply,
        merchantId: 'demo',
      }),
    })
    .then(res => res.json())
    .then(data => {
      setMoResponse(data.answer || 'MO is thinking...');
    })
    .catch(err => {
      console.error('Ask MO error:', err);
      setMoResponse("Sorry, I'm having trouble connecting right now.");
    });
  }

  return (
    <div className={styles.layout}>
      {/* ── Left column ── */}
      <div className={styles.left}>

        {/* Ask MO quick card */}
        <Card>
          <div className={styles.askHeader}>
            <div className={styles.moAvatarSm}>
              <MoIcon size={13} />
            </div>
            <span className={styles.askTitle}>{t('mo.title')}</span>
            <button
              className={styles.expandBtn}
              onClick={() => navigateTo('mo')}
              title={t('mo.openFullPage')}
              aria-label={t('mo.openAskMO')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
          </div>
          <p className={styles.askSub}>{t('mo.subtitle')}</p>
          <div className={styles.chips}>
            <button
              key="howBusiness"
              className={styles.chip}
              onClick={() => handleChip(t('mo.suggest.howBusiness'), 'question')}
            >
              {t('mo.suggest.howBusiness')}
            </button>
            <button
              key="cashBalance"
              className={styles.chip}
              onClick={() => handleChip(t('mo.suggest.cashBalance'), 'question')}
            >
              {t('mo.suggest.cashBalance')}
            </button>
            <button
              key="restock"
              className={styles.chip}
              onClick={() => handleChip(t('mo.suggest.restock'), 'question')}
            >
              {t('mo.suggest.restock')}
            </button>
            <button
              key="expenses"
              className={styles.chip}
              onClick={() => handleChip(t('mo.suggest.expenses'), 'question')}
            >
              {t('mo.suggest.expenses')}
            </button>
            <button
              key="recordSale"
              className={styles.chip}
              onClick={() => handleChip(t('mo.suggest.recordSale'), 'record-sale')}
              style={{ background: 'var(--brand-lt)', color: 'var(--brand)' }}
            >
              💰 {t('mo.suggest.recordSale')}
            </button>
            <button
              key="addProduct"
              className={styles.chip}
              onClick={() => handleChip(t('mo.suggest.addProduct'), 'add-product')}
              style={{ background: 'var(--purple-lt)', color: 'var(--purple)' }}
            >
              📦 {t('mo.suggest.addProduct')}
            </button>
          </div>
          {moResponse && (
            <div className={styles.askResp}>
              {moResponse}
            </div>
          )}
        </Card>

        {/* Business Health */}
        <Card>
          <CardHeader
            action={<ActionLink onClick={() => navigateTo('statement')}>{t('home.fullStatement')} →</ActionLink>}
          >
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </CardIcon>
            {t('home.businessHealth')}
          </CardHeader>
          <div className={styles.metricsGrid}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                Loading metrics...
              </div>
            ) : (
              displayMetrics.map(m => (
                <MetricCard
                  key={m.label}
                  label={m.label}
                  value={m.value}
                  trend={m.trend}
                  trendType={m.trendType}
                  valueColor={m.label.includes(t('home.netProfit')) ? 'green' : 'default'}
                />
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--amber-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </CardIcon>
            {t('home.quickActions')}
          </CardHeader>
          <div className={styles.quickActions}>
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.labelKey}
                className={[styles.qaBtn, qa.primary ? styles.qaPrimary : ''].join(' ')}
                onClick={() => qa.page ? navigateTo(qa.page as any) : showToast(`${t(qa.labelKey)}…`)}
              >
                {['sale', 'add-product', 'add-expense', 'cashflow'].includes(qa.icon) ? (
                  <NavIcons id={qa.icon} size={18} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d={qa.icon}/>
                  </svg>
                )}
                {t(qa.labelKey)}
              </button>
            ))}
          </div>
        </Card>

        {/* Services Preview */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--teal-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth={2}>
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            </CardIcon>
            {t('services.title')}
          </CardHeader>
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px', opacity: 0.5 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div style={{ fontWeight: 500, marginBottom: '4px' }}>No services available at the moment</div>
            <div style={{ fontSize: '0.75rem' }}>We're working on bringing you useful business services. Check back soon!</div>
          </div>
        </Card>
      </div>

      {/* ── Right column ── */}
      <div className={styles.right}>

        {/* Top Insight */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--amber-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </CardIcon>
            {t('home.topInsight')}
          </CardHeader>
          <div className={styles.insightList}>
            {loading ? (
              <div style={{ padding: '20px', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                Loading insights...
              </div>
            ) : (
              <>
                <div className={styles.insightItem}>
                  <div className={styles.insightDot} style={{ background: profitMargin >= '25' ? 'var(--green)' : 'var(--amber)' }} />
                  <div className={styles.insightText}>
                    {t('home.insight.profitMargin')} <strong>{metrics.totalRevenue === 0 ? t('home.noDataYet') : profitMargin >= '25' ? t('home.insight.healthy') : `${profitMargin}%`}</strong>
                  </div>
                </div>
                {lowStockProducts.length > 0 ? (
                  <div className={styles.insightItem}>
                    <div className={styles.insightDot} style={{ background: 'var(--red)' }} />
                    <div className={styles.insightText}>
                      <strong>{lowStockProducts[0].name}</strong> {t('home.insight.runsOut')} {lowStockProducts[0].stock} {t('home.insight.days')}
                    </div>
                  </div>
                ) : (
                  <div className={styles.insightItem}>
                    <div className={styles.insightDot} style={{ background: 'var(--green)' }} />
                    <div className={styles.insightText}>
                      <strong>{t('home.insight.allProducts')}</strong> {t('home.insight.healthyStock')}
                    </div>
                  </div>
                )}
                {topProduct ? (
                  <div className={styles.insightItem}>
                    <div className={styles.insightDot} style={{ background: 'var(--blue)' }} />
                    <div className={styles.insightText}>
                      <strong>{topProduct.name}</strong> <strong>{((topProduct.revenue / metrics.totalRevenue) * 100).toFixed(0)}% {t('home.insight.revenue')}</strong>
                    </div>
                  </div>
                ) : (
                  <div className={styles.insightItem}>
                    <div className={styles.insightDot} style={{ background: 'var(--purple)' }} />
                    <div className={styles.insightText}>
                      {t('home.insight.cashRunway')} <strong>{metrics.totalExpenses === 0 && metrics.totalRevenue === 0 ? t('home.noDataYet') : cashRunway >= 30 ? t('home.insight.strong') : `${cashRunway} ${t('home.insight.days')}`}</strong>
                    </div>
                  </div>
                )}
                <div className={styles.insightItem}>
                  <div className={styles.insightDot} style={{ background: 'var(--purple)' }} />
                  <div className={styles.insightText}>
                    {t('home.insight.cashRunway')} <strong>{metrics.totalExpenses === 0 && metrics.totalRevenue === 0 ? t('home.noDataYet') : cashRunway >= 30 ? t('home.insight.strong') : `${cashRunway} ${t('home.insight.days')}`}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Forecasts */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </CardIcon>
            {t('home.forecasts')}
            <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--text-3)' }}>{t('home.forecastDesc')}</span>
          </CardHeader>
          <div className={styles.forecastGrid}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                {t('home.loading')}...
              </div>
            ) : forecastItems.length > 0 ? (
              forecastItems.slice(0, 4).map((item, idx) => (
                <div key={idx} className={styles.forecastItem}>
                  <div className={styles.forecastLabel}>{t(item.labelKey)}</div>
                  <div className={`${styles.forecastValue} ${item.isAlert ? styles.forecastAlert : ''}`}>
                    {item.value}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                {t('home.noForecastData')}
              </div>
            )}
          </div>
        </Card>

        {/* Sell Online CTA */}
        <div className={styles.miniCard}>
          <div className={styles.miniTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth={2} width={14} height={14}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {t('home.sellOnline')}
          </div>
          <div className={styles.miniDesc}>{t('home.sellOnlineDesc')}</div>
          <button className={styles.miniBtn}>{t('home.setUpStore')} →</button>
        </div>

        <div className={styles.miniCard} onClick={() => navigateTo(`referrals`)} style={{ cursor: 'pointer' }}>
          <div className={styles.miniTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2} width={14} height={14}>
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
            </svg>
            {t('nav.referrals')}
          </div>
          <div className={styles.miniBalance}>₦0</div>
          <div className={styles.miniDesc}>{t('home.referralsDesc')}</div>
          <button className={styles.miniBtn}>{t('home.startReferring')} →</button>
        </div>

        <div className={styles.miniCard} onClick={() => navigateTo(`capital`)} style={{ cursor: 'pointer' }}>
          <div className={styles.miniTitle}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2} width={14} height={14}>
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            {t('capital.title')}
          </div>
          <div className={styles.miniDesc}>{t('home.capitalDesc')}</div>
          <button className={styles.miniBtn}>{t('home.exploreFinancing')} →</button>
        </div>
      </div>
    </div>
  );
}

// ── Local data ────────────────────────────────
const QUICK_ACTIONS = [
  { labelKey: 'nav.recordSale', page: 'sale', primary: true, icon: 'sale' },
  { labelKey: 'nav.addProduct', page: 'add-product', primary: false, icon: 'add-product' },
  { labelKey: 'nav.cashflow', page: 'cashflow', primary: false, icon: 'cashflow' },
  { labelKey: 'nav.addExpense', page: 'add-expense', primary: false, icon: 'add-expense' },
  { labelKey: 'nav.askMO', page: 'mo', primary: false,
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { labelKey: 'nav.referrals', page: 'referrals', primary: false,
    icon: 'M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z' },
];

/**
 * FORECAST CALCULATION
 * 
 * How forecast is calculated:
 * 1. Analyzes sales velocity (sales per day) from recent transactions
 * 2. Projects revenue for next 7 days based on historical patterns
 * 3. Identifies products that will run out of stock within 7 days
 * 4. Calculates expected profit based on current margins
 * 
 * @param products - Array of all products with stock levels
 * @param totalSales - Total sales revenue
 * @param totalProfit - Total profit
 * @returns Array of forecast items to display
 */
function calculateForecast(products: any[], totalSales: number, totalProfit: number) {
  const forecasts: Array<{ labelKey: string; value: string; isAlert?: boolean }> = [];
  
  // Calculate average daily sales (assuming we have data for analysis)
  const avgDailySales = totalSales > 0 ? totalSales / 7 : 0;
  const avgDailyProfit = totalProfit > 0 ? totalProfit / 7 : 0;
  
  // Forecast 1: Next 7 days revenue projection
  if (avgDailySales > 0) {
    const projectedRevenue = Math.round(avgDailySales * 7);
    forecasts.push({
      labelKey: 'home.forecast.revenue',
      value: `₦${projectedRevenue.toLocaleString()}`,
      isAlert: false,
    });
  }
  
  // Forecast 2: Products that will run out (based on current stock vs sales velocity)
  const productsRunningOut = products.filter(p => {
    const dailySalesVelocity = p.sellPrice ? (avgDailySales / p.sellPrice) : 1;
    const daysUntilStockout = p.stock / (dailySalesVelocity || 1);
    return daysUntilStockout <= 7 && p.stock > 0;
  }).length;
  
  if (productsRunningOut > 0) {
    forecasts.push({
      labelKey: 'home.forecast.stockout',
      value: `${productsRunningOut} products`,
      isAlert: true,
    });
  }
  
  // Forecast 3: Expected profit next 7 days
  if (avgDailyProfit > 0) {
    const projectedProfit = Math.round(avgDailyProfit * 7);
    forecasts.push({
      labelKey: 'home.forecast.profit',
      value: `₦${projectedProfit.toLocaleString()}`,
      isAlert: false,
    });
  }
  
  // Forecast 4: Restock needed
  const needsRestock = products.filter(p => p.stock <= p.threshold).length;
  if (needsRestock > 0) {
    forecasts.push({
      labelKey: 'home.forecast.restock',
      value: `${needsRestock} items`,
      isAlert: true,
    });
  }
  
  // If no forecasts generated, show default message
  if (forecasts.length === 0) {
    forecasts.push({
      labelKey: 'home.forecast.noData',
      value: '—',
      isAlert: false,
    });
  }
  
  return forecasts;
}
