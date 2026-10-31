'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
  title?: string;
};

/**
 * Mobile camera barcode capture using BarcodeDetector when available,
 * with manual entry fallback. Stops camera tracks on close.
 */
export function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
  title = 'Scan barcode',
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [usingCamera, setUsingCamera] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setUsingCamera(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stop();
      return;
    }
    let cancelled = false;
    async function start() {
      setError(null);
      const BD = (window as any).BarcodeDetector;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not available — enter the barcode manually.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setUsingCamera(true);

        if (typeof BD === 'function') {
          const detector = new BD({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
          });
          const tick = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes?.length) {
                const raw = String(codes[0].rawValue || '').trim();
                if (raw) {
                  stop();
                  onDetected(raw);
                  onClose();
                  return;
                }
              }
            } catch {
              /* frame miss */
            }
            rafRef.current = requestAnimationFrame(() => {
              void tick();
            });
          };
          rafRef.current = requestAnimationFrame(() => {
            void tick();
          });
        } else {
          setError('Live scan needs a supported browser. You can still type the code below.');
        }
      } catch {
        setError('Camera permission denied — enter the barcode manually.');
      }
    }
    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onClose, onDetected, stop]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,.72)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#0f1412',
          color: '#f5f7f5',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <strong>{title}</strong>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18 }}>
            ✕
          </button>
        </div>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '100%',
            borderRadius: 12,
            background: '#000',
            maxHeight: 280,
            objectFit: 'cover',
            display: usingCamera ? 'block' : 'none',
          }}
        />
        {error && <p style={{ color: '#fbbf24', fontSize: 13 }}>{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = manual.trim();
            if (!v) return;
            stop();
            onDetected(v);
            onClose();
          }}
          style={{ display: 'flex', gap: 8, marginTop: 12 }}
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Or type barcode / SKU"
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              border: '1px solid #344139',
              background: '#1b2420',
              color: '#fff',
              padding: '0 12px',
            }}
          />
          <button
            type="submit"
            style={{
              height: 44,
              padding: '0 14px',
              borderRadius: 10,
              border: 'none',
              background: '#42B775',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Use
          </button>
        </form>
      </div>
    </div>
  );
}
