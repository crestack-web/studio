import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from './AppContext';
import { Button } from './Button';
import { MoIcon } from './NavIcons';
import { MOMessage } from './types';
import { MO_SUGGESTIONS } from './mockData';
import styles from './AskMOPage.module.css';

// ═══════════════════════════════════════════
//  AskMOPage
//  Full-page AI chat interface
// ═══════════════════════════════════════════

function getMOReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('profit') || lower.includes('today'))
    return "Today's profit is ₦13,050 — a 29% margin. You're above the 20% healthy threshold. 🟢 Bottled Water is your highest margin at 40%. Consider stocking more.";
  if (lower.includes('restock') || lower.includes('inventory'))
    return 'Priority 1: Bottled Water (4 units left, runs out in ~2 days). Priority 2: Sabuni (7 units). Order 48 Bottled Water and 30 Sabuni ASAP — they drive 60% of your revenue.';
  if (lower.includes('expense') || lower.includes('spending'))
    return 'Expenses this month: ₦28,400 (24% of revenue). Slightly above the 20% healthy threshold. Top: Restocking ₦18K, Logistics ₦6K, Utilities ₦4.4K. Consider reducing logistics cost.';
  if (lower.includes('cash') || lower.includes('balance'))
    return 'Cash balance: ₦150,000 — approximately 45 days runway at current burn rate. You can safely invest ₦30K in high-margin restocking this month.';
  if (lower.includes('add') && lower.includes('product'))
    return "I've noted that! To add a product properly, go to Inventory → Add Product, or tap Quick Actions → Add Product. I'll help you price it optimally once you add the details.";
  if (lower.includes('sale') || lower.includes('sold'))
    return 'Got it! I can help you record that. Head to the Record Sale page, or tap Quick Actions → Record Sale. I can also note it here: tell me the product name and quantity.';
  return "Great question! Based on your current business data — 45 days of history, ₦150K cash, 29% margin — I'd recommend focusing on restocking high-margin products first. What specific aspect would you like me to analyse?";
}

export function AskMOPage() {
  const { navigateTo } = useApp();

  const [messages, setMessages] = useState<MOMessage[]>([
    {
      id: 'init',
      role: 'bot',
      content: "Hey Abdullahi 👋 I'm **MO**, your business AI.\n\nI have full context on your sales, inventory, expenses, and cashflow. Ask me anything or tap a suggestion below.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = useCallback((text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;

    const userMsg: MOMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = getMOReply(msg);
      const botMsg: MOMessage = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 700 + Math.random() * 400);
  }, [input]);

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
    // Bold markdown **text**
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
          <MoIcon size={18} />
        </div>
        <div className={styles.headerInfo}>
          <h2 className={styles.headerTitle}>Ask MO</h2>
          <div className={styles.status}>
            <span className={styles.statusDot} />
            Online · ready to help
          </div>
        </div>
        <Button variant="ghost" size="xs" onClick={() => navigateTo('home')}>← Back</Button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={[styles.message, msg.role === 'bot' ? styles.bot : styles.user].join(' ')}
          >
            {msg.role === 'bot' && (
              <div className={styles.moAvatarSm}>
                <MoIcon size={13} />
              </div>
            )}
            <div>
              <div className={[styles.bubble, msg.role === 'bot' ? styles.botBubble : styles.userBubble].join(' ')}>
                {typeof msg.content === 'string' ? formatContent(msg.content) : null}
              </div>
              <div className={styles.time}>
                {msg.timestamp.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className={[styles.message, styles.bot].join(' ')}>
            <div className={styles.moAvatarSm}><MoIcon size={13} /></div>
            <div className={styles.typingBubble}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className={styles.inputArea}>
        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className={styles.suggestions}>
            {MO_SUGGESTIONS.map(s => (
              <button key={s} className={styles.suggestion} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Ask anything about your business…"
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(e.target); }}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={() => send()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
