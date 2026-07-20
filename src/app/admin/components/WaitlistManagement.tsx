'use client';

import React, { useState, useEffect } from 'react';

interface WaitlistSubmission {
  id: string;
  type: 'seller' | 'investor';
  fullName: string;
  email: string;
  phone: string;
  businessName?: string;
  businessType?: string;
  monthlyRevenue?: string;
  investorType?: string;
  investmentRange?: string;
  createdAt: Date;
  status: string;
}

export default function WaitlistManagement() {
  const [activeTab, setActiveTab] = useState<'seller' | 'investor'>('seller');
  const [submissions, setSubmissions] = useState<WaitlistSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, [activeTab]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/waitlist?type=${activeTab}&limit=50`);
      const result = await response.json();
      
      if (result.success) {
        setSubmissions(result.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Waitlist Management</h2>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('seller')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'seller'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sellers ({submissions.filter(s => s.type === 'seller').length})
          </button>
          <button
            onClick={() => setActiveTab('investor')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'investor'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Investors ({submissions.filter(s => s.type === 'investor').length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No {activeTab} waitlist submissions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                  {activeTab === 'seller' && (
                    <>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Business</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                    </>
                  )}
                  {activeTab === 'investor' && (
                    <>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Range</th>
                    </>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {submission.fullName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {submission.email}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {submission.phone}
                    </td>
                    {activeTab === 'seller' && (
                      <>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {submission.businessName || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {submission.monthlyRevenue || '-'}
                        </td>
                      </>
                    )}
                    {activeTab === 'investor' && (
                      <>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {submission.investorType || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {submission.investmentRange || '-'}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {submission.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
