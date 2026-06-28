import { writeFileSync } from 'fs';
const p = 'C:/busmo v1.1/studio/src/app/welcome/components/SupportSection.tsx';
const content = `'use client';

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
`;
writeFileSync(p, content + '\n---PENDING---\n');