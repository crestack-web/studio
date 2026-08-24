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
import { LANGUAGES } from './translations';
import { subscribeToActionEvents } from '@/utils/dataRefresh';
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
  // Period-scoped metrics for Business Health (changes with daily/weekly/monthly)
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalExpenses: 0,
    cashBalance: 0,
    transactions: 0,
  });
  // Always calendar-day data for Daily Check — independent of selectedPeriod
  const [dailyCheck, setDailyCheck] = useState({
    sales: 0,
    profit: 0,
    transactions: 0,
  });
  const [dailyLoading, setDailyLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [topProduct, setTopProduct] = useState<any>(null);
  const [forecastItems, setForecastItems] = useState<any[]>([]);
  const [yesterdaySales, setYesterdaySales] = useState(0);
  const [pendingCollections, setPendingCollections] = useState(0);
  const [selectedForecast, setSelectedForecast] = useState<string | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [cashRunway, setCashRunway] = useState<number>(0);

  // Fetch real data on mount
  useEffect(() => {
    fetchData();
  }, [selectedPeriod, user.id, firestore]);

  // Add effect to listen for data refresh events triggered by MO
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      console.log('🔄 [HomePage] Received data refresh event:', event.detail);
      // Refresh data after a short delay to allow backend to process the changes
      setTimeout(() => {
        fetchData();
      }, 1000); // 1 second delay to allow backend to process
    };

    // Subscribe to action events
    subscribeToActionEvents(handleDataRefresh);
    
    // Clean up subscription on unmount
    return () => {
      // In a real implementation, we would have an unsubscribe function
      // For now, we'll just log that cleanup happened
      console.log('🧹 [HomePage] Unsubscribing from data refresh events');
    };
  }, [user.id, firestore, selectedPeriod]);

  async function fetchData() {
    try {
      setLoading(true);

        // Check if firestore is available
        if (!firestore) {
          console.warn('Firestore not initialized, using empty state');
          setLoading(false);
          setDailyLoading(false);
          return;
        }

        // Check if user ID is available
        if (!user.id) {
          console.warn('User not loaded yet, using empty state');
          setLoading(false);
          setDailyLoading(false);
          return;
        }

        // Get user's business ID from Firestore
        const userDocRef = doc(firestore, 'users', user.id);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.warn('User document not found');
          setLoading(false);
          setDailyLoading(false);
          return;
        }

        const userData = userDoc.data();
        const businessId = userData.businessId;

        if (!businessId) {
          console.warn('No business ID found for user');
          setLoading(false);
          setDailyLoading(false);
          return;
        }

        // Helpers
        const saleProfit = (data: any) => {
          let docProfit = 0;
          if (data.products && Array.isArray(data.products)) {
            docProfit = data.products.reduce((sum: number, p: any) => {
              const price = p.price || 0;
              const costPrice = p.costPrice || p.cost || 0;
              const quantity = p.quantity || 1;
              return sum + ((price - costPrice) * quantity);
            }, 0);
          }
          if (data.discount) docProfit -= data.discount;
          return docProfit;
        };

        // ── Daily Check (always calendar today + yesterday) — independent of selectedPeriod
        // Single range query (no composite index): from yesterday 00:00, split client-side.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const todayStartMs = todayStart.getTime();

        const saleTimestampMs = (data: any): number => {
          const c = data?.createdAt;
          if (!c) return 0;
          if (typeof c.toDate === 'function') return c.toDate().getTime();
          if (typeof c.toMillis === 'function') return c.toMillis();
          if (typeof c === 'number') return c;
          if (typeof c === 'string' || c instanceof Date) return new Date(c).getTime();
          if (typeof c.seconds === 'number') return c.seconds * 1000;
          return 0;
        };

        try {
          const recentSnap = await getDocs(
            query(
              collection(firestore, 'businesses', businessId, 'sales'),
              where('createdAt', '>=', Timestamp.fromDate(yesterdayStart))
            )
          );

          let daySales = 0, dayProfit = 0, dayTx = 0;
          let yesterdayTotal = 0;

          recentSnap.forEach((d) => {
            const data = d.data();
            const ms = saleTimestampMs(data);
            const revenue = Number(data.totalRevenue ?? data.total ?? 0) || 0;
            if (ms >= todayStartMs) {
              daySales += revenue;
              dayProfit += saleProfit(data);
              dayTx += 1;
            } else if (ms >= yesterdayStart.getTime()) {
              yesterdayTotal += revenue;
            }
          });

          setDailyCheck({ sales: daySales, profit: dayProfit, transactions: dayTx });
          setYesterdaySales(yesterdayTotal);
        } catch (dailyErr) {
          console.error('Daily Check fetch failed:', dailyErr);
          // Keep last known dailyCheck values; still unblock UI
        } finally {
          setDailyLoading(false);
        }

        // ── Business Health period range (daily / weekly / monthly)
        let startDate: Date;
        if (selectedPeriod === 'weekly') {
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
        } else if (selectedPeriod === 'monthly') {
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
        } else {
          startDate = new Date(todayStart);
        }

        // Fetch sales for the selected period
        const salesQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          where('createdAt', '>=', Timestamp.fromDate(startDate))
        );

        const salesSnapshot = await getDocs(salesQuery);
        let sales = 0, profit = 0, transactions = 0;
        let pendingTotal = 0;
        const productRevenue = new Map<string, { name: string; revenue: number; quantity: number }>();

        salesSnapshot.forEach(doc => {
          const data = doc.data();
          sales += data.totalRevenue || data.total || 0;
          profit += saleProfit(data);
          transactions += 1;

          if (data.paymentBreakdown && Array.isArray(data.paymentBreakdown)) {
            data.paymentBreakdown.forEach((pb: any) => {
              if (pb.method === 'credit' && !pb.received) {
                pendingTotal += pb.amount || 0;
              }
            });
          }

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
        setPendingCollections(pendingTotal);

        // Get top product
        const topProductData = Array.from(productRevenue.values())
          .sort((a, b) => b.revenue - a.revenue)[0];
        setTopProduct(topProductData || null);

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
          transactions,
        });

        // Calculate improved cash runway
        const improvedCashRunway = await calculateCashRunway(businessId, firestore);
        setCashRunway(improvedCashRunway);

        // Calculate and set forecast data
        const forecastData = calculateForecast(allProducts, sales, profit);
        setForecastItems(forecastData);

      } catch (error) {
        console.error('Error fetching data:', error);
        // Keep empty state as fallback
        setDailyCheck({ sales: 0, profit: 0, transactions: 0 });
        setMetrics({ totalRevenue: 0, totalProfit: 0, totalExpenses: 0, cashBalance: 0, transactions: 0 });
      } finally {
        setLoading(false);
        setDailyLoading(false);
      }
  }

  // Calculate profit margin
  const profitMarginValue = metrics.totalRevenue > 0
    ? (metrics.totalProfit / metrics.totalRevenue) * 100
    : 0;
  const profitMargin = profitMarginValue.toFixed(1);

  // Calculate cash runway - improved accuracy
  // Use actual bank balances and calculate average monthly burn from historical data
  const calculateCashRunway = async (businessId: string, firestore: any) => {
    try {
      // Fetch bank accounts for actual cash balance
      const bankAccountsQuery = query(
        collection(firestore, 'businesses', businessId, 'bankAccounts')
      );
      const bankAccountsSnapshot = await getDocs(bankAccountsQuery);
      let actualCashBalance = 0;
      bankAccountsSnapshot.forEach(doc => {
        const data = doc.data();
        actualCashBalance += data.balance || 0;
      });

      // If no bank accounts, fall back to calculated balance
      if (actualCashBalance === 0) {
        actualCashBalance = metrics.cashBalance;
      }

      // Fetch expenses from last 90 days for more accurate burn rate
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const expensesQuery = query(
        collection(firestore, 'businesses', businessId, 'expenses'),
        where('createdAt', '>=', Timestamp.fromDate(ninetyDaysAgo))
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      let totalExpenses90Days = 0;
      expensesSnapshot.forEach(doc => {
        const data = doc.data();
        totalExpenses90Days += data.amount || 0;
      });

      // Fetch sales from last 90 days for revenue inflow
      const salesQuery = query(
        collection(firestore, 'businesses', businessId, 'sales'),
        where('createdAt', '>=', Timestamp.fromDate(ninetyDaysAgo))
      );
      const salesSnapshot = await getDocs(salesQuery);
      let totalRevenue90Days = 0;
      let totalCashCollected90Days = 0;
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        const totalRevenue = data.totalRevenue || data.total || 0;
        totalRevenue90Days += totalRevenue;
        
        // Calculate actual cash collected (excluding credit sales)
        if (data.paymentBreakdown && Array.isArray(data.paymentBreakdown)) {
          const cashPayment = data.paymentBreakdown
            .filter((p: any) => p.method === 'cash' || p.method === 'transfer' || p.method === 'card')
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          totalCashCollected90Days += cashPayment;
        } else {
          totalCashCollected90Days += totalRevenue;
        }
      });

      // Calculate monthly averages
      const monthlyExpenses = totalExpenses90Days / 3;
      const monthlyCashInflow = totalCashCollected90Days / 3;

      // Calculate net burn rate (expenses - revenue)
      // If revenue exceeds expenses, business is profitable (positive runway)
      const netBurnRate = monthlyExpenses - monthlyCashInflow;

      let calculatedRunway: number;
      if (netBurnRate > 0 && actualCashBalance > 0) {
        // Business is burning cash - calculate days until zero
        calculatedRunway = Math.round(actualCashBalance / (netBurnRate / 30)); // Daily net burn
      } else if (netBurnRate <= 0 && actualCashBalance > 0) {
        // Business is profitable or breaking even - unlimited runway
        calculatedRunway = 999;
      } else if (actualCashBalance <= 0) {
        // No cash - zero runway
        calculatedRunway = 0;
      } else if (totalExpenses90Days === 0 && totalRevenue90Days === 0) {
        // New user with no data
        calculatedRunway = 0;
      } else {
        // Fallback to simple calculation
        const dailyBurn = metrics.totalExpenses / 30;
        calculatedRunway = dailyBurn > 0 ? Math.round(actualCashBalance / dailyBurn) : 999;
      }

      return calculatedRunway;
    } catch (error) {
      console.error('Error calculating cash runway:', error);
      // Fallback to simple calculation
      const dailyBurn = metrics.totalExpenses / 30;
      return dailyBurn > 0 && metrics.cashBalance > 0
        ? Math.round(metrics.cashBalance / dailyBurn)
        : metrics.totalExpenses === 0 && metrics.totalRevenue === 0
          ? 0
          : metrics.cashBalance <= 0
            ? 0
            : 999;
    }
  };

  // Format metrics for display
  const dailyBurn = metrics.totalExpenses / 30;
  const displayMetrics = [
    { label: t('home.totalSales'), value: formatMoney(metrics.totalRevenue), trend: `+${metrics.transactions} txns`, trendType: 'up' as const },
    { label: t('home.netProfit'), value: formatMoney(metrics.totalProfit), trend: `${profitMargin}% margin`, trendType: (profitMarginValue >= 25 ? 'up' : 'down') as 'up' | 'down' | 'neutral' },
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
    const langMeta = LANGUAGES.find(l => l.code === lang);
    
    // Get business category (non-async for this simple implementation)
    let businessCategory = 'retail';
    // Note: For a more robust implementation, this should be loaded from user context or state
    
    fetch('/api/ask-mo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: reply,
        businessId: user?.businessId || user?.id || 'demo',
        userId: user?.id || 'demo',
        language: lang,
        languageName: langMeta?.englishName || 'English',
        businessCategory: businessCategory,
        userRole: user?.role,
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


        {/* Welcome */}
        <div className={styles.welcomeBanner}>
          <h1 className={styles.welcomeTitle}>
            {t('topbar.greeting')}, {user.shortName || 'there'} 👋
          </h1>
          <p className={styles.welcomeDate}>
            {new Date().toLocaleDateString('en-NG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

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
          <a
            href="https://mo-sell.store/ugc-creators"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'block', padding: '16px', borderRadius: '8px', margin: '8px', border: '1px solid var(--border)', transition: 'all 0.2s', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#8B5CF620', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" width="18" height="18">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)' }}>UGC Content Creation</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
              Get authentic UGC videos and photos from real creators to promote your products.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>From ₦5,000</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-3)' }}>48-72 hrs</span>
            </div>
          </a>
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
        {/* Daily Business Check — always calendar day; independent of Business Health period */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--purple-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth={2}>
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </CardIcon>
            <div className={styles.dailyCheckHeader}>
              <span>Daily Check</span>
              <span className={styles.dailyCheckBadge}>Today only</span>
            </div>
          </CardHeader>
          {dailyLoading ? (
            <div className={styles.dailyCheckBody}>
              <div className={styles.dailyCheckSkeleton} />
              <div className={styles.dailyCheckGrid}>
                <div className={styles.dailyCheckSkeletonSm} />
                <div className={styles.dailyCheckSkeletonSm} />
                <div className={styles.dailyCheckSkeletonSm} />
                <div className={styles.dailyCheckSkeletonSm} />
              </div>
            </div>
          ) : (
            <div className={styles.dailyCheckBody}>
              {(() => {
                const vsPct =
                  yesterdaySales > 0
                    ? Math.round(((dailyCheck.sales - yesterdaySales) / yesterdaySales) * 100)
                    : null;
                const beating = vsPct !== null && vsPct >= 0;
                const alertCount = lowStockProducts.length + (pendingCollections > 0 ? 1 : 0);
                return (
                  <>
                    <div className={styles.dailyHero}>
                      <div className={styles.dailyHeroIcon} aria-hidden>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" width="22" height="22">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                      </div>
                      <div className={styles.dailyHeroMain}>
                        <div className={styles.dailyHeroLabel}>Revenue today</div>
                        <div className={styles.dailyHeroValue}>{formatMoney(dailyCheck.sales)}</div>
                        {yesterdaySales > 0 && (
                          <div className={styles.dailyProgressTrack} aria-hidden>
                            <div
                              className={styles.dailyProgressFill}
                              style={{
                                width: `${Math.min(100, Math.round((dailyCheck.sales / Math.max(yesterdaySales, 1)) * 100))}%`,
                                background: beating ? 'var(--green)' : 'var(--red)',
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className={styles.dailyHeroCompare}>
                        <div
                          className={`${styles.dailyComparePct} ${
                            vsPct === null ? '' : beating ? styles.dailyUp : styles.dailyDown
                          }`}
                        >
                          {vsPct === null ? '—' : `${beating ? '↑' : '↓'} ${Math.abs(vsPct)}%`}
                        </div>
                        <div className={styles.dailyCompareLabel}>vs yesterday</div>
                        {yesterdaySales > 0 && (
                          <div className={styles.dailyCompareYest}>{formatMoney(yesterdaySales)}</div>
                        )}
                      </div>
                    </div>

                    <div className={styles.dailyCheckGrid}>
                      <div className={styles.dailyStat}>
                        <div className={styles.dailyStatLabel}>Profit</div>
                        <div
                          className={styles.dailyStatValue}
                          style={{ color: dailyCheck.profit >= 0 ? 'var(--green)' : 'var(--red)' }}
                        >
                          {formatMoney(dailyCheck.profit)}
                        </div>
                      </div>
                      <div className={styles.dailyStat}>
                        <div className={styles.dailyStatLabel}>Cash</div>
                        <div className={styles.dailyStatValue}>{formatMoney(metrics.cashBalance)}</div>
                      </div>
                      <div className={styles.dailyStat}>
                        <div className={styles.dailyStatLabel}>Sales</div>
                        <div className={styles.dailyStatValue}>{dailyCheck.transactions}</div>
                      </div>
                      <div
                        className={`${styles.dailyStat} ${alertCount > 0 ? styles.dailyStatAlert : styles.dailyStatOk}`}
                        role={alertCount > 0 ? 'button' : undefined}
                        tabIndex={alertCount > 0 ? 0 : undefined}
                        onClick={() => {
                          if (alertCount > 0) navigateTo('inventory');
                        }}
                        onKeyDown={(e) => {
                          if (alertCount > 0 && (e.key === 'Enter' || e.key === ' ')) navigateTo('inventory');
                        }}
                      >
                        <div className={styles.dailyStatLabel}>Alerts</div>
                        <div className={styles.dailyStatValue}>
                          {alertCount > 0 ? `${alertCount} open` : 'All clear'}
                        </div>
                      </div>
                    </div>

                    <button type="button" className={styles.dailyMoTip} onClick={toggleAIPanel}>
                      <MoIcon size={12} />
                      <span>
                        {dailyCheck.transactions === 0
                          ? 'No sales yet today — ask MO for tips to boost traffic.'
                          : dailyCheck.sales > yesterdaySales && yesterdaySales > 0
                            ? `Beating yesterday by ${formatMoney(dailyCheck.sales - yesterdaySales)}. Keep it up.`
                            : dailyCheck.sales > 0
                              ? `${formatMoney(dailyCheck.sales)} today — ask MO about your top products.`
                              : 'Ask MO anything about today’s performance.'}
                      </span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </Card>

        {/* Smart Forecasts */}
        <Card>
          <CardHeader>
            <CardIcon bg="var(--blue-bg)">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </CardIcon>
            Smart Insights
          </CardHeader>
          <div className={styles.forecastList}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>
                {t('home.loading')}...
              </div>
            ) : (
              <>
                {/* Cash Runway - Most Critical */}
                <div className={styles.forecastItemMinimal} style={{ cursor: 'pointer' }}>
                  <div className={styles.forecastIcon} style={{ background: cashRunway >= 30 ? 'var(--green-bg)' : cashRunway >= 14 ? 'var(--amber-bg)' : 'var(--red-bg)', color: cashRunway >= 30 ? 'var(--green)' : cashRunway >= 14 ? 'var(--amber)' : 'var(--red)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                  </div>
                  <div className={styles.forecastInfo}>
                    <div className={styles.forecastLabel}>Cash Runway</div>
                    <div className={styles.forecastValue}>{cashRunway >= 999 ? '∞ days' : `${cashRunway} days`}</div>
                  </div>
                </div>

                {/* Top Product - What's Working */}
                {topProduct && (
                  <div className={styles.forecastItemMinimal} style={{ cursor: 'pointer' }}>
                    <div className={styles.forecastIcon} style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                    <div className={styles.forecastInfo}>
                      <div className={styles.forecastLabel}>Top Seller</div>
                      <div className={styles.forecastValue}>{topProduct.name} ({topProduct.quantity} sold)</div>
                    </div>
                  </div>
                )}

                {/* Urgent Restock - Actionable */}
                {lowStockProducts.length > 0 && (
                  <div className={styles.forecastItemMinimal} onClick={() => navigateTo('inventory')} style={{ cursor: 'pointer' }}>
                    <div className={styles.forecastIcon} style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className={styles.forecastInfo}>
                      <div className={styles.forecastLabel}>Restock Urgent</div>
                      <div className={styles.forecastValue}>{lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2} width={16} height={16}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

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
                    <span className={styles.detailValue}>{formatMoney(dailyCheck.sales)}</span>
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
                    <span className={styles.detailValue}>{formatMoney(dailyCheck.profit)}</span>
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
  { labelKey: 'nav.reports', page: 'statement', primary: false,
    icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { labelKey: 'nav.moneyControl', page: 'money-control', primary: false,
    icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
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

