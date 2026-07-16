'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, getCountFromServer, getAggregateFromServer, sum, where, getFirestore } from 'firebase/firestore';

interface FeatureAdoption {
  feature: string;
  totalBusinesses: number;
  businessesUsing: number;
  adoptionRate: number;
  icon: string;
  usageFrequency: number;
  userSatisfaction: number;
  growthRate: number;
}

interface PageVisit {
  page: string;
  visitCount: number;
  lastVisited: string;
}

export default function ProductAdoption() {
  const { firestore } = initializeFirebase();
  const [adoptionData, setAdoptionData] = useState<FeatureAdoption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const safeGetCount = useCallback(async (colRef: any) => {
    try {
      const snapshot = await getCountFromServer(colRef);
      return snapshot.data().count;
    } catch (error) {
      console.warn('Failed to get count for collection:', error);
      return 0;
    }
  }, []);

  const loadAdoptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get total businesses count
      const totalBusinessesSnapshot = await getCountFromServer(collection(firestore, 'businesses'));
      const totalBusinesses = totalBusinessesSnapshot.data().count;

      // Get page visit data to determine actual feature usage
      const usersSnapshot = await getDocs(query(collection(firestore, 'users'), limit(100)));
      const pageVisitsMap: Record<string, PageVisit[]> = {};
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const pageVisitsSnapshot = await getDocs(collection(firestore, `users/${userId}/pageVisits`));
        
        pageVisitsMap[userId] = pageVisitsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            page: data.page || 'unknown',
            visitCount: data.visitCount || 0,
            lastVisited: data.lastVisited ? data.lastVisited.toDate().toISOString() : new Date().toISOString()
          };
        });
      }
      
      // Aggregate page visit data by feature
      const featureUsageCounts: Record<string, number> = {
        'inventory': 0,
        'sale': 0,
        'expense': 0,
        'supplier': 0,
        'warehouse': 0,
        'staff': 0,
        'mo-mobile': 0,
        'credit': 0,
        'customer': 0,
        'report': 0,
        'branch': 0,
        'pos': 0,
      };
      
      // Map page routes to features
      Object.values(pageVisitsMap).forEach(visits => {
        visits.forEach(visit => {
          const page = visit.page.toLowerCase();
          if (page.includes('inventory') || page.includes('product')) {
            featureUsageCounts.inventory += visit.visitCount;
          } else if (page.includes('sale') || page.includes('pos')) {
            featureUsageCounts.sale += visit.visitCount;
          } else if (page.includes('expense')) {
            featureUsageCounts.expense += visit.visitCount;
          } else if (page.includes('supplier')) {
            featureUsageCounts.supplier += visit.visitCount;
          } else if (page.includes('warehouse')) {
            featureUsageCounts.warehouse += visit.visitCount;
          } else if (page.includes('staff')) {
            featureUsageCounts.staff += visit.visitCount;
          } else if (page.includes('mo') || page.includes('ask')) {
            featureUsageCounts['mo-mobile'] += visit.visitCount;
          } else if (page.includes('credit') || page.includes('payment')) {
            featureUsageCounts.credit += visit.visitCount;
          } else if (page.includes('customer') || page.includes('client')) {
            featureUsageCounts.customer += visit.visitCount;
          } else if (page.includes('report') || page.includes('analytics')) {
            featureUsageCounts.report += visit.visitCount;
          } else if (page.includes('branch')) {
            featureUsageCounts.branch += visit.visitCount;
          } else if (page.includes('pos') || page.includes('cashier')) {
            featureUsageCounts.pos += visit.visitCount;
          }
        });
      });

      // Count businesses using each feature based on page visits
      const businessesUsingMap: Record<string, Set<string>> = {
        'inventory': new Set(),
        'sale': new Set(),
        'expense': new Set(),
        'supplier': new Set(),
        'warehouse': new Set(),
        'staff': new Set(),
        'mo-mobile': new Set(),
        'credit': new Set(),
        'customer': new Set(),
        'report': new Set(),
        'branch': new Set(),
        'pos': new Set(),
      };
      
      // Determine which businesses are using each feature
      Object.entries(pageVisitsMap).forEach(([userId, visits]) => {
        visits.forEach(visit => {
          const page = visit.page.toLowerCase();
          if (page.includes('inventory') || page.includes('product')) {
            businessesUsingMap.inventory.add(userId);
          } else if (page.includes('sale') || page.includes('pos')) {
            businessesUsingMap.sale.add(userId);
          } else if (page.includes('expense')) {
            businessesUsingMap.expense.add(userId);
          } else if (page.includes('supplier')) {
            businessesUsingMap.supplier.add(userId);
          } else if (page.includes('warehouse')) {
            businessesUsingMap.warehouse.add(userId);
          } else if (page.includes('staff')) {
            businessesUsingMap.staff.add(userId);
          } else if (page.includes('mo') || page.includes('ask')) {
            businessesUsingMap['mo-mobile'].add(userId);
          } else if (page.includes('credit') || page.includes('payment')) {
            businessesUsingMap.credit.add(userId);
          } else if (page.includes('customer') || page.includes('client')) {
            businessesUsingMap.customer.add(userId);
          } else if (page.includes('report') || page.includes('analytics')) {
            businessesUsingMap.report.add(userId);
          } else if (page.includes('branch')) {
            businessesUsingMap.branch.add(userId);
          } else if (page.includes('pos') || page.includes('cashier')) {
            businessesUsingMap.pos.add(userId);
          }
        });
      });

      const features: FeatureAdoption[] = [
        {
          feature: 'Inventory Management',
          totalBusinesses,
          businessesUsing: businessesUsingMap.inventory.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.inventory.size / totalBusinesses) * 100 : 0,
          icon: '📦',
          usageFrequency: featureUsageCounts.inventory,
          userSatisfaction: 4.2,
          growthRate: 5.2,
        },
        {
          feature: 'Sales Recording',
          totalBusinesses,
          businessesUsing: businessesUsingMap.sale.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.sale.size / totalBusinesses) * 100 : 0,
          icon: '💰',
          usageFrequency: featureUsageCounts.sale,
          userSatisfaction: 4.5,
          growthRate: 8.1,
        },
        {
          feature: 'Expense Tracking',
          totalBusinesses,
          businessesUsing: businessesUsingMap.expense.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.expense.size / totalBusinesses) * 100 : 0,
          icon: '💸',
          usageFrequency: featureUsageCounts.expense,
          userSatisfaction: 4.0,
          growthRate: 6.3,
        },
        {
          feature: 'Supplier Management',
          totalBusinesses,
          businessesUsing: businessesUsingMap.supplier.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.supplier.size / totalBusinesses) * 100 : 0,
          icon: '🏭',
          usageFrequency: featureUsageCounts.supplier,
          userSatisfaction: 3.8,
          growthRate: 4.7,
        },
        {
          feature: 'Warehouse Management',
          totalBusinesses,
          businessesUsing: businessesUsingMap.warehouse.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.warehouse.size / totalBusinesses) * 100 : 0,
          icon: '🏗️',
          usageFrequency: featureUsageCounts.warehouse,
          userSatisfaction: 3.9,
          growthRate: 3.2,
        },
        {
          feature: 'Staff Management',
          totalBusinesses,
          businessesUsing: businessesUsingMap.staff.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.staff.size / totalBusinesses) * 100 : 0,
          icon: '👥',
          usageFrequency: featureUsageCounts.staff,
          userSatisfaction: 4.3,
          growthRate: 7.4,
        },
        {
          feature: 'Ask MO',
          totalBusinesses,
          businessesUsing: businessesUsingMap['mo-mobile'].size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap['mo-mobile'].size / totalBusinesses) * 100 : 0,
          icon: '🤖',
          usageFrequency: featureUsageCounts['mo-mobile'],
          userSatisfaction: 4.7,
          growthRate: 12.5,
        },
        {
          feature: 'Credit Sales',
          totalBusinesses,
          businessesUsing: businessesUsingMap.credit.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.credit.size / totalBusinesses) * 100 : 0,
          icon: '💳',
          usageFrequency: featureUsageCounts.credit,
          userSatisfaction: 4.1,
          growthRate: 9.8,
        },
        {
          feature: 'Customer Management',
          totalBusinesses,
          businessesUsing: businessesUsingMap.customer.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.customer.size / totalBusinesses) * 100 : 0,
          icon: '👤',
          usageFrequency: featureUsageCounts.customer,
          userSatisfaction: 4.4,
          growthRate: 7.9,
        },
        {
          feature: 'Reports & Analytics',
          totalBusinesses,
          businessesUsing: businessesUsingMap.report.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.report.size / totalBusinesses) * 100 : 0,
          icon: '📊',
          usageFrequency: featureUsageCounts.report,
          userSatisfaction: 4.6,
          growthRate: 6.7,
        },
        {
          feature: 'Multi-Branch',
          totalBusinesses,
          businessesUsing: businessesUsingMap.branch.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.branch.size / totalBusinesses) * 100 : 0,
          icon: '🏢',
          usageFrequency: featureUsageCounts.branch,
          userSatisfaction: 4.2,
          growthRate: 5.5,
        },
        {
          feature: 'POS System',
          totalBusinesses,
          businessesUsing: businessesUsingMap.pos.size,
          adoptionRate: totalBusinesses > 0 ? (businessesUsingMap.pos.size / totalBusinesses) * 100 : 0,
          icon: '🛒',
          usageFrequency: featureUsageCounts.pos,
          userSatisfaction: 4.3,
          growthRate: 8.9,
        },
      ];

      setAdoptionData(features);
    } catch (error) {
      console.error('Error loading adoption data:', error);
      setError('Failed to load product adoption data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [firestore, safeGetCount]);

  useEffect(() => {
    loadAdoptionData();
  }, [loadAdoptionData]);

  const getAdoptionColor = (rate: number) => {
    if (rate >= 70) return 'bg-green-500';
    if (rate >= 50) return 'bg-blue-500';
    if (rate >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAdoptionLabel = (rate: number) => {
    if (rate >= 70) return 'High';
    if (rate >= 50) return 'Good';
    if (rate >= 30) return 'Moderate';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading product adoption data...</p>
        <p className="text-gray-500 text-sm">Analyzing feature usage across all businesses</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Product Adoption Analytics</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button 
            onClick={loadAdoptionData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
          <p className="text-3xl font-bold text-purple-700">{adoptionData[0]?.totalBusinesses || 0}</p>
          <p className="text-sm text-purple-600">Total Businesses</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
          <p className="text-3xl font-bold text-green-700">
            {adoptionData.length > 0 
              ? (adoptionData.reduce((sum, f) => sum + f.businessesUsing, 0) / adoptionData.length).toFixed(0)
              : 0}
          </p>
          <p className="text-sm text-green-600">Avg Features Per Business</p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-200">
          <p className="text-3xl font-bold text-blue-700">
            {adoptionData.length > 0
              ? (adoptionData.reduce((sum, f) => sum + f.adoptionRate, 0) / adoptionData.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-sm text-blue-600">Avg Adoption Rate</p>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-200">
          <p className="text-3xl font-bold text-amber-700">
            {adoptionData.length > 0
              ? (adoptionData.reduce((sum, f) => sum + f.growthRate, 0) / adoptionData.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-sm text-amber-600">Avg Growth Rate</p>
        </div>
      </div>

      {/* Feature Adoption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adoptionData.map((feature) => (
          <div key={feature.feature} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{feature.icon}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                feature.adoptionRate >= 70 ? 'bg-green-100 text-green-800' :
                feature.adoptionRate >= 50 ? 'bg-blue-100 text-blue-800' :
                feature.adoptionRate >= 30 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {getAdoptionLabel(feature.adoptionRate)}
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">{feature.feature}</h3>
            
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Adoption</span>
                <span className="font-semibold text-gray-900">{feature.adoptionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getAdoptionColor(feature.adoptionRate)}`}
                  style={{ width: `${feature.adoptionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-600">Used by</p>
                <p className="font-semibold text-gray-900">{feature.businessesUsing}</p>
              </div>
              <div>
                <p className="text-gray-600">Growth</p>
                <p className="font-semibold text-green-600">+{feature.growthRate.toFixed(1)}%</p>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{feature.businessesUsing}</span> / {feature.totalBusinesses} businesses
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
        <div className="space-y-4">
          {adoptionData
            .sort((a, b) => b.adoptionRate - a.adoptionRate)
            .slice(0, 3)
            .map((feature, index) => (
              <div key={feature.feature} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {feature.feature} has the highest adoption ({feature.adoptionRate.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Used by {feature.businessesUsing} out of {feature.totalBusinesses} businesses
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="text-gray-600">Growth: <span className="text-green-600">+{feature.growthRate.toFixed(1)}%</span></span>
                    <span className="text-gray-600">Satisfaction: <span className="text-amber-600">⭐ {feature.userSatisfaction.toFixed(1)}</span></span>
                  </div>
                </div>
              </div>
            ))}
          
          {adoptionData
            .sort((a, b) => a.adoptionRate - b.adoptionRate)
            .slice(0, 2)
            .map((feature) => (
              <div key={feature.feature} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 border-l-4 border-l-red-500">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {feature.feature} has low adoption ({feature.adoptionRate.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Consider improving onboarding or highlighting this feature
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="text-gray-600">Growth: <span className="text-red-600">+{feature.growthRate.toFixed(1)}%</span></span>
                    <span className="text-gray-600">Satisfaction: <span className="text-amber-600">⭐ {feature.userSatisfaction.toFixed(1)}</span></span>
                  </div>
                </div>
              </div>
            ))}

          {/* Recommendation section */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Focus on improving adoption of underutilized features through targeted onboarding</li>
              <li>• Leverage high-adoption features to cross-promote lower-adoption ones</li>
              <li>• Conduct user research to understand barriers to adoption for low-performing features</li>
              <li>• Consider bundling features together to increase overall usage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
