'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2 } from 'lucide-react';

/* This file is restored - toast styles inlined for visibility. */

type Toast = { id: number; message: string };
type ToastContextValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<number[]>([]);

  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev.slice(-2), { id, message }]);
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
    timers.current.push(timer);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true">
        {items.map((t, i) => (
          <div
            key={t.id}
            className="sol-toast"
            style={{
              position: 'fixed',
              left: '50%',
              bottom: 24 + i * 56,
              transform: 'translateX(-50%)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              background: '#0f172a',
              color: '#f8fafc',
              borderRadius: 999,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 10px 30px rgba(15,23,42,0.28)',
              maxWidth: 'min(92vw, 420px)',
              pointerEvents: 'none',
            }}
          >
            <CheckCircle2 size={15} strokeWidth={2.2} aria-hidden color="#4ade80" />
            <span style={{ color: '#f8fafc' }}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
