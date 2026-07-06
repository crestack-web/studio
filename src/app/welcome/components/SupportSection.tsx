'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeFirebase } from '@/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { chatwootService, ChatwootUser } from '@/lib/chatwoot';
import { CHATWOOT_CONFIG } from '@/lib/chatwoot-config';

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

  const getBotResponse = async (text: string, conversationHistory: any[] = []): Promise<string> => {
    if (!isBotMode) {
      return "I've requested a human agent. They'll be with you shortly. In the meantime, I can still help with general questions about Busmo.";
    }

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userEmail,
          userId,
          businessId,
          businessName,
          conversationHistory,
          requestHumanAgent: false,
        }),
      });

      if (!res.ok) throw new Error('Failed to get MO AI response');

      const data = await res.json();
      return data.reply || "I'm here to help! Could you tell me more about what you need?";
    } catch (error) {
      console.error('Error getting MO AI response:', error);
      return "I'm here to help! Could you tell me more about what you need?";
    }
  };

  const handleRequestHumanAgent = async () => {
    setIsBotMode(false);
    
    // Create Chatwoot conversation if enabled
    if (CHATWOOT_CONFIG.enabled) {
      const chatwootUser: ChatwootUser = {
        id: userId || userEmail,
        name: userEmail,
        email: userEmail,
        businessId: businessId || undefined,
        businessName: businessName || undefined,
      };
      
      await chatwootService.identifyUser(chatwootUser);
      await chatwootService.toggleChat(true);
    }

    const escalationMsg: SupportMessage = {
      id: `escalation-${Date.now()}`,
      sender: 'support',
      text: "I've connected you with our support team via Chatwoot. A human agent will be with you shortly. In the meantime, I can still help with general questions about Busmo if you need immediate assistance.",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, escalationMsg]);
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

    // Build conversation history for context
    const conversationHistory = messages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

    // Save user message to Firestore
    await saveMessageToFirestore(text, 'user');

    let replyText: string;

    if (isBotMode) {
      // Use MO AI for intelligent responses
      replyText = await getBotResponse(text, conversationHistory);
      
      const botMsg: SupportMessage = {
        id: `mo-${Date.now()}`,
        sender: 'support',
        text: replyText,
        createdAt: new Date().toISOString(),
      };
      
      // Save MO AI response to Firestore
      if (currentConversationId) {
        await saveMessageToFirestore(replyText, 'support', currentConversationId);
      }
      
      setMessages((prev) => [...prev, botMsg]);
      setIsSending(false);
    } else {
      // Human agent mode - integrate with Chatwoot
      try {
        if (CHATWOOT_CONFIG.enabled) {
          // Send message to Chatwoot
          const chatwootUser: ChatwootUser = {
            id: userId || userEmail,
            name: userEmail,
            email: userEmail,
            businessId: businessId || undefined,
            businessName: businessName || undefined,
          };
          
          await chatwootService.identifyUser(chatwootUser);
          await chatwootService.toggleChat(true);
          
          const supportMsg: SupportMessage = {
            id: `chatwoot-${Date.now()}`,
            sender: 'support',
            text: "I've opened a Chatwoot conversation for you. Please check the chat widget in the bottom right corner to continue with our support team.",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, supportMsg]);
        } else {
          // Fallback to old behavior if Chatwoot not enabled
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
              conversationHistory,
              requestHumanAgent: true,
            }),
          });

          if (!res.ok) throw new Error('Failed to send message');

          const data = await res.json();

          const supportMsg: SupportMessage = {
            id: data.id || `support-${Date.now()}`,
            sender: 'support',
            text: data.reply || "Thanks for reaching out! Our support team has been notified and will get back to you shortly.",
            createdAt: new Date().toISOString(),
          };

          setMessages((prev) => [...prev, supportMsg]);
        }
      } catch (err) {
        const fallback: SupportMessage = {
          id: `support-${Date.now()}`,
          sender: 'support',
          text: "Thanks for reaching out! Our support team has been notified and will get back to you shortly.",
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
                  <div className="chat-avatar">{isBotMode ? '🤖' : '👤'}</div>
                  <div>
                    <p className="chat-title">{isBotMode ? 'MO AI Assistant' : 'Human Support Agent'}</p>
                    <p className="chat-status">{isBotMode ? 'Online • AI-Powered' : 'Online • Agent'}</p>
                  </div>
                </div>
                {isBotMode && (
                  <button
                    onClick={handleRequestHumanAgent}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid #6B3FE7',
                      color: '#6B3FE7',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    title="Request human agent"
                  >
                    👤 Human
                  </button>
                )}
                <button className="chat-close" onClick={() => setIsChatOpen(false)} aria-label="Close chat" style={{ marginLeft: '8px' }}>
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
