'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, getCountFromServer } from 'firebase/firestore';

interface BusinessTimeline {
  businessId: string;
  businessName: string;
  businessCategory: string; // Added business category field
  ownerEmail: string;
  timeline: TimelineEvent[];
  stats: BusinessStats;
}

interface TimelineEvent {
  event: string;
  date: string;
  description: string;
  icon: string;
  color: string;
}

interface BusinessStats {
  totalProducts: number;
  totalSales: number;
  totalExpenses: number;
  totalStaff: number;
  totalSuppliers: number;
  totalCustomers: number;
  totalRevenue: number;
  plan: string;
  currency: string;
  lastActive: string;
}

export default function BusinessTimeline() {
  const { firestore } = initializeFirebase();
  const [timelines, setTimelines] = useState<BusinessTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessTimeline | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadBusinessTimelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let snapshot;
      
      try {
        const businessesQuery = query(
          collection(firestore, 'businesses'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        snapshot = await getDocs(businessesQuery);
      } catch (indexError) {
        console.warn('Index not available for businesses query, trying without orderBy:', indexError);
        snapshot = await getDocs(query(collection(firestore, 'businesses'), limit(50)));
      }
      
      const timelinesList: BusinessTimeline[] = [];
      
      for (const businessDoc of snapshot.docs) {
        const businessData = businessDoc.data();
        const businessId = businessDoc.id;
        
        // Get owner info
        let ownerEmail = 'Unknown';
        if (businessData.ownerId) {
          const ownerDoc = await getDoc(doc(firestore, 'users', businessData.ownerId));
          if (ownerDoc.exists()) {
            ownerEmail = ownerDoc.data().email || 'Unknown';
          }
        }

        // Build timeline
        const timeline: TimelineEvent[] = [];
        
        // Account created
        if (businessData.createdAt) {
          timeline.push({
            event: 'Account Created',
            date: businessData.createdAt.toDate().toLocaleDateString(),
            description: 'Business account was created',
            icon: '✅',
            color: 'green',
          });
        }

        // First product added
        const productsQuery = query(
          collection(firestore, 'businesses', businessId, 'products'),
          orderBy('createdAt', 'asc'),
          limit(1)
        );
        const productsSnapshot = await getDocs(productsQuery);
        if (!productsSnapshot.empty) {
          const firstProduct = productsSnapshot.docs[0].data();
          timeline.push({
            event: 'First Product Added',
            date: firstProduct.createdAt?.toDate().toLocaleDateString() || 'N/A',
            description: `Added product: ${firstProduct.name || 'Unknown'}`,
            icon: '📦',
            color: 'blue',
          });
        }

        // First sale recorded
        const salesQuery = query(
          collection(firestore, 'businesses', businessId, 'sales'),
          orderBy('createdAt', 'asc'),
          limit(1)
        );
        const salesSnapshot = await getDocs(salesQuery);
        if (!salesSnapshot.empty) {
          const firstSale = salesSnapshot.docs[0].data();
          timeline.push({
            event: 'First Sale Recorded',
            date: firstSale.createdAt?.toDate().toLocaleDateString() || 'N/A',
            description: `Recorded first sale of ${firstSale.amount || 0}`,
            icon: '💰',
            color: 'green',
          });
        }

        // First expense recorded
        const expensesQuery = query(
          collection(firestore, 'businesses', businessId, 'expenses'),
          orderBy('createdAt', 'asc'),
          limit(1)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        if (!expensesSnapshot.empty) {
          const firstExpense = expensesSnapshot.docs[0].data();
          timeline.push({
            event: 'First Expense Recorded',
            date: firstExpense.createdAt?.toDate().toLocaleDateString() || 'N/A',
            description: `Recorded first expense of ${firstExpense.amount || 0}`,
            icon: '💸',
            color: 'red',
          });
        }

        // Staff invited
        const staffQuery = query(
          collection(firestore, 'businesses', businessId, 'staff'),
          orderBy('createdAt', 'asc'),
          limit(1)
        );
        const staffSnapshot = await getDocs(staffQuery);
        if (!staffSnapshot.empty) {
          const firstStaff = staffSnapshot.docs[0].data();
          timeline.push({
            event: 'Staff Invited',
            date: firstStaff.createdAt?.toDate().toLocaleDateString() || 'N/A',
            description: `Invited first staff member`,
            icon: '👥',
            color: 'purple',
          });
        }

        // Ask MO used
        const askMoQuery = query(
          collection(firestore, 'businesses', businessId, 'askMoConversations'),
          orderBy('createdAt', 'asc'),
          limit(1)
        );
        const askMoSnapshot = await getDocs(askMoQuery);
        if (!askMoSnapshot.empty) {
          const firstAskMo = askMoSnapshot.docs[0].data();
          timeline.push({
            event: 'Ask MO Used',
            date: firstAskMo.createdAt?.toDate().toLocaleDateString() || 'N/A',
            description: `First Ask MO conversation`,
            icon: '🤖',
            color: 'indigo',
          });
        }

        // Subscription activated
        if (businessData.subscriptionActivatedAt) {
          timeline.push({
            event: 'Subscription Activated',
            date: businessData.subscriptionActivatedAt.toDate().toLocaleDateString(),
            description: `Activated ${businessData.plan || 'unknown'} plan`,
            icon: '💎',
            color: 'yellow',
          });
        }

        // Last activity
        if (businessData.lastActive) {
          timeline.push({
            event: 'Last Activity',
            date: businessData.lastActive.toDate().toLocaleDateString(),
            description: 'Most recent activity',
            icon: '🕒',
            color: 'gray',
          });
        }

        // Calculate business stats
        const totalProducts = await getCountFromServer(collection(firestore, 'businesses', businessId, 'products'));
        const totalSales = await getCountFromServer(collection(firestore, 'businesses', businessId, 'sales'));
        const totalExpenses = await getCountFromServer(collection(firestore, 'businesses', businessId, 'expenses'));
        const totalStaff = await getCountFromServer(collection(firestore, 'businesses', businessId, 'staff'));
        const totalSuppliers = await getCountFromServer(collection(firestore, 'businesses', businessId, 'suppliers'));
        const totalCustomers = await getCountFromServer(collection(firestore, 'businesses', businessId, 'customers'));
        
        // Calculate total revenue
        let totalRevenue = 0;
        const salesSnapshotAll = await getDocs(collection(firestore, 'businesses', businessId, 'sales'));
        salesSnapshotAll.forEach(saleDoc => {
          const saleData = saleDoc.data();
          if (saleData.amount) {
            totalRevenue += parseFloat(saleData.amount) || 0;
          }
        });

        // Sort timeline by date
        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        timelinesList.push({
          businessId,
          businessName: businessData.name || 'Unknown Business',
          businessCategory: businessData.category || businessData.selectedCategory || 'Unknown Category', // Added business category
          ownerEmail,
          timeline,
          stats: {
            totalProducts: totalProducts.data().count,
            totalSales: totalSales.data().count,
            totalExpenses: totalExpenses.data().count,
            totalStaff: totalStaff.data().count,
            totalSuppliers: totalSuppliers.data().count,
            totalCustomers: totalCustomers.data().count,
            totalRevenue,
            plan: businessData.plan || 'trial',
            currency: businessData.currency || 'NGN',
            lastActive: businessData.lastActive ? businessData.lastActive.toDate().toLocaleDateString() : 'Never',
          },
        });
      }
      
      setTimelines(timelinesList);
    } catch (error) {
      console.error('Error loading business timelines:', error);
      setError('Failed to load business timelines. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    loadBusinessTimelines();
  }, [loadBusinessTimelines]);

  const filteredTimelines = timelines.filter(business => 
    business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.businessCategory.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <p className="mt-4 text-gray-600 font-medium">Loading business timelines...</p>
        <p className="text-gray-500 text-sm">Analyzing business activities</p>
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
        <h2 className="text-2xl font-bold text-gray-900">Business Timeline</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <button 
            onClick={loadBusinessTimelines}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
      
      {selectedBusiness ? (
        <div>
          <button
            onClick={() => setSelectedBusiness(null)}
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to All Businesses
          </button>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedBusiness.businessName}</h3>
                <p className="text-gray-600">{selectedBusiness.ownerEmail}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {selectedBusiness.businessCategory}
                </div>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedBusiness.stats.plan === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedBusiness.stats.plan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedBusiness.stats.plan}
                </span>
                <span className="text-sm text-gray-600">
                  Last active: {selectedBusiness.stats.lastActive}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{selectedBusiness.stats.totalProducts}</p>
                <p className="text-sm text-gray-600">Products</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{selectedBusiness.stats.totalSales}</p>
                <p className="text-sm text-gray-600">Sales</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">{selectedBusiness.stats.totalStaff}</p>
                <p className="text-sm text-gray-600">Staff</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-600">{selectedBusiness.stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Revenue ({selectedBusiness.stats.currency})</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {selectedBusiness.timeline.map((event, index) => (
                  <div key={index} className="relative pl-10">
                    <div className={`absolute left-2 w-4 h-4 rounded-full border-4 border-white ${
                      event.color === 'green' ? 'bg-green-500' :
                      event.color === 'blue' ? 'bg-blue-500' :
                      event.color === 'red' ? 'bg-red-500' :
                      event.color === 'purple' ? 'bg-purple-500' :
                      event.color === 'indigo' ? 'bg-indigo-500' :
                      event.color === 'yellow' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>{event.icon}</span>
                          {event.event}
                        </h4>
                        <span className="text-sm text-gray-500">{event.date}</span>
                      </div>
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTimelines.length > 0 ? (
            filteredTimelines.map((business) => (
              <div
                key={business.businessId}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedBusiness(business)}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{business.businessName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        business.stats.plan === 'paid' ? 'bg-green-100 text-green-800' :
                        business.stats.plan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {business.stats.plan}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {business.businessCategory}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{business.ownerEmail}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-sm">
                        <span className="text-gray-500">Products:</span>
                        <span className="ml-1 font-medium">{business.stats.totalProducts}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Sales:</span>
                        <span className="ml-1 font-medium">{business.stats.totalSales}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Staff:</span>
                        <span className="ml-1 font-medium">{business.stats.totalStaff}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Revenue:</span>
                        <span className="ml-1 font-medium">{business.stats.totalRevenue.toLocaleString()} {business.stats.currency}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:text-right">
                    <p className="text-sm text-gray-500 mb-2">{business.timeline.length} events</p>
                    <p className="text-purple-600 font-medium">View Timeline →</p>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {business.timeline.slice(0, 4).map((event, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center gap-1"
                    >
                      <span>{event.icon}</span>
                      {event.event}
                    </span>
                  ))}
                  {business.timeline.length > 4 && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      +{business.timeline.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No businesses found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
