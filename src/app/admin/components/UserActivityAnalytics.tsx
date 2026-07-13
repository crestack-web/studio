'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, getCountFromServer, where, getFirestore } from 'firebase/firestore';

interface UserActivity {
  userId: string;
  email: string;
  businessName: string;
  pageVisits: PageVisit[];
  totalVisits: number;
  lastVisited: string;
}

interface PageVisit {
  page: string;
  visitCount: number;
  lastVisited: string;
  timeSpent: number; // in seconds
}

export default function UserActivityAnalytics() {
  const { firestore } = initializeFirebase();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadUserActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all users
      const usersSnapshot = await getDocs(query(collection(firestore, 'users'), limit(100)));
      const activitiesList: UserActivity[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        
        // Get user's business name
        let businessName = 'Personal Account';
        if (userData.businessId) {
          try {
            const businessDoc = await getDoc(doc(firestore, 'businesses', userData.businessId));
            if (businessDoc.exists()) {
              businessName = businessDoc.data().name || businessDoc.data().businessName || 'Personal Account';
            }
          } catch (businessError) {
            console.error('Error fetching business data:', businessError);
          }
        }

        // Get user's page visits
        let pageVisits: PageVisit[] = [];
        let totalVisits = 0;
        let lastVisited = 'Never';

        try {
          const pageVisitsSnapshot = await getDocs(collection(firestore, `users/${userId}/pageVisits`));
          
          pageVisits = pageVisitsSnapshot.docs.map(visitsDoc => {
            const visitData = visitsDoc.data();
            return {
              page: visitData.page || 'Unknown',
              visitCount: visitData.visitCount || 0,
              lastVisited: visitData.lastVisited ? visitData.lastVisited.toDate().toISOString() : new Date().toISOString(),
              timeSpent: 60, // Placeholder for now - would need actual time tracking
            };
          });

          // Sort page visits by visit count descending
          pageVisits.sort((a, b) => b.visitCount - a.visitCount);
          
          // Calculate total visits
          totalVisits = pageVisits.reduce((sum, page) => sum + page.visitCount, 0);
          
          // Find last visited date
          if (pageVisits.length > 0) {
            const latestVisit = new Date(Math.max(...pageVisits.map(page => new Date(page.lastVisited).getTime())));
            lastVisited = latestVisit.toLocaleDateString();
          }
        } catch (visitsError) {
          console.error('Error fetching page visits for user:', userId, visitsError);
          // If there's an error fetching page visits, we'll still show the user with empty visits
          pageVisits = [];
          totalVisits = 0;
          lastVisited = 'Never';
        }

        activitiesList.push({
          userId,
          email: userData.email || 'Unknown',
          businessName,
          pageVisits,
          totalVisits,
          lastVisited,
        });
      }

      // Sort by total visits descending
      activitiesList.sort((a, b) => b.totalVisits - a.totalVisits);
      
      setActivities(activitiesList);
    } catch (error) {
      console.error('Error loading user activity:', error);
      setError('Failed to load user activity data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    loadUserActivity();
  }, [loadUserActivity]);

  // Function to get top pages by visit count
  const getTopPages = () => {
    const allPageVisits: PageVisit[] = [];
    activities.forEach(activity => {
      activity.pageVisits.forEach(page => {
        const existing = allPageVisits.find(p => p.page === page.page);
        if (existing) {
          existing.visitCount += page.visitCount;
          existing.timeSpent += page.timeSpent;
        } else {
          allPageVisits.push({...page});
        }
      });
    });
    
    return allPageVisits.sort((a, b) => b.visitCount - a.visitCount).slice(0, 5);
  };

  const filteredActivities = activities.filter(activity => 
    activity.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topPages = getTopPages();

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
        <p className="mt-4 text-gray-600 font-medium">Loading user activity analytics...</p>
        <p className="text-gray-500 text-sm">Analyzing user engagement</p>
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
        <h2 className="text-2xl font-bold text-gray-900">User Activity Analytics</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <button 
            onClick={loadUserActivity}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{activities.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Visits/User</p>
              <p className="text-3xl font-bold text-gray-900">
                {activities.length > 0 ? Math.round(activities.reduce((sum, u) => sum + u.totalVisits, 0) / activities.length) : 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Page</p>
              <p className="text-xl font-bold text-gray-900 truncate max-w-[150px]">
                {topPages.length > 0 ? topPages[0].page : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-3xl font-bold text-gray-900">
                {activities.filter(u => new Date(u.lastVisited).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Top Pages Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages by Visits</h3>
        <div className="space-y-4">
          {topPages.length > 0 ? (
            topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{page.page}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (page.visitCount / Math.max(...topPages.map(p => p.visitCount))) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12">{page.visitCount}</span>
                  <span className="text-sm text-gray-500 w-20">{Math.round(page.timeSpent / 60)} min avg</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No page visit data available yet. Users need to visit dashboard pages for tracking.
            </div>
          )}
        </div>
      </div>

      {/* User List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">User Activity Details</h3>
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div key={activity.userId} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{activity.email}</h4>
                  <p className="text-gray-600">{activity.businessName}</p>
                </div>
                <div className="mt-2 md:mt-0 text-right">
                  <p className="text-sm text-gray-500">Total visits: {activity.totalVisits}</p>
                  <p className="text-sm text-gray-500">Last visited: {activity.lastVisited}</p>
                </div>
              </div>
              
              {activity.pageVisits.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activity.pageVisits.slice(0, 6).map((page, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{page.page}</h5>
                        <span className="text-sm font-medium text-purple-600">{page.visitCount} visits</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Last: {new Date(page.lastVisited).toLocaleDateString()}</span>
                        <span>{Math.round(page.timeSpent / 60)} min</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-purple-600 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (page.visitCount / Math.max(...activity.pageVisits.map(p => p.visitCount))) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No page visit data for this user yet.
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No user activity found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}