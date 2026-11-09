'use client';

import { useEffect, useState } from 'react';
import {
  captureInstallPrompt,
  isRunningAsInstalledApp,
  promptPwaInstall,
  subscribeInstallAvailability,
} from '@/lib/pwa-install';
import styles from './SuiteChrome.module.css';

/**
 * Lets users install this industry solution as a standalone desktop/mobile app.
 * Opens on that solution's login screen so they don't need the full Busmo site.
 */
export function SuiteInstallAppButton({ productName }: { productName: string }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState<string | null>(null);

  useEffect(() => {
    captureInstallPrompt();
    if (isRunningAsInstalledApp()) {
      setInstalled(true);
      return;
    }
    const unsub = subscribeInstallAvailability(setCanPrompt);
    return () => unsub();
  }, []);

  if (installed) {
    return (
      <p className={styles.installHint}>
        You&apos;re using the {productName} app. Sign in below anytime — your dashboard opens here.
      </p>
    );
  }

  async function onInstall() {
    setBusy(true);
    setTip(null);
    const result = await promptPwaInstall();
    setBusy(false);
    if (result === 'accepted') {
      setInstalled(true);
      return;
    }
    if (result === 'unavailable') {
      // Manual install path for browsers without beforeinstallprompt (Safari, some desktop)
      const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);
      const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isIOS) {
        setTip('On iPhone/iPad: tap Share → Add to Home Screen to install this app.');
      } else if (isMac) {
        setTip('On Safari/Mac: File → Add to Dock (or Share → Add to Dock) to install this app.');
      } else {
        setTip(
          'In Chrome or Edge: open the browser menu (⋮) → Cast, save, and share → Install app / Install page as app.'
        );
      }
      return;
    }
  }

  return (
    <div className={styles.installBlock}>
      <button
        type="button"
        className={styles.btnInstall}
        onClick={onInstall}
        disabled={busy}
      >
        {busy ? 'Installing…' : canPrompt ? `Install ${productName} app` : `Download desktop app`}
      </button>
      <p className={styles.installHint}>
        Install once — open only {productName} login and your dashboard, without the full Busmo site.
      </p>
      {tip ? <p className={styles.installTip}>{tip}</p> : null}
    </div>
  );
}
