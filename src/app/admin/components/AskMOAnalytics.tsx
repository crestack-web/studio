'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, limit, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';

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
  totalSuccessfulConversations: number;
  responseTimeAvg: number;
  positiveFeedbackCount: number;
  negativeFeedbackCount: number;
  totalUsersEngaged: number;
  avgSessionDuration: number;
  mostActiveHours: { hour: number; count: number }[];
  commonTopics: { topic: string; count: number }[];
}

export default function AskMOAnalytics() {
  const { firestore } = initializeFirebase();
  const [analytics, setAnalytics] = useState<AskMOAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      let totalSuccessfulConversations = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let positiveFeedbackCount = 0;
      let negativeFeedbackCount = 0;
      let totalUsersEngaged = 0;
      let totalSessionDuration = 0;
      let sessionCount = 0;
      const questionCounts: { [key: string]: number } = {};
      const businessCounts: { [key: string]: { name: string; count: number } } = {};
      const hourlyActivity: { [key: number]: number } = {};
      const topics: { [key: string]: number } = {};

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

          // Track successful conversations
          if (!data.hasFailedResponse) {
            totalSuccessfulConversations++;
          }

          // Check for failed responses
          if (data.hasFailedResponse) {
            failedResponses++;
          }

          // Check for slow responses (response time > 5 seconds)
          if (data.responseTime && data.responseTime > 5000) {
            slowResponses++;
          }

          // Track response time
          if (data.responseTime) {
            totalResponseTime += data.responseTime;
            responseTimeCount++;
          }

          // User satisfaction
          if (data.userRating !== undefined) {
            if (data.userRating >= 4) {
              positiveFeedbackCount++;
            } else {
              negativeFeedbackCount++;
            }
            satisfactionSum += data.userRating;
            satisfactionCount++;
          }

          // Session duration
          if (data.duration) {
            totalSessionDuration += data.duration;
            sessionCount++;
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

          // Track hourly activity
          if (data.createdAt) {
            const hour = data.createdAt.toDate().getHours();
            hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
          }

          // Track common topics (extracted from conversation titles or first messages)
          if (data.topic || data.title) {
            const topic = (data.topic || data.title).toLowerCase();
            topics[topic] = (topics[topic] || 0) + 1;
          }
        });
      }

      // Calculate averages
      const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;
      const userSatisfaction = satisfactionCount > 0 ? satisfactionSum / satisfactionCount : 0;
      const averageConversationTime = conversationTimeCount > 0 ? totalConversationTime / conversationTimeCount : 0;
      const responseTimeAvg = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
      const avgSessionDuration = sessionCount > 0 ? totalSessionDuration / sessionCount : 0;

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

      // Get hourly activity
      const mostActiveHours = Object.entries(hourlyActivity)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count);

      // Get common topics
      const commonTopics = Object.entries(topics)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

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
        totalSuccessfulConversations,
        responseTimeAvg,
        positiveFeedbackCount,
        negativeFeedbackCount,
        totalUsersEngaged: usersSnapshot.size,
        avgSessionDuration,
        mostActiveHours,
        commonTopics,
      });
    } catch (error) {
      console.error('Error loading Ask MO analytics:', error);
      setError('Failed to load Ask MO analytics. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [firestore]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

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
        <p className="mt-4 text-gray-600 font-medium">Loading Ask MO analytics...</p>
        <p className="text-gray-500 text-sm">Analyzing conversation data</p>
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

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ask MO Analytics</h2>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button 
            onClick={loadAnalytics}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{analytics.totalConversations}</p>
          <p className="text-sm text-purple-600">Total Conversations</p>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl p-5 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{analytics.avgMessagesPerConversation.toFixed(1)}</p>
          <p className="text-sm text-blue-600">Avg Messages/Conv</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{analytics.userSatisfaction.toFixed(1)}/5</p>
          <p className="text-sm text-green-600">User Satisfaction</p>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-5 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{analytics.failedResponses}</p>
          <p className="text-sm text-red-600">Failed Responses</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-5 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{analytics.slowResponses}</p>
          <p className="text-sm text-yellow-600">Slow Responses</p>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">
            {analytics.totalConversations > 0 ? ((analytics.failedResponses / analytics.totalConversations) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-sm text-gray-600">Failure Rate</p>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
          <p className="text-2xl font-bold text-indigo-700">{analytics.totalCreditsConsumed.toLocaleString()}</p>
          <p className="text-sm text-indigo-600">Total Credits Consumed</p>
        </div>
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200">
          <p className="text-2xl font-bold text-teal-700">{analytics.totalConversationsStarted.toLocaleString()}</p>
          <p className="text-sm text-teal-600">Total Conversations Started</p>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">
            {analytics.averageConversationTime > 0 
              ? `${Math.floor(analytics.averageConversationTime / 60)}m ${Math.round(analytics.averageConversationTime % 60)}s`
              : 'N/A'}
          </p>
          <p className="text-sm text-orange-600">Avg Conversation Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Most Common Questions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Questions</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.mostCommonQuestions.length > 0 ? (
              analytics.mostCommonQuestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium capitalize truncate">{item.question}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
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

        {/* Common Topics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Topics</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.commonTopics.length > 0 ? (
              analytics.commonTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium truncate">{topic.topic}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-gray-600 text-sm">{topic.count} conversations</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(topic.count / analytics.commonTopics[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No topic data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Business</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analytics.businessBreakdown.length > 0 ? (
              analytics.businessBreakdown.map((business) => (
                <div
                  key={business.businessId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => setSelectedBusiness(business.businessId)}
                >
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium truncate">{business.businessName}</p>
                    <p className="text-gray-500 text-sm truncate">{business.businessId}</p>
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

        {/* Performance Insights */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Response Time</span>
                  <span className="font-semibold text-purple-600">
                    {analytics.responseTimeAvg > 0 ? `${(analytics.responseTimeAvg / 1000).toFixed(2)}s` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Positive Feedback</span>
                  <span className="font-semibold text-green-600">
                    {analytics.positiveFeedbackCount} ({analytics.totalConversations > 0 ? ((analytics.positiveFeedbackCount / (analytics.positiveFeedbackCount + analytics.negativeFeedbackCount)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(analytics.failedResponses > 0 || analytics.slowResponses > 0) && (
            <div className="mt-4 space-y-3">
              {analytics.failedResponses > 0 && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <p className="text-red-800 font-medium">
                    ⚠️ {analytics.failedResponses} conversations had failed responses. Consider reviewing these cases to improve Ask MO performance.
                  </p>
                </div>
              )}

              {analytics.slowResponses > 0 && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <p className="text-yellow-800 font-medium">
                    ⚠️ {analytics.slowResponses} conversations had slow responses (&gt;5s). Consider optimizing response times.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Analyze the most common questions to improve the AI's knowledge base</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Address common failure points to reduce the failure rate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Optimize server performance to reduce response times</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Focus on businesses with high usage for premium feature adoption</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
