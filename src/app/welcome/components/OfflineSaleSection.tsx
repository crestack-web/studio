"use client";

import React, { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, CheckCircle2, RefreshCw, ShoppingBag } from "lucide-react";

type Phase = "online" | "offline" | "sale-recorded" | "syncing" | "synced";

export const OfflineSaleSection: React.FC = () => {
  const [phase, setPhase] = useState<Phase>("online");
  const [saleAmount] = useState("₦4,000");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cutNetwork = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("offline");
  };

  const recordSale = () => {
    if (phase !== "offline" && phase !== "sale-recorded") return;
    setPhase("sale-recorded");
  };

  const restoreNetwork = () => {
    if (phase !== "sale-recorded" && phase !== "offline") {
      setPhase("online");
      return;
    }
    setPhase("syncing");
    timerRef.current = setTimeout(() => {
      setPhase("synced");
      timerRef.current = setTimeout(() => setPhase("online"), 2200);
    }, 1600);
  };

  const isOffline = phase === "offline" || phase === "sale-recorded";
  const networkOn = phase === "online" || phase === "synced" || phase === "syncing";

  return (
    <section className="offline-sale-section">
      <div className="offline-sale-content">
        <div className="section-head center">
          <div className="section-label">Works Offline</div>
          <h2 className="section-title">
            Your business doesn&apos;t stop when the internet does.
          </h2>
          <p className="section-sub">
            Toggle the network, record a sale offline, then flip it back — watch Busmo sync.
          </p>
        </div>

        <div className="offline-demo">
          <div className="offline-demo-status">
            <div className={`offline-pill ${isOffline ? "off" : "on"}`}>
              {isOffline ? <WifiOff size={16} /> : <Wifi size={16} />}
              <span>{isOffline ? "Network offline" : phase === "syncing" ? "Reconnecting…" : "Network online"}</span>
            </div>
            <button
              type="button"
              className={`offline-toggle ${networkOn ? "on" : "off"}`}
              onClick={() => (networkOn ? cutNetwork() : restoreNetwork())}
              aria-pressed={networkOn}
            >
              <span className="offline-toggle-knob" />
              <span className="offline-toggle-label">{networkOn ? "Online" : "Offline"}</span>
            </button>
          </div>

          <div className={`offline-phone ${isOffline ? "is-offline" : ""}`}>
            <div className="offline-phone-bar">
              <span>Record sale</span>
              {isOffline && <span className="offline-badge">Offline mode</span>}
            </div>

            <div className="offline-phone-body">
              {phase === "online" && (
                <>
                  <p className="offline-hint">You&apos;re online. Cut the network to try an offline sale.</p>
                  <button type="button" className="btn-outline offline-btn" onClick={cutNetwork}>
                    <WifiOff size={16} /> Cut network
                  </button>
                </>
              )}

              {(phase === "offline" || phase === "sale-recorded") && (
                <>
                  <div className="offline-product">
                    <ShoppingBag size={20} />
                    <div>
                      <div className="offline-product-name">Indomie (×5)</div>
                      <div className="offline-product-price">{saleAmount}</div>
                    </div>
                  </div>
                  {phase === "offline" ? (
                    <button type="button" className="btn-primary offline-btn" onClick={recordSale}>
                      Record sale offline
                    </button>
                  ) : (
                    <div className="offline-recorded">
                      <CheckCircle2 size={18} color="#16A34A" />
                      <div>
                        <strong>Sale saved locally</strong>
                        <div className="offline-recorded-sub">Queued to sync when you reconnect</div>
                      </div>
                    </div>
                  )}
                  {phase === "sale-recorded" && (
                    <button type="button" className="btn-outline offline-btn" onClick={restoreNetwork}>
                      <Wifi size={16} /> Restore network
                    </button>
                  )}
                </>
              )}

              {phase === "syncing" && (
                <div className="offline-sync">
                  <RefreshCw size={28} className="offline-spin" />
                  <p>Syncing offline sales…</p>
                  <div className="offline-progress">
                    <div className="offline-progress-bar" />
                  </div>
                </div>
              )}

              {phase === "synced" && (
                <div className="offline-synced">
                  <CheckCircle2 size={32} color="#16A34A" />
                  <p>
                    <strong>{saleAmount} sale</strong> synced to your books
                  </p>
                  <p className="offline-recorded-sub">Inventory &amp; cash updated</p>
                </div>
              )}
            </div>
          </div>

          <p className="offline-footnote">
            Demo only — your real data stays on device until a secure sync completes.
          </p>
        </div>
      </div>

      <style jsx>{`
        .offline-demo { max-width: 420px; margin: 28px auto 0; }
        .offline-demo-status { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .offline-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
        .offline-pill.on { background: #ecfdf5; color: #047857; }
        .offline-pill.off { background: #fef2f2; color: #b91c1c; }
        .offline-toggle { position: relative; width: 92px; height: 36px; border-radius: 999px; border: none; cursor: pointer; transition: background 0.25s; padding: 0 10px; display: flex; align-items: center; }
        .offline-toggle.on { background: #6b3fe7; justify-content: flex-end; }
        .offline-toggle.off { background: #9ca3af; justify-content: flex-start; }
        .offline-toggle-knob { position: absolute; top: 4px; width: 28px; height: 28px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.2); transition: left 0.25s; }
        .offline-toggle.on .offline-toggle-knob { left: 60px; }
        .offline-toggle.off .offline-toggle-knob { left: 4px; }
        .offline-toggle-label { color: #fff; font-size: 0.7rem; font-weight: 700; z-index: 1; margin: 0 4px; }
        .offline-phone { background: #fff; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden; box-shadow: 0 12px 40px rgba(107,63,231,0.1); transition: border-color 0.3s; }
        .offline-phone.is-offline { border-color: #fca5a5; }
        .offline-phone-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: linear-gradient(135deg, #6b3fe7, #a855f7); color: #fff; font-weight: 600; font-size: 0.95rem; }
        .offline-badge { font-size: 0.7rem; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 999px; }
        .offline-phone-body { padding: 24px 18px; min-height: 200px; display: flex; flex-direction: column; align-items: stretch; gap: 14px; }
        .offline-hint { color: #6b7280; font-size: 0.9rem; text-align: center; margin: 0; }
        .offline-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
        .offline-product { display: flex; align-items: center; gap: 12px; padding: 14px; background: #f8f7ff; border-radius: 12px; }
        .offline-product-name { font-weight: 600; color: #0a0a0f; }
        .offline-product-price { color: #6b3fe7; font-weight: 700; }
        .offline-recorded, .offline-synced { display: flex; align-items: center; gap: 12px; padding: 14px; background: #ecfdf5; border-radius: 12px; }
        .offline-synced { flex-direction: column; text-align: center; padding: 28px 14px; }
        .offline-recorded-sub { font-size: 0.8rem; color: #6b7280; }
        .offline-sync { text-align: center; padding: 20px 0; color: #6b3fe7; }
        .offline-spin { animation: offline-spin 1s linear infinite; }
        @keyframes offline-spin { to { transform: rotate(360deg); } }
        .offline-progress { height: 6px; background: #ede9fe; border-radius: 999px; overflow: hidden; margin-top: 12px; }
        .offline-progress-bar { height: 100%; width: 0; background: #6b3fe7; border-radius: 999px; animation: offline-progress 1.5s ease-out forwards; }
        @keyframes offline-progress { to { width: 100%; } }
        .offline-footnote { text-align: center; font-size: 0.75rem; color: #9ca3af; margin-top: 14px; }
      `}</style>
    </section>
  );
};
