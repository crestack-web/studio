'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, getCountFromServer } from 'firebase/firestore';

interface AskMOAnalytics {
  totalConversations: number;
  avgMessagesPerConversation: number;
  mostCommonQuestions: { question: string; count: number }[];
  failedResponses: number;
  slowResponses: number;
  userSatisfaction: number;
  businessBreakdown: { businessId: string; businessName: string; conversationCount: number }[];
  totalCreditsConsumed: number;
  totalConversationsStarted: number;
  averageConversationTime: number;
}

export default function AskMOAnalytics() {
  const { firestore } = initializeFirebase();
  const [analytics, setAnalytics] = useState<AskMOAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [firestore]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get total conversations from user conversations
      const usersSnapshot = await getDocs(collection(firestore, 'users'));
      let totalConversations = 0;
      let totalCreditsConsumed = 0;
      let totalConversationsStarted = 0;
      let totalConversationTime = 0;
      let conversationTimeCount = 0;
      let totalMessages = 0;
      let failedResponses = 0;
      let slowResponses = 0;
      let satisfactionSum = 0;
      let satisfactionCount = 0;
      const questionCounts: { [key: string]: number } = {};
      const businessCounts: { [key: string]: { name: string; count: number } } = {};

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        
        // Aggregate user-level metrics
        totalCreditsConsumed += userData?.moCreditsConsumed || 0;
        totalConversationsStarted += userData?.moTotalConversations || 0;
        
        const avgTime = userData?.moAverageConversationTime || 0;
        if (avgTime > 0) {
          totalConversationTime += avgTime;
          conversationTimeCount++;
        }

        // Get user's conversations for detailed analysis
        const conversationsQuery = query(
          collection(firestore, 'users', userDoc.id, 'mo_conversations'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);
        
        totalConversations += conversationsSnapshot.size;

        conversationsSnapshot.forEach(doc => {
          const data = doc.data();
          const messages = data.messages || [];
          totalMessages += messages.length;

          // Check for failed responses
          if (data.hasFailedResponse) {
            failedResponses++;
          }

          // Check for slow responses (response time > 5 seconds)
          if (data.responseTime && data.responseTime > 5000) {
            slowResponses++;
          }

          // User satisfaction
          if (data.userRating !== undefined) {
            satisfactionSum += data.userRating;
            satisfactionCount++;
          }

          // Track most common questions
          if (messages.length > 0 && messages[0].role === 'user') {
            const question = messages[0].content?.toLowerCase().substring(0, 100) || '';
            if (question) {
              questionCounts[question] = (questionCounts[question] || 0) + 1;
            }
          }

          // Track by business
          if (data.businessId) {
            if (!businessCounts[data.businessId]) {
              businessCounts[data.businessId] = {
                name: data.businessName || 'Unknown Business',
                count: 0,
              };
            }
            businessCounts[data.businessId].count++;
          }
        });
      }

      // Calculate averages
      const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
      const userSatisfaction = satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 0;
      const averageConversationTime = conversationTimeCount > 0 ? totalConversationTime / conversationTimeCount : 0;

      // Get most common questions
      const mostCommonQuestions = Object.entries(questionCounts)
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get business breakdown
      const businessBreakdown = Object.entries(businessCounts)
        .map(([businessId, data]) => ({
          businessId,
          businessName: data.name,
          conversationCount: data.count,
        }))
        .sort((a, b) => b.conversationCount - a.conversationCount);

      setAnalytics({
        totalConversations,
        avgMessagesPerConversation,
        mostCommonQuestions,
        failedResponses,
        slowResponses,
        userSatisfaction,
        businessBreakdown,
        totalCreditsConsumed,
        totalConversationsStarted,
        averageConversationTime,
      });
    } catch (error) {
      console.error('Error loading Ask MO analytics:', error);
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

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ask MO Analytics</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{analytics.totalConversations}</p>
          <p className="text-sm text-purple-600">Total Conversations</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{analytics.avgMessagesPerConversation.toFixed(1)}</p>
          <p className="text-sm text-blue-600">Avg Messages/Conv</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{analytics.userSatisfaction.toFixed(1)}/5</p>
          <p className="text-sm text-green-600">User Satisfaction</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{analytics.failedResponses}</p>
          <p className="text-sm text-red-600">Failed Responses</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{analytics.slowResponses}</p>
          <p className="text-sm text-yellow-600">Slow Responses</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">
            {analytics.totalConversations > 0 ? ((analytics.failedResponses / analytics.totalConversations) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-600">Failure Rate</p>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">{analytics.totalCreditsConsumed.toLocaleString()}</p>
          <p className="text-sm text-indigo-600">Total Credits Consumed</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
          <p className="text-2xl font-bold text-teal-700">{analytics.totalConversationsStarted.toLocaleString()}</p>
          <p className="text-sm text-teal-600">Total Conversations Started</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">
            {analytics.averageConversationTime > 0 
              ? `${Math.floor(analytics.averageConversationTime / 60)}m ${Math.round(analytics.averageConversationTime % 60)}s`
              : 'N/A'}
          </p>
          <p className="text-sm text-orange-600">Avg Conversation Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Questions</h3>
          <div className="space-y-3">
            {analytics.mostCommonQuestions.length > 0 ? (
              analytics.mostCommonQuestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium capitalize">{item.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">{item.count} times</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${(item.count / analytics.mostCommonQuestions[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No questions data available</p>
            )}
          </div>
        </div>

        {/* Business Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Business</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.businessBreakdown.length > 0 ? (
              analytics.businessBreakdown.map((business) => (
                <div
                  key={business.businessId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => setSelectedBusiness(business.businessId)}
                >
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{business.businessName}</p>
                    <p className="text-gray-500 text-sm">{business.businessId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold">{business.conversationCount}</p>
                    <p className="text-gray-500 text-sm">conversations</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No business data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Response Quality</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">
                  {analytics.totalConversations > 0 
                    ? (((analytics.totalConversations - analytics.failedResponses) / analytics.totalConversations) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fast Response Rate</span>
                <span className="font-semibold text-blue-600">
                  {analytics.totalConversations > 0 
                    ? (((analytics.totalConversations - analytics.slowResponses) / analytics.totalConversations) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">User Engagement</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Conversation Length</span>
                <span className="font-semibold text-purple-600">
                  {analytics.avgMessagesPerConversation.toFixed(1)} messages
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">User Satisfaction</span>
                <span className={`font-semibold ${analytics.userSatisfaction >= 4 ? 'text-green-600' : analytics.userSatisfaction >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {analytics.userSatisfaction.toFixed(1)}/5 ⭐
                </span>
              </div>
            </div>
          </div>
        </div>

        {analytics.failedResponses > 0 && (
          <div className="mt-4 bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-red-800 font-medium">
              ⚠️ {analytics.failedResponses} conversations had failed responses. Consider reviewing these cases to improve Ask MO performance.
            </p>
          </div>
        )}

        {analytics.slowResponses > 0 && (
          <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-yellow-800 font-medium">
              ⚠️ {analytics.slowResponses} conversations had slow responses (&gt;5s). Consider optimizing response times.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
