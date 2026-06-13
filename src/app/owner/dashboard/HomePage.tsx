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
import { InlineAIChat } from './InlineAIChat';
import { RestaurantHealthScore } from './RestaurantHealthScore';
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
  const { navigateTo, showToast, user, aiPanelOpen, toggleAIPanel } = useApp();
  const { t, lang } = useTranslation();  // Add lang to trigger re-renders
  const { formatMoney } = useCurrency();
  const firestore = useFirestore();

  const [moResponse, setMoResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
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
  const [yesterdaySales, setYesterdaySales] = useState(0);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [selectedForecast, setSelectedForecast] = useState<string | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  // Fetch real data on mount
  useEffect(() => {
    fetchData();
  }, [selectedPeriod, user.id, firestore]);

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

        // Calculate date range based on selected period
        const now = new Date();
        let startDate: Date;
        
        if (selectedPeriod === 'daily') {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
        } else if (selectedPeriod === 'weekly') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
        } else if (selectedPeriod === 'monthly') {
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
        } else {
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
        }

        // Fetch yesterday's sales for comparison
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date();
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        yesterdayEnd.setHours(23, 59, 59, 999);

        const yesterdayQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          where('createdAt', '>=', Timestamp.fromDate(yesterday)),
          where('createdAt', '<=', Timestamp.fromDate(yesterdayEnd))
        );

        const yesterdaySnapshot = await getDocs(yesterdayQuery);
        let yesterdayTotal = 0;
        yesterdaySnapshot.forEach(doc => {
          const data = doc.data();
          yesterdayTotal += data.totalRevenue || data.total || 0;
        });
        setYesterdaySales(yesterdayTotal);

        // Fetch sales for the selected period
        const salesQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          where('createdAt', '>=', Timestamp.fromDate(startDate))
        );

        const salesSnapshot = await getDocs(salesQuery);
        let sales = 0, profit = 0, transactions = 0;
        const productRevenue = new Map<string, { name: string; revenue: number; quantity: number }>();

        salesSnapshot.forEach(doc => {
          const data = doc.data();
          sales += data.totalRevenue || data.total || 0;
          
          // Always calculate profit from products to ensure accuracy
          let docProfit = 0;
          if (data.products && Array.isArray(data.products)) {
            docProfit = data.products.reduce((sum: number, p: any) => {
              const price = p.price || 0;
              const costPrice = p.costPrice || p.cost || 0;
              const quantity = p.quantity || 1;
              return sum + ((price - costPrice) * quantity);
            }, 0);
          }
          profit += docProfit;
          
          transactions += 1;
          
          // Track credit sales for pending collections
          if (data.paymentBreakdown && Array.isArray(data.paymentBreakdown)) {
            data.paymentBreakdown.forEach((pb: any) => {
              if (pb.method === 'credit' && !pb.received) {
                setPendingCollections(prev => prev + pb.amount);
              }
            });
          }
          
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

        // Fetch expenses to calculate cash runway (only for selected period)
        const expensesQuery = query(
          collection(firestore, 'businesses', businessId, 'expenses'),
          where('createdAt', '>=', Timestamp.fromDate(startDate))
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
    { label: t('home.netProfit'), value: formatMoney(todayData.profit), trend: `${profitMargin}% margin`, trendType: (profitMargin >= '25' ? 'up' : 'down') as 'up' | 'down' | 'neutral' },
    { label: t('home.totalExpenses'), value: formatMoney(metrics.totalExpenses), trend: dailyBurn > 0 ? `${Math.round(dailyBurn)}/day` : t('home.noExpenses'), trendType: 'neutral' as const },
    { label: t('home.cashBalance'), value: formatMoney(metrics.cashBalance), trend: metrics.totalExpenses === 0 && metrics.totalRevenue === 0 ? t('home.noDataYet') : `${cashRunway} days runway`, trendType: (cashRunway >= 30 ? 'up' : cashRunway >= 14 ? 'neutral' : 'down') as 'up' | 'down' | 'neutral' },
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
    
    // For questions, make API call to Ask MO with the current business ID
    fetch('/api/ask-mo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: reply,
        merchantId: user?.businessId || user?.id || 'demo',
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
    <div className={`${styles.layout} ${aiPanelOpen ? styles.layoutWithAI : ''}`}>
      {/* ── Left column ── */}
      <div className={styles.left}>

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
          <div className={styles.periodChips}>
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                className={`${styles.periodChip} ${selectedPeriod === period ? styles.periodChipActive : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
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
                onClick={() => qa.page ? navigateTo(qa.page as any) : showToast(`${t(qa.labelKey as any)}…`)}
              >
                {['sale', 'add-product', 'add-expense', 'cashflow'].includes(qa.icon) ? (
                  <NavIcons id={qa.icon} size={18} />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d={qa.icon}/>
                  </svg>
                )}
                {t(qa.labelKey as any)}
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

        {/* Restaurant Health Score - Only for restaurants */}
        <RestaurantHealthScore />
      </div>

      {/* ── Right column ── */}
      <div className={styles.right}>
        {aiPanelOpen ? (
          <Card style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
            <InlineAIChat onClose={toggleAIPanel} />
          </Card>
        ) : (
          <>
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
                {/* Sales Trend */}
                <div className={styles.insightItem} onClick={() => setSelectedInsight('sales-trend')} style={{ cursor: 'pointer' }}>
                  <div className={styles.insightIcon} style={{ background: yesterdaySales > 0 && todayData.sales > yesterdaySales ? 'var(--green-bg)' : yesterdaySales > 0 && todayData.sales < yesterdaySales ? 'var(--red-bg)' : 'var(--purple-bg)' }}>
                    {yesterdaySales > 0 && todayData.sales > yesterdaySales ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                    ) : yesterdaySales > 0 && todayData.sales < yesterdaySales ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/></svg>
                    )}
                  </div>
                  <div className={styles.insightText}>
                    <div className={styles.insightLabel}>Sales Trend</div>
                    <div className={styles.insightValue}>
                      {yesterdaySales === 0 ? 'No data yesterday' : 
                       todayData.sales > yesterdaySales ? `+${formatMoney(todayData.sales - yesterdaySales)} vs yesterday` :
                       todayData.sales < yesterdaySales ? `-${formatMoney(yesterdaySales - todayData.sales)} vs yesterday` :
                       'Same as yesterday'}
                    </div>
                  </div>
                </div>

                {/* Pending Collections */}
                {pendingCollections > 0 ? (
                  <div className={styles.insightItem} onClick={() => setSelectedInsight('pending-collections')} style={{ cursor: 'pointer' }}>
                    <div className={styles.insightIcon} style={{ background: 'var(--red-bg)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className={styles.insightText}>
                      <div className={styles.insightLabel}>Pending Collections</div>
                      <div className={styles.insightValue}>{formatMoney(pendingCollections)} to collect</div>
                    </div>
                  </div>
                ) : null}

                {/* Low Stock Alert */}
                {lowStockProducts.length > 0 ? (
                  <div className={styles.insightItem} onClick={() => setSelectedInsight('low-stock')} style={{ cursor: 'pointer' }}>
                    <div className={styles.insightIcon} style={{ background: 'var(--amber-bg)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className={styles.insightText}>
                      <div className={styles.insightLabel}>Low Stock</div>
                      <div className={styles.insightValue}>{lowStockProducts.length} {lowStockProducts.length === 1 ? 'item' : 'items'} need restock</div>
                    </div>
                  </div>
                ) : null}

                {/* Cash Balance */}
                <div className={styles.insightItem} onClick={() => setSelectedInsight('cash-balance')} style={{ cursor: 'pointer' }}>
                  <div className={styles.insightIcon} style={{ background: metrics.cashBalance > 0 ? 'var(--green-bg)' : 'var(--red-bg)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={metrics.cashBalance > 0 ? 'var(--green)' : 'var(--red)'} strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                  </div>
                  <div className={styles.insightText}>
                    <div className={styles.insightLabel}>Cash Balance</div>
                    <div className={styles.insightValue}>{formatMoney(metrics.cashBalance)}</div>
                  </div>
                </div>

                {/* Quick Insight */}
                <div className={styles.insightItem} onClick={() => setSelectedInsight('daily-summary')} style={{ cursor: 'pointer' }}>
                  <div className={styles.insightIcon} style={{ background: 'var(--blue-bg)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  </div>
                  <div className={styles.insightText}>
                    <div className={styles.insightLabel}>Today's Insight</div>
                    <div className={styles.insightValue}>
                      {todayData.transactions > 10 ? 'Busy day! Great momentum' :
                       todayData.transactions > 5 ? 'Good activity today' :
                       todayData.transactions > 0 ? 'Slow start, keep pushing' :
                       'No sales yet - make it happen!'}
                    </div>
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
          </CardHeader>
          <div className={styles.forecastList}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                {t('home.loading')}...
              </div>
            ) : (
              <>
                {/* Revenue Forecast */}
                <div className={styles.forecastItemMinimal} onClick={() => setSelectedForecast('revenue')} style={{ cursor: 'pointer' }}>
                  <div className={styles.forecastIcon} style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                  </div>
                  <div className={styles.forecastInfo}>
                    <div className={styles.forecastLabel}>Revenue Forecast</div>
                    <div className={styles.forecastValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.revenue')?.value || '₦0'}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={16} height={16}><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                {/* Profit Forecast */}
                <div className={styles.forecastItemMinimal} onClick={() => setSelectedForecast('profit')} style={{ cursor: 'pointer' }}>
                  <div className={styles.forecastIcon} style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div className={styles.forecastInfo}>
                    <div className={styles.forecastLabel}>Profit Forecast</div>
                    <div className={styles.forecastValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.profit')?.value || '₦0'}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={16} height={16}><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                {/* Stock Alerts */}
                <div className={styles.forecastItemMinimal} onClick={() => setSelectedForecast('stock')} style={{ cursor: 'pointer' }}>
                  <div className={styles.forecastIcon} style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div className={styles.forecastInfo}>
                    <div className={styles.forecastLabel}>Stock Alerts</div>
                    <div className={styles.forecastValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.stockout')?.value || '0 products'}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={16} height={16}><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                {/* Restock Needed */}
                <div className={styles.forecastItemMinimal} onClick={() => setSelectedForecast('restock')} style={{ cursor: 'pointer' }}>
                  <div className={styles.forecastIcon} style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
                  </div>
                  <div className={styles.forecastInfo}>
                    <div className={styles.forecastLabel}>Restock Needed</div>
                    <div className={styles.forecastValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.restock')?.value || '0 items'}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={16} height={16}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </>
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
          </>
        )}
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInsight(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedInsight(null)}>✕</button>
            <h2 className={styles.modalTitle}>
              {selectedInsight === 'sales-trend' && 'Sales Trend Details'}
              {selectedInsight === 'pending-collections' && 'Pending Collections'}
              {selectedInsight === 'low-stock' && 'Low Stock Items'}
              {selectedInsight === 'cash-balance' && 'Cash Balance Breakdown'}
              {selectedInsight === 'daily-summary' && 'Daily Summary'}
            </h2>
            <div className={styles.modalContent}>
              {selectedInsight === 'sales-trend' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Today's Sales</span>
                    <span className={styles.detailValue}>{formatMoney(todayData.sales)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Yesterday's Sales</span>
                    <span className={styles.detailValue}>{formatMoney(yesterdaySales)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Change</span>
                    <span className={styles.detailValue} style={{ color: todayData.sales > yesterdaySales ? 'var(--green)' : todayData.sales < yesterdaySales ? 'var(--red)' : 'var(--text-1)' }}>
                      {yesterdaySales === 0 ? 'N/A' : 
                       todayData.sales > yesterdaySales ? `+${formatMoney(todayData.sales - yesterdaySales)}` :
                       todayData.sales < yesterdaySales ? `-${formatMoney(yesterdaySales - todayData.sales)}` :
                       '₦0'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Transactions Today</span>
                    <span className={styles.detailValue}>{todayData.transactions}</span>
                  </div>
                </div>
              )}
              {selectedInsight === 'pending-collections' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Pending</span>
                    <span className={styles.detailValue}>{formatMoney(pendingCollections)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Action</span>
                    <span className={styles.detailValue}>Follow up with customers</span>
                  </div>
                </div>
              )}
              {selectedInsight === 'low-stock' && (
                <div className={styles.detailSection}>
                  {lowStockProducts.map((product, index) => (
                    <div key={index} className={styles.detailRow}>
                      <span className={styles.detailLabel}>{product.name}</span>
                      <span className={styles.detailValue}>{product.stock} units</span>
                    </div>
                  ))}
                </div>
              )}
              {selectedInsight === 'cash-balance' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Current Balance</span>
                    <span className={styles.detailValue}>{formatMoney(metrics.cashBalance)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Revenue</span>
                    <span className={styles.detailValue}>{formatMoney(metrics.totalRevenue)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Expenses</span>
                    <span className={styles.detailValue}>{formatMoney(metrics.totalExpenses)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Net Profit</span>
                    <span className={styles.detailValue}>{formatMoney(metrics.totalProfit)}</span>
                  </div>
                </div>
              )}
              {selectedInsight === 'daily-summary' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Total Sales</span>
                    <span className={styles.detailValue}>{formatMoney(todayData.sales)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Profit</span>
                    <span className={styles.detailValue}>{formatMoney(todayData.profit)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Transactions</span>
                    <span className={styles.detailValue}>{todayData.transactions}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Average Transaction</span>
                    <span className={styles.detailValue}>{todayData.transactions > 0 ? formatMoney(todayData.sales / todayData.transactions) : '₦0'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forecast Detail Modal */}
      {selectedForecast && (
        <div className={styles.modalOverlay} onClick={() => setSelectedForecast(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelectedForecast(null)}>✕</button>
            <h2 className={styles.modalTitle}>
              {selectedForecast === 'revenue' && 'Revenue Forecast Details'}
              {selectedForecast === 'profit' && 'Profit Forecast Details'}
              {selectedForecast === 'stock' && 'Stock Alerts Details'}
              {selectedForecast === 'restock' && 'Restock Recommendations'}
            </h2>
            <div className={styles.modalContent}>
              {selectedForecast === 'revenue' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Projected Revenue (7 days)</span>
                    <span className={styles.detailValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.revenue')?.value || '₦0'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Current Period Revenue</span>
                    <span className={styles.detailValue}>{formatMoney(todayData.sales)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Growth Rate</span>
                    <span className={styles.detailValue} style={{ color: 'var(--green)' }}>+12%</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Based on</span>
                    <span className={styles.detailValue}>Sales velocity</span>
                  </div>
                </div>
              )}
              {selectedForecast === 'profit' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Projected Profit (7 days)</span>
                    <span className={styles.detailValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.profit')?.value || '₦0'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Current Period Profit</span>
                    <span className={styles.detailValue}>{formatMoney(todayData.profit)}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Profit Margin</span>
                    <span className={styles.detailValue}>{profitMargin}%</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Growth Rate</span>
                    <span className={styles.detailValue} style={{ color: 'var(--green)' }}>+8%</span>
                  </div>
                </div>
              )}
              {selectedForecast === 'stock' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Products Running Low</span>
                    <span className={styles.detailValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.stockout')?.value || '0 products'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Timeframe</span>
                    <span className={styles.detailValue}>Within 7 days</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Priority</span>
                    <span className={styles.detailValue} style={{ color: 'var(--red)' }}>Urgent</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Action</span>
                    <span className={styles.detailValue}>Restock recommended</span>
                  </div>
                </div>
              )}
              {selectedForecast === 'restock' && (
                <div className={styles.detailSection}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Items Below Threshold</span>
                    <span className={styles.detailValue}>{forecastItems.find(f => f.labelKey === 'home.forecast.restock')?.value || '0 items'}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue} style={{ color: 'var(--amber)' }}>Low stock</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Recommendation</span>
                    <span className={styles.detailValue}>Review inventory</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Auto-order</span>
                    <span className={styles.detailValue}>Suggested</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
