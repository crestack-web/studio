use client';

import React, { useEffect, useRef, useState } from 'react';
import type { IndustryConfig } from '@/lib/industries/types';
import { MoIcon } from './MoIcon';
import styles from './IndustryMO.module.css';

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
      text: `Hi — I'm MO for ${config.productName}. I know this is the ${config.shortName} product, not Busmo Business retail. Ask about operations, the staff desk, branding, or modules.`,
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const prompts = PROMPTS[config.id] || PROMPTS.professional;

  // Deep-link: #ask-mo opens panel (sidebar "Ask MO")
  useEffect(() => {
    const apply = () => {
      if (typeof window === 'undefined') return;
      if (window.location.hash === '#ask-mo') setOpen(true);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
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
        `I can help with ${config.productName}. Try the staff desk, branding, or pricing.`;
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

  function close() {
    setOpen(false);
    if (typeof window !== 'undefined' && window.location.hash === '#ask-mo') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        aria-label="Ask MO"
        onClick={() => setOpen(true)}
      >
        <span className={styles.fabIcon}>
          <MoIcon size={14} />
        </span>
        <span>Ask MO</span>
      </button>

      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Ask MO">
          <header className={styles.head}>
            <div className={styles.headBrand}>
              <span className={styles.headIcon}>
                <MoIcon size={16} />
              </span>
              <div>
                <strong>Ask MO</strong>
                <small>
                  {config.productName}
                  {businessName ? ` · ${businessName}` : ''}
                </small>
              </div>
            </div>
            <button type="button" className={styles.close} onClick={close} aria-label="Close">
              ×
            </button>
          </header>

          <div className={styles.context}>
            <MoIcon size={8} />
            <span>
              Industry context: <strong>{config.shortName}</strong> · Owner + staff ops
            </span>
          </div>

          <div className={styles.messages}>
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? styles.bubbleUser : styles.bubbleMo}>
                {m.role === 'mo' ? (
                  <div className={styles.moRow}>
                    <span className={styles.moAvatar}>
                      <MoIcon size={10} />
                    </span>
                    <div>
                      {m.text.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  m.text.split('\n').map((line, i) => <p key={i}>{line}</p>)
                )}
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
              placeholder={`Message MO about ${config.shortName.toLowerCase()}…`}
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
