'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { IndustryConfig } from '@/lib/industries/types';
import styles from './IndustryMO.module.css';
import { MoIcon } from '@/app/owner/dashboard/NavIcons';

type Msg = { id: string; role: 'user' | 'mo'; text: string };

const PROMPTS: Record<string, string[]> = {
  hospitality: [
    'How do I check in a guest?',
    'Where is the staff front desk?',
    'How do I set the hotel logo?',
  ],
  healthcare: [
    'How do I check in a walk-in?',
    'What is on the reception desk?',
    'How do I set clinic branding?',
  ],
  education: [
    'How do I record a fee?',
    'Where do staff collect fees?',
    'How does student pricing work?',
  ],
  professional: [
    'How do I add a staff task?',
    'What is the staff workspace?',
    'How do I set firm branding?',
  ],
};

export function IndustryMO({
  config,
  businessName,
}: {
  config: IndustryConfig;
  businessName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      id: 'welcome',
      role: 'mo',
      text: `Hi — I'm MO for **${config.productName}**. Ask about ${config.shortName.toLowerCase()} operations, the staff desk, branding, or how modules fit together.`,
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const prompts = PROMPTS[config.id] || PROMPTS.professional;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const res = await fetch('/api/industries/mo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          industry: config.id,
          businessName: businessName || config.productName,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const reply =
        json.reply ||
        json.error ||
        `I can help with ${config.productName}. Try asking about the staff desk or branding.`;
      setMessages((m) => [...m, { id: `m-${Date.now()}`, role: 'mo', text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `m-${Date.now()}`,
          role: 'mo',
          text: 'Something went wrong reaching MO. Try again in a moment.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        aria-label="Open MO"
        onClick={() => setOpen(true)}
      >
        <span className={styles.fabIcon}>
          <MoIcon size={14} />
        </span>
        <span>MO</span>
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Ask MO">
          <header className={styles.head}>
            <div className={styles.headBrand}>
              <span className={styles.headIcon}>
                <MoIcon size={16} />
              </span>
              <div>
                <strong>MO</strong>
                <small>
                  {config.productName}
                  {businessName ? ` · ${businessName}` : ''}
                </small>
              </div>
            </div>
            <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </header>

          <div className={styles.context}>
            Industry: <strong>{config.shortName}</strong> · Staff desk + owner modules
          </div>

          <div className={styles.messages}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={m.role === 'user' ? styles.bubbleUser : styles.bubbleMo}
              >
                {m.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ))}
            {busy ? <div className={styles.typing}>MO is thinking…</div> : null}
            <div ref={endRef} />
          </div>

          <div className={styles.prompts}>
            {prompts.map((p) => (
              <button key={p} type="button" onClick={() => send(p)} disabled={busy}>
                {p}
              </button>
            ))}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask MO about ${config.shortName.toLowerCase()}…`}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
