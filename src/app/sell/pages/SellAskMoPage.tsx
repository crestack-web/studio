'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSell } from '../context/SellContext';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import styles from './SellAskMoPage.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  storeUpdate?: Record<string, unknown> | null;
  newProduct?: Record<string, unknown> | null;
  applied?: boolean;
  productCreated?: boolean;
}

interface Suggestion {
  icon: string;
  label: string;
  message: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SUGGESTIONS: Suggestion[] = [
  { icon: '✏️', label: 'Change store name', message: 'Change my store name to ' },
  { icon: '🎨', label: 'Update colors', message: 'Change my store colors to something more vibrant' },
  { icon: '📦', label: 'Create a product', message: 'Create a digital product for my store' },
  { icon: '📚', label: 'Create an ebook', message: 'Create an ebook product for my store' },
  { icon: '💡', label: 'Collection ideas', message: 'Suggest some collection names for my store' },
  { icon: '🏷️', label: 'Update tagline', message: 'Change my store tagline to something catchy' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

let msgIdCounter = 0;
function nextMsgId(): string {
  return `msg_${Date.now()}_${++msgIdCounter}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SellAskMoPage() {
  const { storeConfig, user, showToast, navigateTo } = useSell();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'model'; parts: { text: string }[] }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // ── Send message ──────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      if (!user?.businessId) {
        showToast('Business ID not found. Please try again.', 'error');
        return;
      }

      const userMsg: ChatMessage = {
        id: nextMsgId(),
        role: 'user',
        text: text.trim(),
      };

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      const userHistoryEntry = {
        role: 'user' as const,
        parts: [{ text: text.trim() }],
      };

      try {
        const res = await fetch('/api/sell/ask-mo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            businessId: user.businessId,
            storeConfig: storeConfig ?? null,
            conversationHistory,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || data.details || 'Failed to get response');
        }

        const botMsg: ChatMessage = {
          id: nextMsgId(),
          role: 'bot',
          text: data.answer,
          storeUpdate: data.storeUpdate ?? null,
          newProduct: data.newProduct ?? null,
        };

        setMessages(prev => [...prev, botMsg]);
        setConversationHistory(prev => [
          ...prev,
          userHistoryEntry,
          { role: 'model', parts: [{ text: data.answer }] },
        ]);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Something went wrong';
        setMessages(prev => [
          ...prev,
          {
            id: nextMsgId(),
            role: 'bot',
            text: `Sorry, I couldn't process that. ${errMsg}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, user, storeConfig, conversationHistory, showToast]
  );

  // ── Apply store update ────────────────────────────────────────────────

  const applyStoreUpdate = useCallback(
    async (update: Record<string, unknown>, messageId: string) => {
      if (!user?.businessId) return;

      try {
        const { firestore } = initializeFirebase();
        const cfgRef = doc(firestore, 'businesses', user.businessId, 'store', 'config');

        // Filter out null values — only update changed fields
        const fieldsToUpdate: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(update)) {
          if (value !== null && value !== undefined && value !== '') {
            fieldsToUpdate[key] = value;
          }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
          showToast('No changes to apply', 'info');
          return;
        }

        await updateDoc(cfgRef, fieldsToUpdate);

        // Update local messages to mark as applied
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, applied: true } : msg
          )
        );

        showToast('Store updated successfully!', 'success');

        // Refresh store config
        // The parent context will handle this on next render
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        showToast(`Failed to update store: ${errMsg}`, 'error');
      }
    },
    [user, showToast]
  );

  // ── Handle new product created by API ─────────────────────────────────

  const markProductCreated = useCallback(
    (messageId: string) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, productCreated: true } : msg
        )
      );
      showToast('Product created and ready to sell!', 'success');
    },
    [showToast]
  );

  // ── Handle suggestion click ───────────────────────────────────────────

  const handleSuggestion = useCallback(
    (suggestion: Suggestion) => {
      // For "Change store name", just send as-is (user completes it)
      sendMessage(suggestion.message);
    },
    [sendMessage]
  );

  // ── Handle keyboard ───────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  // ── Auto-resize textarea ──────────────────────────────────────────────

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  // ── New chat ──────────────────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationHistory([]);
    setInput('');
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  const showWelcome = messages.length === 0 && !loading;

  return (
    <div className={styles.page}>
      <div className={styles.chatContainer}>
        {/* ── Messages Area ── */}
        <div className={styles.messagesArea}>
          {showWelcome ? (
            <div className={styles.welcomeState}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784793259/mo_sell_chat_ucbw3x.png"
                alt="MO"
                className={styles.moAvatar}
              />
              <h2 className={styles.welcomeTitle}>Hey! I&apos;m MO</h2>
              <p className={styles.welcomeSubtitle}>
                Your AI commerce assistant. I can help you edit your store, create digital products,
                and grow your business. What do you need?
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    className={styles.suggestionChip}
                    onClick={() => handleSuggestion(s)}
                  >
                    <span className={styles.suggestionIcon}>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`${styles.messageRow} ${styles[msg.role]}`}>
                  {msg.role === 'bot' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784793259/mo_sell_chat_ucbw3x.png"
                      alt="MO"
                      className={styles.botAvatar}
                    />
                  )}
                  <div>
                    <div className={styles.messageBubble}>{msg.text}</div>

                    {/* ── Store Update Card ── */}
                    {msg.storeUpdate && !isAllNull(msg.storeUpdate) && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionCardHeader}>
                          <span className={styles.actionCardIcon}>✏️</span>
                          Store Update
                        </div>
                        <div className={styles.actionCardBody}>
                          {Object.entries(msg.storeUpdate)
                            .filter(([, v]) => v !== null && v !== undefined)
                            .map(([key, value]) => (
                              <div key={key} className={styles.actionCardRow}>
                                <span className={styles.actionCardLabel}>
                                  {formatLabel(key)}
                                </span>
                                <span className={styles.actionCardValue}>
                                  {formatValue(key, value)}
                                </span>
                              </div>
                            ))}
                        </div>
                        <div className={styles.actionCardFooter}>
                          {msg.applied ? (
                            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                              ✓ Applied
                            </span>
                          ) : (
                            <>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                                onClick={() => applyStoreUpdate(msg.storeUpdate!, msg.id)}
                              >
                                Apply Changes
                              </button>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
                                onClick={() =>
                                  setMessages(prev =>
                                    prev.map(m =>
                                      m.id === msg.id
                                        ? { ...m, storeUpdate: null }
                                        : m
                                    )
                                  )
                                }
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── New Product Card ── */}
                    {msg.newProduct && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionCardHeader}>
                          <span className={styles.actionCardIcon}>📦</span>
                          New Product
                        </div>
                        <div className={styles.actionCardBody}>
                          <div className={styles.actionCardRow}>
                            <span className={styles.actionCardLabel}>Name</span>
                            <span className={styles.actionCardValue}>
                              {String(msg.newProduct.displayName)}
                            </span>
                          </div>
                          <div className={styles.actionCardRow}>
                            <span className={styles.actionCardLabel}>Type</span>
                            <span className={styles.actionCardValue}>
                              {String(msg.newProduct.productType)} /{' '}
                              {String(msg.newProduct.digitalSubtype)}
                            </span>
                          </div>
                          <div className={styles.actionCardRow}>
                            <span className={styles.actionCardLabel}>Price</span>
                            <span className={styles.actionCardValue}>
                              ₦{Number(msg.newProduct.price).toLocaleString()}
                            </span>
                          </div>
                          {msg.newProduct.category ? (
                            <div className={styles.actionCardRow}>
                              <span className={styles.actionCardLabel}>Category</span>
                              <span className={styles.actionCardValue}>
                                {String(msg.newProduct.category)}
                              </span>
                            </div>
                          ) : null}
                          {msg.newProduct.digitalFileUrl ? (
                            <div className={styles.actionCardRow}>
                              <span className={styles.actionCardLabel}>PDF</span>
                              <span className={styles.actionCardValue} style={{ color: '#16a34a' }}>
                                ✓ Generated
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className={styles.actionCardFooter}>
                          {msg.productCreated ? (
                            <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>
                              ✓ Product created — check your Products page
                            </span>
                          ) : (
                            <>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`}
                                onClick={() => markProductCreated(msg.id)}
                              >
                                Product Created
                              </button>
                              <button
                                className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`}
                                onClick={() =>
                                  setMessages(prev =>
                                    prev.map(m =>
                                      m.id === msg.id
                                        ? { ...m, newProduct: null }
                                        : m
                                    )
                                  )
                                }
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* ── Typing Indicator ── */}
              {loading && (
                <div className={styles.typingIndicator}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784793259/mo_sell_chat_ucbw3x.png"
                    alt="MO"
                    className={styles.botAvatar}
                  />
                  <div className={styles.typingDots}>
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                    <div className={styles.typingDot} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div className={styles.inputArea}>
          <div className={styles.inputWrapper}>
            {messages.length > 0 && (
              <button className={styles.newChatBtn} onClick={handleNewChat} title="Start new conversation">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New chat
              </button>
            )}
            <textarea
              ref={inputRef}
              className={styles.inputField}
              placeholder="Ask MO anything about your store..."
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              <svg
                className={styles.sendBtnIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Utility functions ───────────────────────────────────────────────────────

function isAllNull(obj: Record<string, unknown>): boolean {
  return Object.values(obj).every(v => v === null || v === undefined);
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function formatValue(key: string, value: unknown): React.ReactNode {
  if (key === 'primaryColor' || key === 'secondaryColor') {
    const hex = String(value);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: 3,
            background: hex,
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        />
        {hex}
      </span>
    );
  }
  return String(value ?? '');
}
