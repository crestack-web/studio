'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore';

interface ChatMessage {
  id: string;
  role: 'user' | 'support';
  message: string;
  createdAt?: any;
}

interface SupportSectionProps {
  onNavigate?: (page: string) => void;
}

const SupportSection: React.FC<SupportSectionProps> = ({ onNavigate }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [supportThreadId, setSupportThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (!chatOpen) {
      setSupportThreadId(null);
      setChatMessages([]);
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const loadThread = async () => {
      try {
        const { firestore } = initializeFirebase();
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setChatMessages([
            { id: 'welcome', role: 'support', message: 'Hi! ?? Welcome to Busmo Support. How can we help you today?' },
          ]);
          return;
        }

        const q = query(
          collection(firestore, 'supportMessages'),
          where('userId', '==', currentUser.uid),
          where('status', 'in', ['open', 'unread']),
          orderBy('createdAt', 'desc'),
          limit(1),
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const existingDoc = snapshot.docs[0];
          const data = existingDoc.data();
          setSupportThreadId(existingDoc.id);

          const messages: ChatMessage[] = [
            { id: existingDoc.id, role: 'user', message: data.message || '', createdAt: data.createdAt },
          ];

          if (data.replies && Array.isArray(data.replies)) {
            data.replies.forEach((reply: any, index: number) => {
              messages.push({
                id: `${existingDoc.id}-reply-${index}`,
                role: reply.sender === 'admin' ? 'support' : 'user',
                message: reply.message,
                createdAt: reply.createdAt,
              });
            });
          }

          setChatMessages(messages);

          const docRef = doc(firestore, 'supportMessages', existingDoc.id);
          unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (!docSnap.exists()) return;
            const updated = docSnap.data();
            const updatedMessages: ChatMessage[] = [
              { id: docSnap.id, role: 'user', message: updated.message || '', createdAt: updated.createdAt },
            ];
            if (updated.replies && Array.isArray(updated.replies)) {
              updated.replies.forEach((reply: any, index: number) => {
                updatedMessages.push({
                  id: `${docSnap.id}-reply-${index}`,
                  role: reply.sender === 'admin' ? 'support' : 'user',
                  message: reply.message,
                  createdAt: reply.createdAt,
                });
              });
            }
            setChatMessages(updatedMessages);
          });
        } else {
          setChatMessages([
            { id: 'welcome', role: 'support', message: 'Hi! ?? Welcome to Busmo Support. How can we help you today?' },
          ]);
        }
      } catch (error) {
        console.error('Error loading support thread:', error);
        setChatMessages([
          { id: 'welcome', role: 'support', message: 'Hi! ?? Welcome to Busmo Support. How can we help you today?' },
        ]);
      }
    };

    loadThread();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || sending) return;

    const newMessage = chatMessage.trim();
    setChatMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: 'user', message: newMessage }]);
    setChatMessage('');
    setSending(true);

    try {
      const { firestore } = initializeFirebase();
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `no-auth-${Date.now()}`,
            role: 'support',
            message: 'Please log in or create an account to chat with our support team. You can also reach us at support@busmo.io',
          },
        ]);
        setSending(false);
        return;
      }

      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      const userData = userDoc.data();
      const userEmail = userData?.email || currentUser.email || 'unknown';
      const businessId = userData?.businessId || null;
      const businessName = userData?.businessName || null;

      if (supportThreadId) {
        const newReply = {
          message: newMessage,
          sender: 'user',
          createdAt: new Date().toISOString(),
        };
        const docRef = doc(firestore, 'supportMessages', supportThreadId);
        const docSnap = await getDoc(docRef);
        const existingReplies = docSnap.data()?.replies || [];

        await updateDoc(docRef, {
          replies: [...existingReplies, newReply],
          status: 'open',
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(firestore, 'supportMessages'), {
          userId: currentUser.uid,
          userEmail,
          businessId,
          businessName,
          message: newMessage,
          status: 'open',
          category: 'general',
          replies: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setSupportThreadId(docRef.id);
      }
    } catch (error) {
      console.error('Error sending support message:', error);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'support',
          message: 'Sorry, there was an error sending your message. Please try again or email us at support@busmo.io',
        },
      ]);
    } finally {
      setSending(false);
    }
  };
