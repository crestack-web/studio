'use client';

import React, { useEffect, useState } from 'react';
import {
  captureInstallPrompt,
  dismissNudge,
  isRunningAsInstalledApp,
  promptPwaInstall,
  subscribeInstallAvailability,
  wasNudgeDismissedRecently,
} from '@/lib/pwa-install';

function isAppleDesktop(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Macintosh|Mac OS X/.test(ua) && !('ontouchend' in document);
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * In-app nudge to install Busmo as a desktop/mobile app.
 * Shown on the platform when the browser supports install (or Safari fallback tips).
 */
export function PwaInstallNudge() {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showSafariTip, setShowSafariTip] = useState(false);

  useEffect(() => {
    captureInstallPrompt();

    if (isRunningAsInstalledApp()) {
      setVisible(false);
      return;
    }
    if (wasNudgeDismissedRecently()) {
      setVisible(false);
      return;
    }

    const unsub = subscribeInstallAvailability((can) => {
      setCanPrompt(can);
      if (can) {
        setVisible(true);
        setShowSafariTip(false);
      }
    });

    // Delay so we don't flash on first paint; also show Safari tip if no prompt after a bit
    const t = window.setTimeout(() => {
      if (isRunningAsInstalledApp() || wasNudgeDismissedRecently()) return;
      if (getCanStillInstall()) {
        // Chrome/Edge may fire beforeinstallprompt slightly later
      }
      if (!getDeferred()) {
        // No native prompt — still nudge on desktop with manual path
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setShowSafariTip(true);
          setVisible(true);
        }
      }
    }, 2500);

    return () => {
      unsub();
      window.clearTimeout(t);
    };
  }, []);

  function getDeferred() {
    try {
      return (window as any).__busmoHasDeferred === true;
    } catch {
      return false;
    }
  }

  function getCanStillInstall() {
    return canPrompt;
  }

  // Keep canPrompt in sync for timeout path
  useEffect(() => {
    if (canPrompt) {
      try {
        (window as any).__busmoHasDeferred = true;
      } catch {
        /* ignore */
      }
    }
  }, [canPrompt]);

  if (!visible) return null;

  const onInstall = async () => {
    if (canPrompt) {
      setBusy(true);
      const outcome = await promptPwaInstall();
      setBusy(false);
      if (outcome === 'accepted') {
        setVisible(false);
        return;
      }
      // If dismissed or unavailable, leave tip visible for Safari-style install
      if (outcome === 'unavailable') {
        setShowSafariTip(true);
      }
      return;
    }
    setShowSafariTip(true);
  };

  const onDismiss = () => {
    dismissNudge();
    setVisible(false);
  };

  const tipText = isIos()
    ? 'Tap Share, then “Add to Home Screen”.'
    : isAppleDesktop()
      ? 'In Safari: File → Add to Dock (or Share → Add to Dock).'
      : 'Use your browser menu → Install Busmo / Install app.';

  return (
    <div
      role="dialog"
      aria-label="Install Busmo"
      style={{
        position: 'fixed',
        zIndex: 9998,
        left: 12,
        right: 12,
        bottom: 72,
        maxWidth: 420,
        margin: '0 auto',
        background: '#0A0A0F',
        color: '#fff',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: '#6B3FE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          B
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
            Install Busmo on this device
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}>
            {showSafariTip && !canPrompt
              ? tipText
              : 'Open Busmo like a desktop app — faster access, works offline, stays in your dock or taskbar.'}
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 18,
            cursor: 'pointer',
            padding: 4,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: '#fff',
            borderRadius: 10,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
        <button
          type="button"
          onClick={onInstall}
          disabled={busy}
          style={{
            background: '#6B3FE7',
            border: 'none',
            color: '#fff',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {canPrompt ? (busy ? 'Opening…' : 'Install app') : 'How to install'}
        </button>
      </div>
    </div>
  );
}
