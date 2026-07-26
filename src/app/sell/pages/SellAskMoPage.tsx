'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSell } from '../context/SellContext';
import { doc, updateDoc, getDoc, setDoc, deleteDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
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

interface Conversation {
  id: string;
  preview: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
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

const MO_AVATAR = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784793259/mo_sell_chat_ucbw3x.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let msgIdCounter = 0;
function nextMsgId(): string {
  return `msg_${Date.now()}_${++msgIdCounter}`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getConvCollection(userId: string) {
  const { firestore } = initializeFirebase();
  return collection(firestore, 'businesses', userId, 'aiConversations');
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SellAskMoPage() {
  const { storeConfig, user, showToast } = useSell();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    { role: 'user' | 'model'; parts: { text: string }[] }[]
  >([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadedRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const historyRef = useRef<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);

  // Keep refs in sync
  messagesRef.current = messages;
  historyRef.current = conversationHistory;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  // ── Load active conversation from Firestore ────────────────────────────

  useEffect(() => {
    if (!user?.businessId || loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const convRef = doc(getConvCollection(user.businessId!), 'active');
        const snap = await getDoc(convRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.messages?.length) {
            setMessages(data.messages);
            setConversationHistory(data.conversationHistory ?? []);
            setActiveConvId('active');
          }
        }
      } catch {
        // Start fresh
      }
    })();
  }, [user?.businessId]);

  // ── Save active conversation ───────────────────────────────────────────

  const saveActive = useCallback(
    async (msgs: ChatMessage[], hist: { role: 'user' | 'model'; parts: { text: string }[] }[]) => {
      if (!user?.businessId || msgs.length === 0) return;
      try {
        const convRef = doc(getConvCollection(user.businessId), 'active');
        await setDoc(convRef, {
          messages: msgs,
          conversationHistory: hist,
          updatedAt: Date.now(),
        }, { merge: true });
      } catch { /* silent */ }
    },
    [user?.businessId]
  );

  // Auto-save (debounced)
  useEffect(() => {
    if (!loadedRef.current || messages.length === 0) return;
    const t = setTimeout(() => saveActive(messages, conversationHistory), 500);
    return () => clearTimeout(t);
  }, [messages, conversationHistory, saveActive]);

  // ── Load conversation history list ─────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!user?.businessId) return;
    setHistoryLoading(true);
    try {
      const q = query(
        getConvCollection(user.businessId),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      const list: Conversation[] = [];
      snap.forEach(d => {
        if (d.id === 'active') return;
        const data = d.data();
        list.push({
          id: d.id,
          preview: data.preview ?? data.messages?.[0]?.text?.slice(0, 60) ?? 'Empty conversation',
          messageCount: data.messages?.length ?? 0,
          createdAt: data.createdAt ?? data.updatedAt ?? 0,
          updatedAt: data.updatedAt ?? 0,
        });
      });
      setConversations(list);
    } catch { /* silent */ }
    setHistoryLoading(false);
  }, [user?.businessId]);

  useEffect(() => {
    if (historyOpen) loadHistory();
  }, [historyOpen, loadHistory]);

  // ── Load a past conversation ───────────────────────────────────────────

  const loadConversation = useCallback(
    async (convId: string) => {
      if (!user?.businessId) return;
      try {
        // Save current as history first
        if (messagesRef.current.length > 0) {
          const currentRef = doc(getConvCollection(user.businessId), 'current-' + Date.now());
          await setDoc(currentRef, {
            messages: messagesRef.current,
            conversationHistory: historyRef.current,
            preview: messagesRef.current.find(m => m.role === 'user')?.text?.slice(0, 60) ?? '',
            createdAt: historyRef.current[0] ? Date.now() : Date.now(),
            updatedAt: Date.now(),
          });
        }

        const snap = await getDoc(doc(getConvCollection(user.businessId), convId));
        if (snap.exists()) {
          const data = snap.data();
          setMessages(data.messages ?? []);
          setConversationHistory(data.conversationHistory ?? []);
          setActiveConvId(convId);
          setHistoryOpen(false);
        }
      } catch {
        showToast('Failed to load conversation', 'error');
      }
    },
    [user?.businessId, showToast]
  );

  // ── New chat ───────────────────────────────────────────────────────────

  const handleNewChat = useCallback(async () => {
    // Archive current conversation if it has messages
    if (user?.businessId && messagesRef.current.length > 0) {
      try {
        const archiveRef = doc(getConvCollection(user.businessId), 'archive-' + Date.now());
        await setDoc(archiveRef, {
          messages: messagesRef.current,
          conversationHistory: historyRef.current,
          preview: messagesRef.current.find(m => m.role === 'user')?.text?.slice(0, 60) ?? '',
          createdAt: historyRef.current.length > 0 ? Date.now() : Date.now(),
          updatedAt: Date.now(),
        });
        // Clear active
        const activeRef = doc(getConvCollection(user.businessId), 'active');
        await setDoc(activeRef, { messages: [], conversationHistory: [], updatedAt: Date.now() }, { merge: true });
      } catch { /* silent */ }
    }
    setMessages([]);
    setConversationHistory([]);
    setActiveConvId(null);
    setInput('');
  }, [user?.businessId]);

  // ── Delete a past conversation ─────────────────────────────────────────

  const deleteConversation = useCallback(
    async (convId: string) => {
      if (!user?.businessId) return;
      try {
        await deleteDoc(doc(getConvCollection(user.businessId), convId));
        setConversations(prev => prev.filter(c => c.id !== convId));
        showToast('Conversation deleted', 'info');
      } catch { /* silent */ }
    },
    [user?.businessId, showToast]
  );

  // ── Send message ───────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      if (!user?.businessId) {
        showToast('Business ID not found. Please try again.', 'error');
        return;
      }

      const userMsg: ChatMessage = { id: nextMsgId(), role: 'user', text: text.trim() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      const userHistoryEntry = { role: 'user' as const, parts: [{ text: text.trim() }] };

      try {
        const res = await fetch('/api/sell/ask-mo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            businessId: user.businessId,
            storeConfig: storeConfig ?? null,
            conversationHistory: conversationHistory,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.details || 'Failed to get response');

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
          { id: nextMsgId(), role: 'bot', text: `Sorry, I couldn't process that. ${errMsg}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, user, storeConfig, conversationHistory, showToast]
  );

  // ── Apply store update ─────────────────────────────────────────────────

  const applyStoreUpdate = useCallback(
    async (update: Record<string, unknown>, messageId: string) => {
      if (!user?.businessId) return;
      try {
        const { firestore } = initializeFirebase();
        const cfgRef = doc(firestore, 'businesses', user.businessId, 'store', 'config');
        const fieldsToUpdate: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(update)) {
          if (value !== null && value !== undefined && value !== '') fieldsToUpdate[key] = value;
        }
        if (Object.keys(fieldsToUpdate).length === 0) { showToast('No changes to apply', 'info'); return; }
        await updateDoc(cfgRef, fieldsToUpdate);
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, applied: true } : msg));
        showToast('Store updated successfully!', 'success');
      } catch (err) {
        showToast(`Failed to update store: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    },
    [user, showToast]
  );

  // ── Mark product created ───────────────────────────────────────────────

  const markProductCreated = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, productCreated: true } : msg));
    showToast('Product created and ready to sell!', 'success');
  }, [showToast]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleSuggestion = useCallback((s: Suggestion) => sendMessage(s.message), [sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
    },
    [input, sendMessage]
  );

  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const showWelcome = messages.length === 0 && !loading;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* ── Main Chat ── */}
      <div className={styles.chatContainer}>
        {/* ── Chat Header ── */}
        <div className={styles.chatHeader}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MO_AVATAR} alt="MO" className={styles.headerAvatar} />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>MO</span>
            <span className={styles.headerStatus}>AI Commerce Assistant</span>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.headerBtn}
              onClick={() => setHistoryOpen(true)}
              title="Chat history"
              aria-label="Open chat history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span className={styles.headerBtnLabel}>History</span>
            </button>
            <div className={styles.headerDivider} />
            <button
              className={styles.headerBtn}
              onClick={handleNewChat}
              title="Start new conversation"
              aria-label="New chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span className={styles.headerBtnLabel}>New</span>
            </button>
          </div>
        </div>

        {/* ── Messages Area ── */}
        <div className={styles.messagesArea}>
          {showWelcome ? (
            <div className={styles.welcomeState}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MO_AVATAR} alt="MO" className={styles.moAvatar} />
              <h2 className={styles.welcomeTitle}>Hey! I&apos;m MO</h2>
              <p className={styles.welcomeSubtitle}>
                Your AI commerce assistant. I can help you edit your store, create digital products,
                and grow your business. What do you need?
              </p>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} className={styles.suggestionChip} onClick={() => handleSuggestion(s)}>
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
                    <img src={MO_AVATAR} alt="MO" className={styles.botAvatar} />
                  )}
                  <div className={styles.messageContent}>
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
                                <span className={styles.actionCardLabel}>{formatLabel(key)}</span>
                                <span className={styles.actionCardValue}>{formatValue(key, value)}</span>
                              </div>
                            ))}
                        </div>
                        <div className={styles.actionCardFooter}>
                          {msg.applied ? (
                            <span className={styles.appliedLabel}>✓ Applied</span>
                          ) : (
                            <>
                              <button className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`} onClick={() => applyStoreUpdate(msg.storeUpdate!, msg.id)}>Apply Changes</button>
                              <button className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`} onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, storeUpdate: null } : m))}>Dismiss</button>
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
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Name</span><span className={styles.actionCardValue}>{String(msg.newProduct.displayName)}</span></div>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Type</span><span className={styles.actionCardValue}>{String(msg.newProduct.productType)} / {String(msg.newProduct.digitalSubtype)}</span></div>
                          <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Price</span><span className={styles.actionCardValue}>₦{Number(msg.newProduct.price).toLocaleString()}</span></div>
                          {msg.newProduct.category ? <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>Category</span><span className={styles.actionCardValue}>{String(msg.newProduct.category)}</span></div> : null}
                          {msg.newProduct.digitalFileUrl ? <div className={styles.actionCardRow}><span className={styles.actionCardLabel}>PDF</span><span className={styles.actionCardValue} style={{ color: '#16a34a' }}>✓ Generated</span></div> : null}
                        </div>
                        <div className={styles.actionCardFooter}>
                          {msg.productCreated ? (
                            <span className={styles.appliedLabel}>✓ Product created — check your Products page</span>
                          ) : (
                            <>
                              <button className={`${styles.confirmBtn} ${styles.confirmBtnPrimary}`} onClick={() => markProductCreated(msg.id)}>Product Created</button>
                              <button className={`${styles.confirmBtn} ${styles.confirmBtnSecondary}`} onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, newProduct: null } : m))}>Dismiss</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className={`${styles.messageRow} ${styles.bot}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={MO_AVATAR} alt="MO" className={styles.botAvatar} />
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
            <textarea
              ref={inputRef}
              className={styles.inputField}
              placeholder="Ask MO anything about your store..."
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
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
              <svg className={styles.sendBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>MO can update your store and create products. Always review changes before publishing.</p>
        </div>
      </div>

      {/* ── History Panel (after chat so z-index wins) ── */}
      {historyOpen && <div className={styles.historyBackdrop} onClick={() => setHistoryOpen(false)} />}
      <div className={`${styles.historyPanel} ${historyOpen ? styles.historyPanelOpen : ''}`}>
        <div className={styles.historyHeader}>
          <span className={styles.historyTitle}>Chat History</span>
          <button className={styles.historyClose} onClick={() => setHistoryOpen(false)} aria-label="Close history">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className={styles.historyList}>
          {historyLoading && <p className={styles.historyEmpty}>Loading...</p>}
          {!historyLoading && conversations.length === 0 && (
            <p className={styles.historyEmpty}>No past conversations yet.</p>
          )}
          {conversations.map(c => (
            <div key={c.id} className={styles.historyItem} onClick={() => loadConversation(c.id)}>
              <div className={styles.historyItemContent}>
                <p className={styles.historyItemPreview}>{c.preview}</p>
                <p className={styles.historyItemMeta}>{c.messageCount} messages · {timeAgo(c.updatedAt)}</p>
              </div>
              <button
                className={styles.historyItemDelete}
                onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                aria-label="Delete conversation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          ))}
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
        <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: hex, border: '1px solid rgba(0,0,0,0.1)' }} />
        {hex}
      </span>
    );
  }
  return String(value ?? '');
}
