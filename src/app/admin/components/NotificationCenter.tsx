'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, where, updateDoc, doc, Timestamp, limit } from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'new_signup' | 'new_business' | 'support_message' | 'feature_request' | 'payment' | 'error';
  title: string;
  message: string;
  userId?: string;
  businessId?: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export default function NotificationCenter() {
  const { firestore } = initializeFirebase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Notification['type']>('all');

  useEffect(() => {
    loadNotifications();
  }, [firestore]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const notificationsQuery = query(
        collection(firestore, 'adminNotifications'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(notificationsQuery);
      
      const notificationsList: Notification[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          type: data.type || 'info',
          title: data.title || 'Notification',
          message: data.message || '',
          userId: data.userId,
          businessId: data.businessId,
          read: data.read || false,
          createdAt: data.createdAt?.toDate().toLocaleString() || 'N/A',
          priority: data.priority || 'medium',
        });
      });
      
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(firestore, 'adminNotifications', notificationId), {
        read: true,
        readAt: Timestamp.now(),
      });
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await updateDoc(doc(firestore, 'adminNotifications', notification.id), {
          read: true,
          readAt: Timestamp.now(),
        });
      }
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesReadStatus = filter === 'all' || (filter === 'unread' && !notif.read) || (filter === 'read' && notif.read);
    const matchesType = typeFilter === 'all' || notif.type === typeFilter;
    return matchesReadStatus && matchesType;
  });

  const typeIcons = {
    new_signup: '👤',
    new_business: '🏢',
    support_message: '💬',
    feature_request: '💡',
    payment: '💳',
    error: '❌',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border-gray-300',
    medium: 'bg-blue-100 text-blue-800 border-blue-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };

  const typeColors = {
    new_signup: 'bg-green-50 border-green-200',
    new_business: 'bg-purple-50 border-purple-200',
    support_message: 'bg-blue-50 border-blue-200',
    feature_request: 'bg-yellow-50 border-yellow-200',
    payment: 'bg-indigo-50 border-indigo-200',
    error: 'bg-red-50 border-red-200',
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
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Notification Center</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">{notifications.length}</p>
          <p className="text-sm text-gray-600">Total Notifications</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{notifications.filter(n => !n.read).length}</p>
          <p className="text-sm text-yellow-600">Unread</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{notifications.filter(n => n.priority === 'critical').length}</p>
          <p className="text-sm text-red-600">Critical</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{notifications.filter(n => n.read).length}</p>
          <p className="text-sm text-green-600">Read</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {(['all', 'new_signup', 'new_business', 'support_message', 'feature_request', 'payment', 'error'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                typeFilter === type
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type === 'all' ? 'All Types' : type.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Mark all as read button */}
      {notifications.filter(n => !n.read).length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            Mark All as Read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white rounded-xl border-2 p-6 transition ${
              !notification.read ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
            } ${typeColors[notification.type]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{typeIcons[notification.type] || '📢'}</span>
                  <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[notification.priority]}`}>
                    {notification.priority.toUpperCase()}
                  </span>
                  {!notification.read && (
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{notification.message}</p>
                <p className="text-sm text-gray-500">{notification.createdAt}</p>
              </div>
              
              {!notification.read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="ml-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Mark as Read
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No notifications found
          </div>
        )}
      </div>
    </div>
  );
}
