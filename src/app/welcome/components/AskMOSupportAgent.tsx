'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, CheckCheck, Smartphone, Maximize2, Minimize2 } from 'lucide-react';
import { MoIcon } from '../../owner/dashboard/NavIcons';

const WHATSAPP_NUMBER = '+2349124559388';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}`;

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
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AskMOSupportAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const open = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hey there 👋 I'm **MO**, your Busmo AI. Ask me anything about Busmo — how it works, features, pricing, or help getting started.`,
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const close = () => {
    setIsOpen(false);
    setIsExpanded(false);
    setMessages([]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ask-mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory,
        }),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();
      const replyText = data.answer || data.response || data.reply || "I'm here to help! Could you tell me more?";

      const reply: Message = {
        id: `mo-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, reply]);
    } catch {
      const fallback: Message = {
        id: `mo-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again later or reach us on WhatsApp.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.id === '6') {
      window.open(WHATSAPP_URL, '_blank');
      return;
    }
    sendMessage(action.message);
  };

  return (
    <>
      {!isOpen ? (
        <button
          onClick={open}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Ask MO Support"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110">
              <MoIcon size={12} />
            </div>
          </div>
        </button>
      ) : (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-[fadeIn_0.2s_ease-out]"
            onClick={close}
          />
          <div
            className={`fixed z-[101] bg-white shadow-2xl overflow-hidden transition-all duration-300 flex flex-col ${
              isExpanded && !isMobile
                ? 'inset-0 rounded-none'
                : 'bottom-6 right-6 rounded-2xl animate-[slideUp_0.3s_ease-out]'
            }`}
            style={{
              width: isExpanded && !isMobile ? '100vw' : isMobile ? 'calc(100% - 24px)' : '400px',
              height: isExpanded && !isMobile ? '100vh' : isMobile ? 'calc(100vh - 84px)' : '580px',
              maxHeight: isMobile || (isExpanded && !isMobile) ? 'none' : '580px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 text-white p-5 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MoIcon size={14} />
                  </div>
                  <div>
                    <h2 className="font-bold text-base leading-tight">Ask MO</h2>
                    <p className="text-xs text-white/80">Busmo AI · Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!isMobile && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      aria-label={isExpanded ? 'Exit fullscreen' : 'Open fullscreen'}
                      title={isExpanded ? 'Exit fullscreen' : 'Open fullscreen'}
                    >
                      {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                  )}
                  <button onClick={close} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className={`overflow-y-auto p-4 space-y-4 bg-gray-50 ${isExpanded && !isMobile ? 'flex-1' : ''}`}
              style={{ height: isExpanded && !isMobile ? undefined : isMobile ? 'calc(100% - 270px)' : '340px' }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className={`text-[10px] ${msg.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'user' && (
                        <CheckCheck size={12} className="text-white/70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions + Input + WhatsApp */}
            <div className="border-t border-gray-200 bg-white p-3 space-y-3">
              {/* Quick actions (show when few messages) */}
              {messages.length <= 2 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                        action.id === '6'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                    >
                      {action.icon} {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-end gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask MO anything..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </form>

              {/* WhatsApp CTA */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <Smartphone size={18} />
                Chat with us on WhatsApp
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
};
