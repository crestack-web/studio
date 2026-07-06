'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  createdAt: string;
}

interface SupportSectionProps {
  onNavigate?: (page: string) => void;
}

export const SupportSection: React.FC<SupportSectionProps> = ({ onNavigate }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [userEmail, setUserEmail] = useState('visitor');
  const [userId, setUserId] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if user is authenticated
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || 'user');
        setUserId(user.uid);
        
        // Fetch user's business data
        try {
          const { firestore } = initializeFirebase();
          if (firestore) {
            const userDoc = await getDoc(doc(firestore, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              setBusinessId(data.businessId || null);
              setBusinessName(data.businessName || null);
            }
          }
        } catch (error) {
          console.error('Error fetching user business data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: SupportMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userEmail,
          category: 'general',
          userId,
          businessId,
          businessName,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      const supportMsg: SupportMessage = {
        id: data.id || `support-${Date.now()}`,
        sender: 'support',
        text: data.reply || "Thanks for reaching out! Our team will get back to you shortly.",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, supportMsg]);
    } catch (err) {
      const fallback: SupportMessage = {
        id: `support-${Date.now()}`,
        sender: 'support',
        text: "Thanks for reaching out! Our team will get back to you shortly.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="support-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Support</div>
          <h2 className="section-title">Need Help?</h2>
          <p className="section-sub">Our team is here to help you succeed with Busmo.</p>
        </div>
        <div className="support-grid">
          <div className="support-card">
            <div className="support-icon">💬</div>
            <h3 className="support-title">Live Chat</h3>
            <p className="support-desc">Chat with our support team in real-time.</p>
          </div>
          <div className="support-card">
            <div className="support-icon">📧</div>
            <h3 className="support-title">Email Support</h3>
            <p className="support-desc">Send us an email and we'll respond within 24 hours.</p>
          </div>
          <div className="support-card">
            <div className="support-icon">📚</div>
            <h3 className="support-title">Help Center</h3>
            <p className="support-desc">Browse our documentation and tutorials.</p>
          </div>
        </div>

        <div className="support-chat">
          <div className="support-chat-header">
            <h3>Chat with Support</h3>
            <p>
              Type your question below and our support team will respond. For faster service,
              include your business name and email.
            </p>
          </div>

          {isChatOpen ? (
            <div className="chat-widget-overlay" onClick={() => setIsChatOpen(false)}>
              <div className="chat-widget" onClick={(e) => e.stopPropagation()}>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <div className="chat-avatar">🎧</div>
                    <div>
                      <p className="chat-title">Busmo Support</p>
                      <p className="chat-status">Online</p>
                    </div>
                  </div>
                  <button className="chat-close" onClick={() => setIsChatOpen(false)} aria-label="Close chat">
                    ✕
                  </button>
                </div>

                <div className="chat-messages" style={{ minHeight: '220px' }}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message ${msg.sender === 'user' ? 'user' : 'support'}`}
                    >
                      <div className="chat-bubble">{msg.text}</div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="chat-message support">
                      <div className="chat-bubble" style={{ opacity: 0.7 }}>
                        Support is typing...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  className="chat-input-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSending}
                  />
                  <button type="submit" className="chat-send" disabled={isSending || !input.trim()}>
                    ➤
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <button
              className="btn-primary"
              onClick={() => setIsChatOpen(true)}
              style={{ marginTop: '8px' }}
            >
              Start Chat
            </button>
          )}

          <p className="support-chat-meta">
            We usually reply within a few minutes during business hours.
          </p>
        </div>
      </div>
    </section>
  );
};