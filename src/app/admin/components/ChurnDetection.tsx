'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';

interface AtRiskBusiness {
  businessId: string;
  businessName: string;
  ownerEmail: string;
  riskReason: string;
  riskLevel: 'high' | 'medium' | 'low';
  lastActive: string;
  daysInactive: number;
  hasProducts: boolean;
  hasSales: boolean;
  totalProducts: number;
  totalSales: number;
}

export default function ChurnDetection() {
  const { firestore } = initializeFirebase();
  const [atRiskBusinesses, setAtRiskBusinesses] = useState<AtRiskBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    detectChurnRisks();
  }, [firestore]);

  const detectChurnRisks = async () => {
    try {
      setLoading(true);
      const businessesQuery = query(
        collection(firestore, 'businesses'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(businessesQuery);
      const now = new Date();
      
      // Parallelize per-business queries
      const churnResults = await Promise.all(
        snapshot.docs.map(async (businessDoc) => {
          const businessData = businessDoc.data();
          const businessId = businessDoc.id;
          
          const [ownerDoc, productsSnap, salesSnap] = await Promise.all([
            businessData.ownerId ? getDoc(doc(firestore, 'users', businessData.ownerId)).catch(() => null) : Promise.resolve(null),
            getDocs(query(collection(firestore, 'businesses', businessId, 'products'), limit(1))),
            getDocs(query(collection(firestore, 'businesses', businessId, 'sales'), limit(1))),
          ]);

          let ownerEmail = 'Unknown';
          if (ownerDoc?.exists()) ownerEmail = ownerDoc.data().email || 'Unknown';

          const hasProducts = !productsSnap.empty;
          const hasSales = !salesSnap.empty;
          const lastActive = businessData.lastActive?.toDate() || businessData.createdAt?.toDate() || new Date();
          const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

          let riskLevel: 'high' | 'medium' | 'low' = 'low';
          let riskReason = '';

          if (!hasProducts) {
            riskLevel = 'high'; riskReason = 'Signed up but never added products';
          } else if (hasProducts && !hasSales) {
            riskLevel = 'high'; riskReason = 'Added products but never recorded sales';
          } else if (daysInactive >= 30) {
            riskLevel = 'high'; riskReason = `Inactive for ${daysInactive} days`;
          } else if (daysInactive >= 7) {
            riskLevel = 'medium'; riskReason = `Inactive for ${daysInactive} days`;
          } else if (daysInactive >= 3) {
            riskLevel = 'low'; riskReason = `Inactive for ${daysInactive} days`;
          }

          if (!riskReason) return null;

          return {
            businessId,
            businessName: businessData.name || 'Unknown Business',
            ownerEmail,
            riskReason,
            riskLevel,
            lastActive: lastActive.toLocaleDateString(),
            daysInactive,
            hasProducts,
            hasSales,
            totalProducts: productsSnap.size,
            totalSales: salesSnap.size,
          };
        })
      );

      const atRiskList = churnResults.filter((r): r is NonNullable<typeof r> => r !== null);
      
      // Sort by risk level (high first) and days inactive
      atRiskList.sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        }
        return b.daysInactive - a.daysInactive;
      });
      
      setAtRiskBusinesses(atRiskList);
    } catch (error) {
      console.error('Error detecting churn risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = useMemo(() => atRiskBusinesses.filter(business => {
    if (filter === 'all') return true;
    return business.riskLevel === filter;
  }), [atRiskBusinesses, filter]);

  const riskLevelColors = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const riskLevelBadge = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Churn Detection</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{atRiskBusinesses.filter(b => b.riskLevel === 'high').length}</p>
          <p className="text-sm text-red-600">High Risk</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{atRiskBusinesses.filter(b => b.riskLevel === 'medium').length}</p>
          <p className="text-sm text-yellow-600">Medium Risk</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{atRiskBusinesses.filter(b => b.riskLevel === 'low').length}</p>
          <p className="text-sm text-blue-600">Low Risk</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">{atRiskBusinesses.length}</p>
          <p className="text-sm text-gray-600">Total At Risk</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'high', 'medium', 'low'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === level
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)} Risk
          </button>
        ))}
      </div>

      {/* At Risk Businesses List */}
      <div className="space-y-4">
        {filteredBusinesses.map((business) => (
          <div
            key={business.businessId}
            className={`rounded-xl border-2 p-6 ${riskLevelColors[business.riskLevel]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{business.businessName}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskLevelBadge[business.riskLevel]}`}>
                    {business.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{business.ownerEmail}</p>
                <p className="text-sm font-medium text-gray-700">{business.riskReason}</p>
                <p className="text-sm text-gray-500">Last active: {business.lastActive} ({business.daysInactive} days ago)</p>
              </div>
              
              <div className="text-right ml-4">
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-500">Products:</span>{' '}
                    <span className="font-medium">{business.totalProducts}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Sales:</span>{' '}
                    <span className="font-medium">{business.totalSales}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                Send Re-engagement Email
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                View Business Timeline
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                Contact Owner
              </button>
            </div>
          </div>
        ))}

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No businesses at risk found
          </div>
        )}
      </div>
    </div>
  );
}
