'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useTranslation } from './LangContext';
import { MoIcon } from './NavIcons';
import { MoThinking } from '@/components/mo-thinking';
import { initializeFirebase } from '@/firebase';
import { getFirestore, collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './AskMOPage.module.css';

// MO Suggestions - now using translation keys
const MO_SUGGESTIONS_KEYS = [
  { label: 'mo.suggest.sales', icon: '💰' },
  { label: 'mo.suggest.profit', icon: '📈' },
  { label: 'mo.suggest.stock', icon: '📦' },
  { label: 'mo.suggest.expenses', icon: '💸' },
  { label: 'mo.suggest.customers', icon: '👥' },
  { label: 'mo.suggest.tips', icon: '💡' },
];

// Plan-based limitations
const PLAN_LIMITS = {
  starter: { messagesPerDay: 10, features: ['basic_insights', 'sales_summary'] },
  standard: { messagesPerDay: 50, features: ['basic_insights', 'sales_summary', 'forecasts', 'inventory_tips'] },
  pro: { messagesPerDay: -1, features: ['basic_insights', 'sales_summary', 'forecasts', 'inventory_tips', 'premium_consulting', 'custom_reports'] }, // -1 = unlimited
};

interface MOMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

// ═══════════════════════════════════════════
//  AskMOPage - Conversational AI with Plan Limits
//  Full-page AI chat with Qwen integration
// ═══════════════════════════════════════════

export function AskMOPage() {
  const { user, showToast } = useApp();
  const { format } = useCurrency();
  const { t, lang, langMeta } = useTranslation();

  const [messages, setMessages] = useState<MOMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messagesToday, setMessagesToday] = useState(0);
  const [planLimit, setPlanLimit] = useState(10);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's plan and message history
  useEffect(() => {
    const loadPlanLimits = async () => {
      try {
        const { firestore } = initializeFirebase();
        const userPlan = user.plan?.toLowerCase() || 'starter';
        const limits = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;

        setPlanLimit(limits.messagesPerDay);

        // Count messages sent today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = Timestamp.fromDate(today);

        const messagesQuery = query(
          collection(firestore, 'users', user.id, 'mo_messages'),
          where('timestamp', '>=', todayStart)
        );

        const snapshot = await getDocs(messagesQuery);
        setMessagesToday(snapshot.size);

        // Load conversation history (last 20 messages)
        const historyQuery = query(
          collection(firestore, 'users', user.id, 'mo_messages'),
          where('timestamp', '<=', Timestamp.now())
        );

        const historySnapshot = await getDocs(historyQuery);
        const history: MOMessage[] = [];
        historySnapshot.forEach(doc => {
          const data = doc.data();
          history.push({
            id: doc.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            imageUrl: data.imageUrl,
          });
        });

        // Sort by timestamp and take last 20
        history.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const recentHistory = history.slice(-20);

        if (recentHistory.length === 0) {
          // Initial greeting based on plan and language
          const planGreeting = userPlan === 'pro' ? '🌟 Pro' : userPlan === 'standard' ? '⭐ Standard' : '🚀 Starter';
          const greeting = t('mo.greeting');
          const intro = t('mo.intro');
          
          setMessages([{
            id: 'init',
            role: 'bot',
            content: `${greeting}\n\n${intro}\n\n${getPlanFeaturesMessage(userPlan, t)}`,
            timestamp: new Date(),
          }]);
        } else {
          setMessages(recentHistory);
        }
      } catch (error) {
        console.error('Error loading plan limits:', error);
      }
    };

    if (user.id) {
      loadPlanLimits();
    }
  }, [user, t]);

  const getPlanFeaturesMessage = (plan: string, t: (key: string) => string) => {
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter;
    const msgLimit = limits.messagesPerDay === -1 ? t('common.unlimited') || 'unlimited' : `${limits.messagesPerDay} ${t('mo.messagesPerDay') || 'messages/day'}`;

    if (plan === 'starter') {
      return t('mo.starterFeatures') || `You have **${msgLimit}**. I can help with basic sales insights and summaries.`;
    } else if (plan === 'standard') {
      return t('mo.standardFeatures') || `You have **${msgLimit}**. I can help with forecasts, inventory tips, and advanced insights.`;
    } else if (plan === 'pro') {
      return t('mo.proFeatures') || `You have **${msgLimit} messages**. I provide premium consulting and custom reports.`;
    }
    return '';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    
    // Check plan limits
    if (planLimit !== -1 && messagesToday >= planLimit) {
      showToast(`⚠️ You've reached your ${planLimit} message limit for today. Upgrade your plan for more messages!`);
      return;
    }
    
    if (!msg && !selectedImage) return;

    const userMsg: MOMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
      imageUrl: imagePreview || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setSelectedImage(null);
    setImagePreview(null);

    try {
      // Save user message to Firestore
      const { firestore } = initializeFirebase();
      await setDoc(doc(firestore, 'users', user.id, 'mo_messages', userMsg.id), {
        role: 'user',
        content: msg,
        timestamp: Timestamp.now(),
        imageUrl: imagePreview || null,
      });

      // Call Qwen API for AI response with comprehensive business context
      const response = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          image: imagePreview,
          merchantId: user.businessId || user.id,
          conversationHistory: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
          userPlan: user.plan || 'starter',
          language: lang, // Send user's selected language
          languageName: langMeta.name, // Send language native name
        }),
      });

      const data = await response.json();

      const botMsg: MOMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.answer || "I'm analysing your business data...",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);

      // Save bot response to Firestore
      await setDoc(doc(firestore, 'users', user.id, 'mo_messages', botMsg.id), {
        role: 'bot',
        content: botMsg.content,
        timestamp: Timestamp.now(),
      });

      // Update messages count
      setMessagesToday(prev => prev + 1);

      // If sale was recorded, show success
      if (data.saleRecorded) {
        showToast(`✅ Sale recorded successfully!`);
      }

      // If product was added, show success
      if (data.productAdded) {
        showToast(`✅ Product added to inventory!`);
      }
    } catch (error) {
      console.error('MO API error:', error);
      const botMsg: MOMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [input, selectedImage, imagePreview, messages, user, planLimit, messagesToday]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
  }

  function formatContent(content: string) {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/\*\*([^*]+)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
        {i < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.moAvatar}>
          <MoIcon size={28} />
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>Ask MO</h1>
          <div className={styles.status}>
            <span className={styles.statusDot}></span>
            <span>Online</span>
          </div>
          {planLimit !== -1 && (
            <div className={styles.planLimit} style={{ fontSize: '11px', color: messagesToday >= planLimit ? '#DC2626' : '#16A34A', marginTop: '4px' }}>
              {messagesToday} / {planLimit} messages today
            </div>
          )}
          {planLimit === -1 && (
            <div className={styles.planLimit} style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px' }}>
              ∞ Unlimited messages
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(m => (
          <div
            key={m.id}
            className={`${styles.message} ${m.role === 'user' ? styles.user : styles.bot}`}
          >
            {m.role === 'bot' && (
              <div className={styles.moAvatarSm}>
                <MoIcon size={16} />
              </div>
            )}
            <div className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : styles.botBubble}`}>
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt="Uploaded"
                  style={{
                    maxWidth: '200px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'block',
                  }}
                />
              )}
              <div className={styles.msgText}>
                {formatContent(m.content)}
              </div>
              <div className={styles.time}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.message} ${styles.bot}`}>
            <div className={styles.moAvatarSm}>
              <MoThinking size={24} />
            </div>
            <div className={styles.typingBubble}>
              <MoThinking size={32} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <div className={styles.suggestions}>
        {MO_SUGGESTIONS_KEYS.map(s => (
          <button
            key={s.label}
            className={styles.suggestion}
            onClick={() => send(t(s.label))}
            title={s.label}
          >
            {s.icon} {t(s.label)}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        {imagePreview && (
          <div className={styles.imagePreview}>
            <img src={imagePreview} alt="Preview" />
            <button
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className={styles.removeImageBtn}
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.inputRow}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={styles.imageUploadBtn}
            title="Upload image"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--bg)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16 }}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <textarea
            value={input}
            onChange={e => {
              setInput(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={handleKey}
            placeholder="Ask MO anything about your business..."
            ref={textareaRef}
            rows={1}
            className={styles.textarea}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() && !selectedImage}
            className={styles.sendBtn}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
