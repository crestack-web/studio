"use client";

import React, { useState } from "react";

type TabId = "stock" | "money" | "insights" | "dashboard";

const CLOUD = "https://res.cloudinary.com/dzjoqbg2u/image/upload/f_auto,q_auto";

const SHOWCASE = {
  stock: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-1_wt7m0y.png`,
  money: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-4_tkqjdv.png`,
  insights: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-3_su3kyd.png`,
  dashboard: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-2_pdg4z1.png`,
} as const;

const TABS: { id: TabId; label: string; src: string }[] = [
  { id: "stock", label: "Stock Control", src: SHOWCASE.stock },
  { id: "money", label: "Money Control", src: SHOWCASE.money },
  { id: "insights", label: "Insights", src: SHOWCASE.insights },
  { id: "dashboard", label: "Dashboard", src: SHOWCASE.dashboard },
];

export const ProductShowcase: React.FC = () => {
  const [active, setActive] = useState<TabId>("stock");
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="product-showcase" aria-label="Product showcase">
      <div className="ps-inner">
        <h2 className="ps-headline">
          Business owners
          <br />
          build on Busmo
        </h2>
        <p className="ps-sub">
          Sales, stock, cash, and profit — controlled even when you're not in the shop.
        </p>

        <div className="ps-tabs" role="tablist" aria-label="Product areas">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              className={`ps-tab${active === t.id ? " active" : ""}`}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ps-visual">
          <div className="ps-glow" />
          <div className="ps-frame">
            <img
              key={tab.id}
              src={tab.src}
              alt={tab.label}
              className="ps-shot"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>

      <style>{`
        .product-showcase {
          padding: 64px 5% 80px;
          background: #fff;
          overflow: hidden;
        }
        .ps-inner {
          max-width: 920px;
          margin: 0 auto;
          text-align: center;
        }
        .ps-headline {
          font-family: var(--font-display, system-ui, -apple-system, sans-serif);
          font-size: clamp(2rem, 5.5vw, 3.25rem);
          font-weight: 700;
          line-height: 1.12;
          color: #0a0a0f;
          margin: 0 0 16px;
          letter-spacing: -0.03em;
        }
        .ps-sub {
          font-size: clamp(1rem, 2.2vw, 1.2rem);
          line-height: 1.55;
          color: #555568;
          margin: 0 auto 28px;
          max-width: 420px;
        }
        .ps-tabs {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          gap: 8px;
          margin-bottom: 36px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding: 2px 4px 8px;
        }
        .ps-tabs::-webkit-scrollbar {
          display: none;
        }
        .ps-tab {
          flex-shrink: 0;
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 10px 18px;
          border-radius: 100px;
          border: none;
          background: #f3f3f5;
          color: #6b6b7b;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          white-space: nowrap;
        }
        .ps-tab:hover {
          background: #ebeaf0;
          color: #3a3a48;
        }
        .ps-tab.active {
          background: #e8e0ff;
          color: #5b2fd6;
          font-weight: 600;
        }
        .ps-visual {
          position: relative;
          max-width: 720px;
          margin: 0 auto;
        }
        .ps-glow {
          position: absolute;
          inset: 8% -8% -12% -8%;
          background: radial-gradient(
            ellipse at 50% 40%,
            rgba(107, 63, 231, 0.28) 0%,
            rgba(139, 98, 240, 0.1) 40%,
            transparent 70%
          );
          filter: blur(28px);
          pointer-events: none;
          border-radius: 40px;
        }
        .ps-frame {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow:
            0 2px 8px rgba(10, 10, 15, 0.04),
            0 20px 50px rgba(107, 63, 231, 0.12);
        }
        .ps-shot {
          display: block;
          width: 100%;
          height: auto;
        }
        @media (max-width: 640px) {
          .product-showcase {
            padding: 48px 4% 56px;
          }
          .ps-headline {
            font-size: 1.75rem;
          }
          .ps-sub {
            font-size: 0.95rem;
            margin-bottom: 22px;
          }
          .ps-tabs {
            justify-content: flex-start;
            margin-bottom: 28px;
            gap: 6px;
          }
          .ps-tab {
            font-size: 0.82rem;
            padding: 9px 14px;
          }
          .ps-frame {
            border-radius: 12px;
          }
        }
      `}</style>
    </section>
  );
};
