'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, getCountFromServer } from 'firebase/firestore';

interface FeatureAdoption {
  feature: string;
  totalBusinesses: number;
  businessesUsing: number;
  adoptionRate: number;
  icon: string;
}

export default function ProductAdoption() {
  const { firestore } = initializeFirebase();
  const [adoptionData, setAdoptionData] = useState<FeatureAdoption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdoptionData();
  }, [firestore]);

  const loadAdoptionData = async () => {
    try {
      setLoading(true);
      
      // Get total businesses count
      const totalBusinessesSnapshot = await getCountFromServer(collection(firestore, 'businesses'));
      const totalBusinesses = totalBusinessesSnapshot.data().count;

      const features: FeatureAdoption[] = [
        {
          feature: 'Inventory Management',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '📦',
        },
        {
          feature: 'Sales Recording',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '💰',
        },
        {
          feature: 'Expense Tracking',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '💸',
        },
        {
          feature: 'Supplier Management',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '🏭',
        },
        {
          feature: 'Warehouse Management',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '🏗️',
        },
        {
          feature: 'Staff Management',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '👥',
        },
        {
          feature: 'Ask MO',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '🤖',
        },
        {
          feature: 'Credit Sales',
          totalBusinesses,
          businessesUsing: 0,
          adoptionRate: 0,
          icon: '💳',
        },
      ];

      // Count businesses using each feature
      // Note: This is a simplified approach. In production, you'd want to track this more efficiently
      
      // For now, we'll check if businesses have certain collections or data
      const businessesListQuery = query(collection(firestore, 'businesses'), limit(100));
      const businessesListSnapshot = await getDocs(businessesListQuery);
      
      let inventoryCount = 0;
      let salesCount = 0;
      let expenseCount = 0;
      let supplierCount = 0;
      let warehouseCount = 0;
      let staffCount = 0;
      let askMoCount = 0;
      let creditCount = 0;

      for (const businessDoc of businessesListSnapshot.docs) {
        const businessId = businessDoc.id;
        
        // Check for products (inventory)
        const productsSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'products'));
        if (productsSnapshot.data().count > 0) inventoryCount++;
        
        // Check for sales
        const salesSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'sales'));
        if (salesSnapshot.data().count > 0) salesCount++;
        
        // Check for expenses
        const expensesSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'expenses'));
        if (expensesSnapshot.data().count > 0) expenseCount++;
        
        // Check for suppliers
        const suppliersSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'suppliers'));
        if (suppliersSnapshot.data().count > 0) supplierCount++;
        
        // Check for warehouses
        const warehousesSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'warehouses'));
        if (warehousesSnapshot.data().count > 0) warehouseCount++;
        
        // Check for staff
        const staffSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'staff'));
        if (staffSnapshot.data().count > 0) staffCount++;
        
        // Check for Ask MO conversations
        const askMoSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'askMoConversations'));
        if (askMoSnapshot.data().count > 0) askMoCount++;
        
        // Check for credit sales
        const creditSnapshot = await getCountFromServer(collection(firestore, 'businesses', businessId, 'creditSales'));
        if (creditSnapshot.data().count > 0) creditCount++;
      }

      // Update adoption data
      features[0].businessesUsing = inventoryCount;
      features[0].adoptionRate = totalBusinesses > 0 ? (inventoryCount / totalBusinesses) * 100 : 0;
      
      features[1].businessesUsing = salesCount;
      features[1].adoptionRate = totalBusinesses > 0 ? (salesCount / totalBusinesses) * 100 : 0;
      
      features[2].businessesUsing = expenseCount;
      features[2].adoptionRate = totalBusinesses > 0 ? (expenseCount / totalBusinesses) * 100 : 0;
      
      features[3].businessesUsing = supplierCount;
      features[3].adoptionRate = totalBusinesses > 0 ? (supplierCount / totalBusinesses) * 100 : 0;
      
      features[4].businessesUsing = warehouseCount;
      features[4].adoptionRate = totalBusinesses > 0 ? (warehouseCount / totalBusinesses) * 100 : 0;
      
      features[5].businessesUsing = staffCount;
      features[5].adoptionRate = totalBusinesses > 0 ? (staffCount / totalBusinesses) * 100 : 0;
      
      features[6].businessesUsing = askMoCount;
      features[6].adoptionRate = totalBusinesses > 0 ? (askMoCount / totalBusinesses) * 100 : 0;
      
      features[7].businessesUsing = creditCount;
      features[7].adoptionRate = totalBusinesses > 0 ? (creditCount / totalBusinesses) * 100 : 0;

      setAdoptionData(features);
    } catch (error) {
      console.error('Error loading adoption data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Adoption Analytics</h2>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <p className="text-3xl font-bold text-purple-700">{adoptionData[0]?.totalBusinesses || 0}</p>
          <p className="text-sm text-purple-600">Total Businesses</p>
        </div>
        <div className="bg-green-50 rounded-xl p-6 border border-green-200">
          <p className="text-3xl font-bold text-green-700">
            {adoptionData.length > 0 
              ? (adoptionData.reduce((sum, f) => sum + f.businessesUsing, 0) / adoptionData.length).toFixed(0)
              : 0}
          </p>
          <p className="text-sm text-green-600">Avg Features Per Business</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <p className="text-3xl font-bold text-blue-700">
            {adoptionData.length > 0
              ? (adoptionData.reduce((sum, f) => sum + f.adoptionRate, 0) / adoptionData.length).toFixed(1)
              : 0}%
          </p>
          <p className="text-sm text-blue-600">Avg Adoption Rate</p>
        </div>
      </div>

      {/* Feature Adoption Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adoptionData.map((feature) => (
          <div key={feature.feature} className="bg-white rounded-xl border border-gray-200 p-6">
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

            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{feature.businessesUsing}</span> / {feature.totalBusinesses} businesses
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-3">
          {adoptionData
            .sort((a, b) => b.adoptionRate - a.adoptionRate)
            .slice(0, 3)
            .map((feature, index) => (
              <div key={feature.feature} className="flex items-center gap-3">
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {feature.feature} has the highest adoption ({feature.adoptionRate.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-600">
                    Used by {feature.businessesUsing} out of {feature.totalBusinesses} businesses
                  </p>
                </div>
              </div>
            ))}
          
          {adoptionData
            .sort((a, b) => a.adoptionRate - b.adoptionRate)
            .slice(0, 2)
            .map((feature) => (
              <div key={feature.feature} className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-gray-900">
                    {feature.feature} has low adoption ({feature.adoptionRate.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-600">
                    Consider improving onboarding or highlighting this feature
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
