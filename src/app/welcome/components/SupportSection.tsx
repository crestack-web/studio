'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

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
  const [isBotMode, setIsBotMode] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
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

  const saveMessageToFirestore = async (text: string, sender: 'user' | 'support', parentMessageId?: string) => {
    try {
      const { firestore } = initializeFirebase();
      if (!firestore) return;

      if (sender === 'user') {
        const docRef = await addDoc(collection(firestore, 'supportMessages'), {
          userId: userId || userEmail,
          userEmail,
          businessId: businessId || null,
          businessName: businessName || null,
          message: text,
          status: 'unread',
          category: 'general',
          createdAt: serverTimestamp(),
          replies: [],
        });
        setCurrentConversationId(docRef.id);
      } else if (parentMessageId && currentConversationId) {
        const docRef = doc(firestore, 'supportMessages', parentMessageId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const replies = data.replies || [];
          replies.push({
            message: text,
            sender: 'admin',
            createdAt: new Date().toISOString(),
          });
          
          await updateDoc(docRef, {
            replies,
            status: 'open',
          });
        }
      }
    } catch (error) {
      console.error('Error saving message to Firestore:', error);
    }
  };

  const getBotResponse = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) {
      return "We have flexible pricing plans starting from ₦5,000/month. Would you like to see our full pricing details?";
    }
    if (lower.includes('demo') || lower.includes('trial') || lower.includes('try')) {
      return "Great choice! You can sign up for a 14-day free trial. No credit card required. Would you like me to help you get started?";
    }
    if (lower.includes('feature') || lower.includes('can it') || lower.includes('does it')) {
      return "Busmo offers inventory management, sales tracking, AI assistant (Mo), supplier management, and detailed analytics. What specific feature are you interested in?";
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello! 👋 Welcome to Busmo. How can I help you today? I can assist with pricing, features, demos, or any questions you have.";
    }
    if (lower.includes('agent') || lower.includes('human') || lower.includes('talk to someone')) {
      setIsBotMode(false);
      return "I'm connecting you to a support agent. They'll be with you shortly. In the meantime, please describe your issue.";
    }
    return "Thanks for your message! I can help with pricing, features, demos, and general questions. Or would you prefer to talk to a human agent?";
  };

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

    // Save user message to Firestore
    await saveMessageToFirestore(text, 'user');

    let replyText: string;

    if (isBotMode) {
      replyText = getBotResponse(text);
      const botMsg: SupportMessage = {
        id: `bot-${Date.now()}`,
        sender: 'support',
        text: replyText,
        createdAt: new Date().toISOString(),
      };
      
      // Save bot response to Firestore
      if (currentConversationId) {
        await saveMessageToFirestore(replyText, 'support', currentConversationId);
      }
      
      setMessages((prev) => [...prev, botMsg]);
      setIsSending(false);
    } else {
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
          createdAt: new Date().toString(),
        };
        setMessages((prev) => [...prev, fallback]);
      } finally {
        setIsSending(false);
      }
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

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            className="btn-primary"
            onClick={() => setIsChatOpen(true)}
            style={{ padding: '12px 32px', fontSize: '1rem' }}
          >
            💬 Chat with Support
          </button>
        </div>

        {isChatOpen && (
          <div className="chat-widget-overlay" onClick={() => setIsChatOpen(false)}>
            <div className="chat-widget" onClick={(e) => e.stopPropagation()}>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">🤖</div>
                  <div>
                    <p className="chat-title">{isBotMode ? 'Busmo Assistant' : 'Support Agent'}</p>
                    <p className="chat-status">{isBotMode ? 'Online • Bot' : 'Online • Agent'}</p>
                  </div>
                </div>
                <button className="chat-close" onClick={() => setIsChatOpen(false)} aria-label="Close chat">
                  ✕
                </button>
              </div>

              <div className="chat-messages">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#8888A0' }}>
                    <p style={{ fontSize: '0.875rem', marginBottom: '8px' }}>👋 Hi there!</p>
                    <p style={{ fontSize: '0.8rem' }}>I'm here to help. Ask me anything about Busmo.</p>
                  </div>
                )}
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
                      {isBotMode ? 'Typing...' : 'Agent is typing...'}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {isBotMode && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid #E8E8F0', background: '#FAFAFC' }}>
                  <button
                    onClick={() => setIsBotMode(false)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'transparent',
                      border: '1px solid #6B3FE7',
                      color: '#6B3FE7',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    👤 Talk to a Human Agent
                  </button>
                </div>
              )}

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
                  placeholder={isBotMode ? "Type your message..." : "Message agent..."}
                  disabled={isSending}
                />
                <button type="submit" className="chat-send" disabled={isSending || !input.trim()}>
                  ➤
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
