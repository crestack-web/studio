'use client';

import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, orderBy, where, updateDoc, doc } from 'firebase/firestore';

interface SupportMessage {
  id: string;
  userId: string;
  userEmail: string;
  businessId?: string;
  businessName?: string;
  message: string;
  status: 'open' | 'unread' | 'resolved' | 'needs_human';
  category: string;
  createdAt: string;
  replies: SupportReply[];
}

interface SupportReply {
  message: string;
  sender: 'admin' | 'user';
  createdAt: string;
}

export default function SupportInbox() {
  const { firestore } = initializeFirebase();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'unread' | 'resolved' | 'needs_human'>('all');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadMessages();
  }, [firestore]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesQuery = query(
        collection(firestore, 'supportMessages'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(messagesQuery);
      
      const messagesList: SupportMessage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        messagesList.push({
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || 'Unknown',
          businessId: data.businessId,
          businessName: data.businessName,
          message: data.message || '',
          status: data.status || 'open',
          category: data.category || 'general',
          createdAt: data.createdAt?.toDate().toLocaleString() || 'N/A',
          replies: data.replies || [],
        });
      });
      
      setMessages(messagesList);
    } catch (error) {
      console.error('Error loading support messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    return msg.status === filter;
  });

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;

    try {
      const newReply: SupportReply = {
        message: replyText,
        sender: 'admin',
        createdAt: new Date().toISOString(),
      };

      const updatedReplies = [...selectedMessage.replies, newReply];
      
      await updateDoc(doc(firestore, 'supportMessages', selectedMessage.id), {
        replies: updatedReplies,
        status: 'open',
      });

      setReplyText('');
      loadMessages();
      setSelectedMessage({
        ...selectedMessage,
        replies: updatedReplies,
      });
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const handleMarkResolved = async (messageId: string) => {
    try {
      await updateDoc(doc(firestore, 'supportMessages', messageId), {
        status: 'resolved',
      });
      loadMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: 'resolved' });
      }
    } catch (error) {
      console.error('Error marking as resolved:', error);
    }
  };

  const handleMarkUnread = async (messageId: string) => {
    try {
      await updateDoc(doc(firestore, 'supportMessages', messageId), {
        status: 'unread',
      });
      loadMessages();
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage, status: 'unread' });
      }
    } catch (error) {
      console.error('Error marking as unread:', error);
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
    <div className="overflow-x-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Inbox</h2>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 min-w-[300px]">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-2xl font-bold text-blue-700">{messages.length}</p>
          <p className="text-sm text-blue-600">Total</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{messages.filter(m => m.status === 'unread').length}</p>
          <p className="text-sm text-yellow-600">Unread</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{messages.filter(m => m.status === 'needs_human').length}</p>
          <p className="text-sm text-red-600">Needs Human</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{messages.filter(m => m.status === 'open').length}</p>
          <p className="text-sm text-green-600">Open</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-700">{messages.filter(m => m.status === 'resolved').length}</p>
          <p className="text-sm text-gray-600">Resolved</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap min-w-[300px]">
        {(['all', 'unread', 'needs_human', 'open', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'needs_human' ? 'Needs Human' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {selectedMessage ? (
        <div className="min-w-[300px]">
          <button
            onClick={() => setSelectedMessage(null)}
            className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium"
          >
            ← Back to Inbox
          </button>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-lg font-semibold text-gray-900">{selectedMessage.userEmail}</h3>
                {selectedMessage.businessName && (
                  <p className="text-gray-600">{selectedMessage.businessName}</p>
                )}
                <p className="text-sm text-gray-500">{selectedMessage.createdAt}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleMarkUnread(selectedMessage.id)}
                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200"
                >
                  Mark Unread
                </button>
                <button
                  onClick={() => handleMarkResolved(selectedMessage.id)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                >
                  Mark Resolved
                </button>
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    U
                  </div>
                  <span className="text-sm font-medium text-gray-700">User</span>
                </div>
                <p className="text-gray-900">{selectedMessage.message}</p>
                <p className="text-xs text-gray-500 mt-2">{selectedMessage.createdAt}</p>
              </div>

              {selectedMessage.replies.map((reply, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 border ${
                    reply.sender === 'admin'
                      ? 'bg-purple-50 border-purple-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      reply.sender === 'admin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {reply.sender === 'admin' ? 'A' : 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {reply.sender === 'admin' ? 'Admin (You)' : 'User'}
                    </span>
                  </div>
                  <p className="text-gray-900">{reply.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {reply.createdAt}
                  </p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <div className="border-t border-gray-200 pt-6">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 min-w-[300px]">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 transition cursor-pointer"
              onClick={() => setSelectedMessage(message)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">{message.userEmail}</h3>
                    {message.businessName && (
                      <span className="text-sm text-gray-600 whitespace-nowrap">• {message.businessName}</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      message.status === 'unread' ? 'bg-yellow-100 text-yellow-800' :
                      message.status === 'needs_human' ? 'bg-red-100 text-red-800' :
                      message.status === 'open' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {message.status === 'needs_human' ? 'Needs Human' : message.status}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{message.message}</p>
                  <p className="text-sm text-gray-500 mt-2">{message.createdAt}</p>
                </div>
                {message.replies.length > 0 && (
                  <div className="ml-4 text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                    {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredMessages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No messages found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
