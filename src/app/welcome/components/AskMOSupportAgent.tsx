'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Smartphone, Maximize2, Minimize2, UserRound } from 'lucide-react';
import { MoIcon } from '../../owner/dashboard/NavIcons';

const WHATSAPP_NUMBER = '+2349124559388';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`;
const SESSION_KEY = 'busmo_support_session_v1';

const QUICK_ACTIONS = [
  { id: '1', label: 'Record a Sale', icon: '💰', message: 'How do I record a sale?' },
  { id: '2', label: 'Inventory Help', icon: '📦', message: 'I need help managing inventory' },
  { id: '3', label: 'Expense Tracking', icon: '💸', message: 'How do I track expenses?' },
  { id: '4', label: 'Reports', icon: '📊', message: 'I need help with reports' },
  { id: '5', label: 'Payment Issue', icon: '💳', message: 'I have a payment issue' },
  { id: '6', label: 'WhatsApp Support', icon: '💬', message: 'I want to chat on WhatsApp' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  timestamp: string;
  senderRole?: string;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const AskMOSupportAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [humanMode, setHumanMode] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const mapServerMessages = (list: any[]): Message[] =>
    (list || []).map((m) => ({
      id: m.id,
      role: (m.role as Message['role']) || 'assistant',
      content: m.content,
      timestamp: m.createdAt || new Date().toISOString(),
      senderRole: m.senderRole,
    }));

  const syncFromServer = useCallback(async () => {
    const sessionId = sessionIdRef.current || getSessionId();
    sessionIdRef.current = sessionId;
    try {
      const res = await fetch(`/api/support/chat?sessionId=${encodeURIComponent(sessionId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ticket?.id) setTicketId(data.ticket.id);
      if (data.ticket?.needsHuman) setHumanMode(true);
      if (Array.isArray(data.messages) && data.messages.length) {
        setMessages(mapServerMessages(data.messages));
      }
    } catch {
      /* ignore poll errors */
    }
  }, []);

  // Poll while open (especially human mode) so agent replies appear live
  useEffect(() => {
    if (!isOpen) return;
    syncFromServer();
    const ms = humanMode ? 2500 : 8000;
    const t = setInterval(syncFromServer, ms);
    return () => clearInterval(t);
  }, [isOpen, humanMode, syncFromServer]);

  const open = () => {
    sessionIdRef.current = getSessionId();
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Hey there 👋 I'm **MO**, your Busmo AI. Ask me anything — or tap **Talk to a human** to chat with our support team in this same window.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const close = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const requestHuman = async () => {
    const sessionId = sessionIdRef.current || getSessionId();
    sessionIdRef.current = sessionId;
    setIsLoading(true);
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: 'I would like to speak with a human support agent.',
          requestHuman: true,
          guestEmail: guestEmail || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setHumanMode(true);
      if (data.ticketId) setTicketId(data.ticketId);
      if (data.messages?.length) setMessages(mapServerMessages(data.messages));
      else {
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: 'Connected to human support. An agent will reply here shortly.',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      console.error('requestHuman failed', err);
      // Still switch UI to human mode with reassuring message
      setHumanMode(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          role: 'system',
          content:
            'Ada from Busmo Support will respond here soon. If this is urgent, use WhatsApp below — your message may still appear in our inbox after a refresh.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const sessionId = sessionIdRef.current || getSessionId();
    sessionIdRef.current = sessionId;

    const trimmed = text.trim();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (humanMode) {
        const res = await fetch('/api/support/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: trimmed,
            requestHuman: false,
            guestEmail: guestEmail || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        if (data.ticketId) setTicketId(data.ticketId);
        if (data.messages?.length) setMessages(mapServerMessages(data.messages));
      } else {
        // AI reply first, then persist both sides for admin visibility
        let replyText =
          "I'm here to help! Could you tell me more? You can also talk to a human anytime.";
        try {
          const conversationHistory = messages.map((m) => ({
            role: m.role === 'agent' || m.role === 'system' ? 'assistant' : m.role,
            content: m.content,
          }));
          const res = await fetch('/api/ask-mo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmed, conversationHistory }),
          });
          if (res.ok) {
            const data = await res.json();
            replyText =
              data.answer || data.response || data.reply || replyText;
          }
        } catch {
          /* keep fallback */
        }

        const res = await fetch('/api/support/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message: trimmed,
            botReply: replyText,
            guestEmail: guestEmail || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.ticketId) setTicketId(data.ticketId);
        if (data.messages?.length) {
          setMessages(mapServerMessages(data.messages));
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `mo-${Date.now()}`,
              role: 'assistant',
              content: replyText,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `mo-${Date.now()}`,
          role: 'assistant',
          content:
            "I'm having trouble connecting right now. Please try again or reach us on WhatsApp.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[0]) => {
    if (action.id === '6') {
      window.open(WHATSAPP_URL, '_blank');
      return;
    }
    sendMessage(action.message);
  };

  const bubbleClass = (role: Message['role']) => {
    if (role === 'user') return 'bg-purple-600 text-white rounded-br-md';
    if (role === 'agent') return 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-bl-md';
    if (role === 'system') return 'bg-amber-50 text-amber-900 border border-amber-100 text-center w-full text-xs';
    return 'bg-gray-100 text-gray-800 rounded-bl-md';
  };

  return (
    <>
      {!isOpen ? (
        <button onClick={open} className="fixed bottom-6 right-6 z-50 group" aria-label="Ask MO Support">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110">
              <MoIcon size={12} />
            </div>
          </div>
        </button>
      ) : (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" onClick={close} />
          <div
            className={`fixed z-[101] bg-white shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
              isExpanded && !isMobile ? 'inset-0 rounded-none' : 'bottom-6 right-6 rounded-2xl'
            }`}
            style={{
              width: isExpanded && !isMobile ? '100vw' : isMobile ? 'calc(100% - 24px)' : '400px',
              height: isExpanded && !isMobile ? '100vh' : isMobile ? 'calc(100vh - 84px)' : '580px',
              maxHeight: isMobile || (isExpanded && !isMobile) ? 'none' : '580px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white p-4 overflow-hidden">
              <div className="relative flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    {humanMode ? <UserRound size={18} /> : <MoIcon size={14} />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-base leading-tight">
                      {humanMode ? 'Busmo Support' : 'Ask MO'}
                    </h2>
                    <p className="text-xs text-white/80 truncate">
                      {humanMode
                        ? 'Human agent · messages sync live'
                        : 'Busmo AI · or talk to a human'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!isMobile && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded((v) => !v)}
                      className="p-1.5 rounded-lg hover:bg-white/15"
                      aria-label={isExpanded ? 'Minimize' : 'Expand'}
                    >
                      {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  )}
                  <button type="button" onClick={close} className="p-1.5 rounded-lg hover:bg-white/15" aria-label="Close">
                    <X size={18} />
                  </button>
                </div>
              </div>
              {!humanMode && (
                <button
                  type="button"
                  onClick={requestHuman}
                  disabled={isLoading}
                  className="mt-3 w-full rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-2 text-xs font-semibold transition-colors"
                >
                  Talk to a human agent
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : m.role === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${bubbleClass(m.role)}`}
                  >
                    {m.role === 'agent' && (
                      <div className="text-[10px] font-semibold uppercase text-emerald-700 mb-0.5">Support agent</div>
                    )}
                    {m.content.replace(/\*\*(.*?)\*\*/g, '$1')}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-xs text-slate-500 px-1">{humanMode ? 'Sending…' : 'MO is typing…'}</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 bg-white p-3 space-y-2">
              {messages.length <= 2 && !humanMode && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleQuickAction(action)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        action.id === '6'
                          ? 'bg-green-500 text-white'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              )}

              {humanMode && (
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Your email (optional, helps us reply)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50"
                />
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex items-end gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={humanMode ? 'Message support…' : 'Ask MO anything…'}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium"
              >
                <Smartphone size={16} />
                WhatsApp
              </a>
              {ticketId && (
                <p className="text-[10px] text-center text-slate-400">Ticket {ticketId.slice(0, 8)}…</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
