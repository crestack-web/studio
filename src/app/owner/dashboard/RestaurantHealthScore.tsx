'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { isRestaurantBusiness } from './utils/restaurantHelpers';

interface HealthScoreProps {
  businessId?: string;
}

interface HealthMetrics {
  profitability: {
    revenueGrowth: number;
    profitMargin: number;
  };
  inventory: {
    stockAvailability: number;
    reorderEfficiency: number;
  };
  expenses: {
    foodCostPercentage: number;
    operatingExpenseRatio: number;
  };
}

export function RestaurantHealthScore({ businessId: propBusinessId }: HealthScoreProps) {
  const { user } = useApp();
  const { formatMoney } = useCurrency();
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);

  const businessId = propBusinessId || user.businessId;

  useEffect(() => {
    async function loadData() {
      if (!businessId) return;

      try {
        // Check if restaurant
        const restaurant = await isRestaurantBusiness(businessId);
        setIsRestaurant(restaurant);

        if (!restaurant) {
          setLoading(false);
          return;
        }

        // Calculate health metrics
        const metrics = await calculateHealthMetrics(businessId);
        setHealthMetrics(metrics);
      } catch (error) {
        console.error('Error loading health metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [businessId]);

  async function calculateHealthMetrics(bid: string): Promise<HealthMetrics> {
    const { firestore } = initializeFirebase();

    // Fetch sales data (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentSalesQuery = query(
      collection(firestore, 'businesses', bid, 'sales'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const previousSalesQuery = query(
      collection(firestore, 'businesses', bid, 'sales'),
      where('createdAt', '>=', Timestamp.fromDate(sixtyDaysAgo)),
      where('createdAt', '<', Timestamp.fromDate(thirtyDaysAgo))
    );

    const [recentSnapshot, previousSnapshot] = await Promise.all([
      getDocs(recentSalesQuery),
      getDocs(previousSalesQuery)
    ]);

    let recentRevenue = 0;
    let recentProfit = 0;
    let previousRevenue = 0;

    recentSnapshot.forEach(doc => {
      const data = doc.data();
      recentRevenue += data.totalRevenue || data.total || 0;
      recentProfit += data.profit || 0;
    });

    previousSnapshot.forEach(doc => {
      const data = doc.data();
      previousRevenue += data.totalRevenue || data.total || 0;
    });

    // Profitability metrics
    const revenueGrowth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const profitMargin = recentRevenue > 0 ? (recentProfit / recentRevenue) * 100 : 0;

    // Inventory metrics
    const productsQuery = query(
      collection(firestore, 'businesses', bid, 'products'),
      where('active', '==', true)
    );
    const productsSnapshot = await getDocs(productsQuery);

    let totalProducts = 0;
    let outOfStock = 0;
    let ingredientsNeedingReorder = 0;

    productsSnapshot.forEach(doc => {
      const data = doc.data();
      totalProducts++;
      const stock = data.stock || 0;

      if (stock === 0) outOfStock++;

      if (data.productType === 'ingredient' && stock <= (data.reorderLevel || 10)) {
        ingredientsNeedingReorder++;
      }
    });

    const stockAvailability = totalProducts > 0 ? ((totalProducts - outOfStock) / totalProducts) * 100 : 100;
    const reorderEfficiency = totalProducts > 0 ? ((totalProducts - ingredientsNeedingReorder) / totalProducts) * 100 : 100;

    // Expense metrics
    const expensesQuery = query(
      collection(firestore, 'businesses', bid, 'expenses'),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const expensesSnapshot = await getDocs(expensesQuery);

    let totalExpenses = 0;
    expensesSnapshot.forEach(doc => {
      const data = doc.data();
      totalExpenses += data.amount || 0;
    });

    const foodCostPercentage = recentRevenue > 0 ? (recentProfit / recentRevenue) * 100 : 0;
    const operatingExpenseRatio = recentRevenue > 0 ? (totalExpenses / recentRevenue) * 100 : 0;

    return {
      profitability: {
        revenueGrowth,
        profitMargin,
      },
      inventory: {
        stockAvailability,
        reorderEfficiency,
      },
      expenses: {
        foodCostPercentage,
        operatingExpenseRatio,
      },
    };
  }

  if (!isRestaurant) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardIcon bg="var(--blue-bg)">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </CardIcon>
          Restaurant Metrics
        </CardHeader>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
          Loading metrics...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardIcon bg="var(--blue-bg)">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth={2}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </CardIcon>
        Restaurant Metrics
      </CardHeader>
      
      <div style={{ padding: '20px' }}>
        {/* Actual Data */}
        {healthMetrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Profitability */}
            <MetricCard
              title="Profitability"
              color="var(--green)"
              metrics={[
                { label: 'Revenue Growth', value: `${healthMetrics.profitability.revenueGrowth.toFixed(1)}%` },
                { label: 'Profit Margin', value: `${healthMetrics.profitability.profitMargin.toFixed(1)}%` },
              ]}
            />

            {/* Inventory */}
            <MetricCard
              title="Inventory"
              color="var(--blue)"
              metrics={[
                { label: 'Stock Availability', value: `${healthMetrics.inventory.stockAvailability.toFixed(0)}%` },
                { label: 'Reorder Efficiency', value: `${healthMetrics.inventory.reorderEfficiency.toFixed(0)}%` },
              ]}
            />

            {/* Expenses */}
            <MetricCard
              title="Expenses"
              color="var(--amber)"
              metrics={[
                { label: 'Food Cost %', value: `${healthMetrics.expenses.foodCostPercentage.toFixed(1)}%` },
                { label: 'Operating Ratio', value: `${healthMetrics.expenses.operatingExpenseRatio.toFixed(1)}%` },
              ]}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  color: string;
  metrics: { label: string; value: string }[];
}

function MetricCard({ title, color, metrics }: MetricCardProps) {
  return (
    <div style={{ 
      padding: '16px', 
      background: 'var(--surface)', 
      borderRadius: '8px',
      border: '1px solid var(--border)'
    }}>
      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-1)', marginBottom: '12px' }}>
        {title}
      </div>
      {metrics.map((metric, idx) => (
        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{metric.label}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color }}>{metric.value}</span>
        </div>
      ))}
    </div>
  );
}
