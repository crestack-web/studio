'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, query, orderBy, updateDoc, doc, onSnapshot, limit, where, getDocs } from 'firebase/firestore';

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
  assignedTo?: string;
  assignedToName?: string;
}

interface SupportReply {
  message: string;
  sender: 'admin' | 'user' | 'mo' | 'system';
  senderName?: string;
  createdAt: string;
}

export default function SupportInbox() {
  const { firestore } = initializeFirebase();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'unread' | 'resolved' | 'needs_human' | 'mine'>('all');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [isSupportAdmin, setIsSupportAdmin] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAdminName(parsed.name || parsed.email || 'Admin');
        setAdminEmail(parsed.email || '');
        setIsSupportAdmin(parsed.role === 'Support Admin');
      } catch {}
    }
  }, []);

  useEffect(() => {
    const messagesQuery = query(
      collection(firestore, 'supportMessages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
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
          replies: (data.replies || []).map((r: any) => ({
            message: r.message,
            sender: r.sender,
            senderName: r.senderName || (r.sender === 'admin' ? 'Admin' : 'User'),
            createdAt: r.createdAt,
          })),
          assignedTo: data.assignedTo,
          assignedToName: data.assignedToName,
        });
      });
      
      setMessages(messagesList);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to support messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore]);

  const filteredMessages = useMemo(() => {
    let result = messages;
    if (filter === 'mine') {
      result = messages.filter(msg => msg.assignedTo === adminEmail);
    } else if (filter !== 'all') {
      result = messages.filter(msg => msg.status === filter);
    }
    return result;
  }, [messages, filter, adminEmail]);

  const stats = useMemo(() => ({
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    needsHuman: messages.filter(m => m.status === 'needs_human').length,
    open: messages.filter(m => m.status === 'open').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
    mine: messages.filter(m => m.assignedTo === adminEmail).length,
  }), [messages, adminEmail]);

  const handleAssign = async (messageId: string) => {
    try {
      await updateDoc(doc(firestore, 'supportMessages', messageId), {
        assignedTo: adminEmail,
        assignedToName: adminName,
        status: 'open',
      });
      if (selectedMessage?.id === messageId) {
        setSelectedMessage({ ...selectedMessage!, assignedTo: adminEmail, assignedToName: adminName, status: 'open' });
      }
    } catch (error) {
      console.error('Error assigning message:', error);
    }
  };

  const handleReply = useCallback(async () => {
    if (!selectedMessage || !replyText.trim() || sending) return;
    setSending(true);

    try {
      const newReply: SupportReply = {
        message: replyText,
        sender: 'admin',
        senderName: adminName,
        createdAt: new Date().toISOString(),
      };

      const updatedReplies = [...selectedMessage.replies, newReply];
      
      await updateDoc(doc(firestore, 'supportMessages', selectedMessage.id), {
        replies: updatedReplies,
        status: 'open',
        assignedTo: selectedMessage.assignedTo || adminEmail,
        assignedToName: selectedMessage.assignedToName || adminName,
      });

      setReplyText('');
      setSelectedMessage({
        ...selectedMessage,
        replies: updatedReplies,
        assignedTo: selectedMessage.assignedTo || adminEmail,
        assignedToName: selectedMessage.assignedToName || adminName,
      });
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  }, [selectedMessage, replyText, sending, adminName, adminEmail, firestore]);

  const handleMarkResolved = async (messageId: string) => {
    try {
      await updateDoc(doc(firestore, 'supportMessages', messageId), {
        status: 'resolved',
      });
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Support Inbox</h2>
        {adminName && (
          <span className="text-sm text-gray-500">
            Logged in as <span className="font-medium text-gray-700">{adminName}</span>
            {isSupportAdmin && <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">Support Admin</span>}
          </span>
        )}
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6 min-w-[300px]">
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-xl font-bold text-blue-700">{stats.total}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <p className="text-xl font-bold text-yellow-700">{stats.unread}</p>
          <p className="text-xs text-yellow-600">Unread</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <p className="text-xl font-bold text-red-700">{stats.needsHuman}</p>
          <p className="text-xs text-red-600">Needs Human</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
          <p className="text-xl font-bold text-green-700">{stats.open}</p>
          <p className="text-xs text-green-600">Open</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xl font-bold text-gray-700">{stats.resolved}</p>
          <p className="text-xs text-gray-600">Resolved</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
          <p className="text-xl font-bold text-purple-700">{stats.mine}</p>
          <p className="text-xs text-purple-600">My Chats</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap min-w-[300px]">
        {(['all', 'unread', 'needs_human', 'open', 'mine', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'needs_human' ? 'Needs Human' : status === 'mine' ? 'My Chats' : status.charAt(0).toUpperCase() + status.slice(1)}
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
                {selectedMessage.assignedToName && (
                  <p className="text-sm text-purple-600 mt-1">Assigned to: {selectedMessage.assignedToName}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {(!selectedMessage.assignedTo || selectedMessage.assignedTo !== adminEmail) && (
                  <button
                    onClick={() => handleAssign(selectedMessage.id)}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                  >
                    Assign to Me
                  </button>
                )}
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
                  <span className="text-sm font-medium text-gray-700">{selectedMessage.userEmail}</span>
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
                      : reply.sender === 'mo'
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      reply.sender === 'admin'
                        ? 'bg-purple-600 text-white'
                        : reply.sender === 'mo'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {reply.sender === 'admin' ? 'A' : reply.sender === 'mo' ? 'M' : 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {reply.sender === 'admin'
                        ? reply.senderName || 'Admin'
                        : reply.sender === 'mo'
                        ? 'MO AI'
                        : selectedMessage.userEmail}
                    </span>
                  </div>
                  <p className="text-gray-900">{reply.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{reply.createdAt}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <div className="border-t border-gray-200 pt-6">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleReply();
                  }
                }}
                placeholder="Type your reply... (Ctrl+Enter to send)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || sending}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
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
                    {message.assignedToName && (
                      <span className="text-xs text-purple-600 whitespace-nowrap">→ {message.assignedToName}</span>
                    )}
                  </div>
                  <p className="text-gray-600 line-clamp-2">{message.message}</p>
                  <p className="text-sm text-gray-500 mt-2">{message.createdAt}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {message.replies.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                  {!message.assignedTo && message.status !== 'resolved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAssign(message.id); }}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
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
