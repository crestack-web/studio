'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';

interface BusinessTimeline {
  businessId: string;
  businessName: string;
  ownerEmail: string;
  timeline: TimelineEvent[];
}

interface TimelineEvent {
  event: string;
  date: string;
  description: string;
}

export default function BusinessTimeline() {
  const { firestore } = initializeFirebase();
  const [timelines, setTimelines] = useState<BusinessTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessTimeline | null>(null);

  useEffect(() => {
    loadBusinessTimelines();
  }, [firestore]);

  const loadBusinessTimelines = async () => {
    try {
      setLoading(true);
      let snapshot;
      
      try {
        const businessesQuery = query(
          collection(firestore, 'businesses'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        snapshot = await getDocs(businessesQuery);
      } catch (indexError) {
        console.warn('Index not available for businesses query, trying without orderBy:', indexError);
        snapshot = await getDocs(query(collection(firestore, 'businesses'), limit(20)));
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
            description: 'Business account was created'
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
            description: `Added product: ${firstProduct.name || 'Unknown'}`
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
            description: `Recorded first sale of ${firstSale.amount || 0}`
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
            description: `Recorded first expense of ${firstExpense.amount || 0}`
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
            description: `Invited first staff member`
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
            description: `First Ask MO conversation`
          });
        }

        // Subscription activated
        if (businessData.subscriptionActivatedAt) {
          timeline.push({
            event: 'Subscription Activated',
            date: businessData.subscriptionActivatedAt.toDate().toLocaleDateString(),
            description: `Activated ${businessData.plan || 'unknown'} plan`
          });
        }

        // Last activity
        if (businessData.lastActive) {
          timeline.push({
            event: 'Last Activity',
            date: businessData.lastActive.toDate().toLocaleDateString(),
            description: 'Most recent activity'
          });
        }

        // Sort timeline by date
        timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        timelinesList.push({
          businessId,
          businessName: businessData.name || 'Unknown Business',
          ownerEmail,
          timeline,
        });
      }
      
      setTimelines(timelinesList);
    } catch (error) {
      console.error('Error loading business timelines:', error);
    } finally {
      setLoading(false);
    }
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Timeline</h2>
      
      {selectedBusiness ? (
        <div>
          <button
            onClick={() => setSelectedBusiness(null)}
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
          >
            ← Back to All Businesses
          </button>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBusiness.businessName}</h3>
            <p className="text-gray-600 mb-6">{selectedBusiness.ownerEmail}</p>
            
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              <div className="space-y-6">
                {selectedBusiness.timeline.map((event, index) => (
                  <div key={index} className="relative pl-10">
                    <div className="absolute left-2 w-4 h-4 bg-purple-600 rounded-full border-4 border-white"></div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{event.event}</h4>
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
          {timelines.map((business) => (
            <div
              key={business.businessId}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 transition cursor-pointer"
              onClick={() => setSelectedBusiness(business)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{business.businessName}</h3>
                  <p className="text-gray-600">{business.ownerEmail}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{business.timeline.length} events</p>
                  <p className="text-purple-600 font-medium">View Timeline →</p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {business.timeline.slice(0, 4).map((event, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
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
          ))}
        </div>
      )}
    </div>
  );
}
