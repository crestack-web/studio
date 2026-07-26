'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, where, addDoc, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';

interface FeatureRequest {
  id: string;
  userId: string;
  userEmail: string;
  businessId?: string;
  businessName?: string;
  category: 'feature' | 'bug' | 'feedback';
  message: string;
  status: 'new' | 'reviewing' | 'planned' | 'in_progress' | 'released';
  createdAt: string;
}

export default function FeatureRequests() {
  const { firestore } = initializeFirebase();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewing' | 'planned' | 'in_progress' | 'released'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'feature' | 'bug' | 'feedback'>('all');
  const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, [firestore]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestsQuery = query(
        collection(firestore, 'featureRequests'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(requestsQuery);
      
      const requestsList: FeatureRequest[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        requestsList.push({
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || 'Unknown',
          businessId: data.businessId,
          businessName: data.businessName,
          category: data.category || 'feature',
          message: data.message || '',
          status: data.status || 'new',
          createdAt: data.createdAt?.toDate().toLocaleString() || 'N/A',
        });
      });
      
      setRequests(requestsList);
    } catch (error) {
      console.error('Error loading feature requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: FeatureRequest['status']) => {
    try {
      await updateDoc(doc(firestore, 'featureRequests', requestId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      loadRequests();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredRequests = useMemo(() => requests.filter(req => {
    const matchesStatus = filter === 'all' || req.status === filter;
    const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;
    return matchesStatus && matchesCategory;
  }), [requests, filter, categoryFilter]);

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    planned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    released: 'bg-green-100 text-green-800',
  };

  const categoryColors = {
    feature: 'bg-indigo-100 text-indigo-800',
    bug: 'bg-red-100 text-red-800',
    feedback: 'bg-gray-100 text-gray-800',
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Feature Requests</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{requests.filter(r => r.status === 'new').length}</p>
          <p className="text-sm text-blue-600">New</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{requests.filter(r => r.status === 'reviewing').length}</p>
          <p className="text-sm text-yellow-600">Reviewing</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{requests.filter(r => r.status === 'planned').length}</p>
          <p className="text-sm text-purple-600">Planned</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">{requests.filter(r => r.status === 'in_progress').length}</p>
          <p className="text-sm text-orange-600">In Progress</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{requests.filter(r => r.status === 'released').length}</p>
          <p className="text-sm text-green-600">Released</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'new', 'reviewing', 'planned', 'in_progress', 'released'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {(['all', 'feature', 'bug', 'feedback'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                categoryFilter === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedRequest ? (
        <div>
          <button
            onClick={() => setSelectedRequest(null)}
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
          >
            ← Back to All Requests
          </button>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[selectedRequest.category]}`}>
                    {selectedRequest.category.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedRequest.status]}`}>
                    {selectedRequest.status.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedRequest.userEmail}</h3>
                {selectedRequest.businessName && (
                  <p className="text-gray-600">{selectedRequest.businessName}</p>
                )}
                <p className="text-sm text-gray-500">{selectedRequest.createdAt}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
              <p className="text-gray-900 whitespace-pre-wrap">{selectedRequest.message}</p>
            </div>

            {/* Status Update */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Update Status</h4>
              <div className="flex gap-2 flex-wrap">
                {(['new', 'reviewing', 'planned', 'in_progress', 'released'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedRequest.id, status)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedRequest.status === status
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 transition cursor-pointer"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[request.category]}`}>
                      {request.category.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {request.status.toUpperCase().replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{request.userEmail}</h3>
                  {request.businessName && (
                    <p className="text-gray-600 text-sm">{request.businessName}</p>
                  )}
                  <p className="text-gray-600 line-clamp-2 mt-2">{request.message}</p>
                  <p className="text-sm text-gray-500 mt-2">{request.createdAt}</p>
                </div>
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No feature requests found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
