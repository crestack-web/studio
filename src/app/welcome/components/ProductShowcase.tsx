"use client";

import React, { useState } from "react";

type TabId = "stock" | "money" | "insights" | "dashboard";

/** Full-quality Cloudinary product screenshots */
const CLOUD = "https://res.cloudinary.com/dzjoqbg2u/image/upload/f_auto,q_auto";

const SHOWCASE = {
  stock: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-1_wt7m0y.png`,
  money: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-4_tkqjdv.png`,
  insights: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-3_su3kyd.png`,
  dashboard: `${CLOUD}/v1790686392/Untitled_-_September_29_2026_at_12.40.58-2_pdg4z1.png`,
} as const;

const TABS: { id: TabId; label: string; title: string; body: string; src: string }[] = [
  {
    id: "stock",
    label: "Stock Control",
    title: "Know what you have before the shelf goes empty.",
    body: "Track ingredients, products, reorder alerts, and stock value — so costs and margins stay honest.",
    src: SHOWCASE.stock,
  },
  {
    id: "money",
    label: "Money Control",
    title: "Sales recorded. Cash matched.",
    body: "Reconcile cash, transfers, and POS against what should have come in — and surface shortages before they grow.",
    src: SHOWCASE.money,
  },
  {
    id: "insights",
    label: "Insights",
    title: "See what is selling — and what is draining profit.",
    body: "Top sellers, busy days, expense pressure, and staff performance in plain language, not spreadsheets.",
    src: SHOWCASE.insights,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    title: "One place for cash, margin, and stock truth.",
    body: "MO nudges, quick actions, and today's numbers — tuned to how your business actually runs.",
    src: SHOWCASE.dashboard,
  },
];

export const ProductShowcase: React.FC = () => {
  const [active, setActive] = useState<TabId>("stock");
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="product-showcase" aria-label="Product showcase">
      <div className="ps-inner">
        <div className="ps-copy">
          <div className="section-label">Built for operators</div>
          <h2 className="ps-headline">
            Business owners
            <br />
            <em>run on Busmo</em>
          </h2>
          <p className="ps-sub">
            Sales, stock, cash, and profit in one system — so you can control the business even when you are not in the shop.
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

          <div className="ps-feature-text" key={tab.id}>
            <h3 className="ps-feature-title">{tab.title}</h3>
            <p className="ps-feature-body">{tab.body}</p>
          </div>
        </div>

        <div className="ps-visual" aria-hidden={false}>
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
          padding: 72px 4% 88px;
          background: linear-gradient(180deg, #fafafc 0%, #f4f0ff 45%, #fafafc 100%);
          overflow: hidden;
        }
        .ps-inner {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 48px;
          align-items: center;
        }
        .ps-copy {
          max-width: 440px;
        }
        .ps-headline {
          font-family: var(--font-display, "Clash Display", system-ui, sans-serif);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          line-height: 1.15;
          color: var(--black, #0a0a0f);
          margin: 12px 0 16px;
          letter-spacing: -0.02em;
        }
        .ps-headline em {
          font-style: normal;
          color: var(--purple, #6b3fe7);
        }
        .ps-sub {
          font-size: 1.05rem;
          line-height: 1.65;
          color: var(--text-secondary, #555568);
          margin-bottom: 28px;
        }
        .ps-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 28px;
        }
        .ps-tab {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 10px 16px;
          border-radius: 100px;
          border: 1.5px solid var(--grey-200, #e8e8f0);
          background: #fff;
          color: var(--text-secondary, #555568);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ps-tab:hover {
          border-color: var(--purple, #6b3fe7);
          color: var(--purple, #6b3fe7);
        }
        .ps-tab.active {
          background: var(--purple, #6b3fe7);
          border-color: var(--purple, #6b3fe7);
          color: #fff;
          box-shadow: 0 4px 16px rgba(107, 63, 231, 0.28);
        }
        .ps-feature-title {
          font-family: var(--font-display, system-ui, sans-serif);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--black, #0a0a0f);
          margin-bottom: 8px;
          line-height: 1.35;
        }
        .ps-feature-body {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary, #555568);
          margin: 0;
        }
        .ps-visual {
          position: relative;
          min-height: 320px;
        }
        .ps-glow {
          position: absolute;
          inset: 10% -5% -5% 10%;
          background: radial-gradient(
            ellipse at 60% 40%,
            rgba(107, 63, 231, 0.22) 0%,
            rgba(139, 98, 240, 0.08) 45%,
            transparent 70%
          );
          filter: blur(24px);
          pointer-events: none;
        }
        .ps-frame {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #fff;
          border: 1px solid rgba(107, 63, 231, 0.12);
          box-shadow:
            0 4px 6px rgba(10, 10, 15, 0.04),
            0 24px 64px rgba(107, 63, 231, 0.14),
            0 0 0 1px rgba(255, 255, 255, 0.8) inset;
          transform: perspective(1200px) rotateY(-2deg) rotateX(1deg);
          transition: transform 0.4s ease;
        }
        .ps-frame:hover {
          transform: perspective(1200px) rotateY(0deg) rotateX(0deg);
        }
        .ps-shot {
          display: block;
          width: 100%;
          height: auto;
          vertical-align: top;
        }
        @media (max-width: 900px) {
          .ps-inner {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .ps-copy {
            max-width: 100%;
            text-align: center;
          }
          .ps-tabs {
            justify-content: center;
          }
          .ps-frame {
            transform: none;
          }
          .ps-frame:hover {
            transform: none;
          }
        }
        @media (max-width: 640px) {
          .product-showcase {
            padding: 48px 5% 56px;
          }
          .ps-headline {
            font-size: 1.5rem;
          }
          .ps-tab {
            font-size: 0.78rem;
            padding: 8px 12px;
          }
        }
      `}</style>
    </section>
  );
};
