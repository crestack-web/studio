'use client';

import React, { useState } from 'react';
import {
  BUSMO_ONE_CONFIG,
  formatNgn,
  bundleValueNgn,
  savingsNgn,
  getBusmoOneChargePrice,
} from '@/lib/busmo-one/config';
import { isBlackFridayActive } from '@/lib/pricing';
import { BusmoOnePreorderModal } from './BusmoOnePreorderModal';

const FEATURES = [
  { title: 'Smart Checkout', body: 'Fast sale flow designed for counter and terminal use.' },
  { title: 'Barcode & SKU', body: 'Look up products by scan or code inside Busmo inventory.' },
  { title: 'Inventory Control', body: 'Stock stays tied to the same Busmo product records.' },
  { title: 'Staff Sales Tracking', body: 'Cashiers work in Terminal Mode; owners see sales on the dashboard.' },
  { title: 'Business Visibility', body: 'One platform for sales, stock, and day-to-day control.' },
];

export function BusmoOneSection() {
  const [open, setOpen] = useState(false);
  const pricing = getBusmoOneChargePrice();
  const bf = isBlackFridayActive();

  return (
    <section className="busmo-one-section" id="busmo-one" aria-labelledby="busmo-one-heading">
      <style>{`
        .busmo-one-section {
          padding: 56px 20px;
          background: linear-gradient(180deg, #f3faf6 0%, #ffffff 48%, #f7fbf8 100%);
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
          min-height: 320px;
          color: #0A1F14;
        }
        .busmo-one-inner { max-width: 1100px; margin: 0 auto; }
        .busmo-one-hero {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 40px;
          align-items: center;
        }
        @media (max-width: 860px) {
          .busmo-one-hero { grid-template-columns: 1fr; gap: 28px; }
        }
        .busmo-one-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #0D7A43;
          background: #D1FAE5;
          padding: 6px 10px;
          border-radius: 999px;
          margin-bottom: 12px;
        }
        .busmo-one-eyebrow {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #14A05A;
          margin-bottom: 8px;
        }
        .busmo-one-hero h2 {
          font-size: clamp(1.6rem, 3vw, 2.35rem);
          line-height: 1.15;
          margin: 0 0 14px;
          color: #0A1F14;
        }
        .busmo-one-hero p {
          color: #3D6652;
          font-size: 1.02rem;
          line-height: 1.55;
          margin: 0 0 16px;
          max-width: 34rem;
        }
        .busmo-one-price {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 16px;
          align-items: baseline;
          margin: 0 0 18px;
        }
        .busmo-one-price strong { font-size: 1.35rem; color: #0A1F14; }
        .busmo-one-price s { color: #82A993; font-size: 0.95rem; }
        .busmo-one-offer {
          font-size: 0.9rem;
          color: #0D7A43;
          font-weight: 600;
          margin-bottom: 18px;
        }
        .busmo-one-ctas { display: flex; flex-wrap: wrap; gap: 10px; }
        .busmo-one-btn-primary {
          height: 48px;
          padding: 0 18px;
          border-radius: 12px;
          border: none;
          background: #14A05A;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .busmo-one-btn-secondary {
          height: 48px;
          padding: 0 18px;
          border-radius: 12px;
          border: 1.5px solid #C6EEDA;
          background: #fff;
          color: #0D7A43;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .busmo-one-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-top: 36px;
        }
        .busmo-one-card {
          background: #fff;
          border: 1px solid #DDF3E8;
          border-radius: 14px;
          padding: 14px 14px 16px;
        }
        .busmo-one-card h3 { margin: 0 0 6px; font-size: 0.95rem; color: #0A1F14; }
        .busmo-one-card p { margin: 0; font-size: 0.82rem; color: #3D6652; line-height: 1.45; }
        .busmo-one-bottom {
          margin-top: 36px;
          text-align: center;
          padding: 28px 16px;
          border-radius: 16px;
          background: #0E2218;
          color: #E0F7EC;
        }
        .busmo-one-bottom h3 { margin: 0 0 8px; font-size: 1.25rem; }
        .busmo-one-bottom p { margin: 0 0 16px; opacity: 0.85; }
        .busmo-one-note { font-size: 0.78rem; color: #82A993; margin-top: 10px; }
      `}</style>

      <div className="busmo-one-inner">
        <div className="busmo-one-hero">
          <div>
            <span className="busmo-one-badge">{bf ? 'BLACK FRIDAY' : 'HARDWARE + SOFTWARE'}</span>
            <p className="busmo-one-eyebrow">{BUSMO_ONE_CONFIG.tagline}</p>
            <h2 id="busmo-one-heading">Run your counter on Busmo One</h2>
            <p>
              A smart business terminal that checks out sales, tracks stock, and stays connected to your Busmo
              account — with {BUSMO_ONE_CONFIG.promotionLabel} for founding buyers.
            </p>
            <div className="busmo-one-price">
              <strong>{formatNgn(pricing.charge)}</strong>
              {pricing.saleActive ? <s>{formatNgn(pricing.list)}</s> : null}
              <span>{pricing.saleActive ? 'Black Friday terminal price' : 'Terminal price'}</span>
            </div>
            <p className="busmo-one-offer">
              Bundle value up to {formatNgn(bundleValueNgn())} · save about {formatNgn(savingsNgn())} on Scale
              {pricing.saleActive ? ` · extra ${pricing.percentOff}% off terminal this Black Friday` : ''}
            </p>
            <div className="busmo-one-ctas">
              <button type="button" className="busmo-one-btn-primary" onClick={() => setOpen(true)}>
                Buy Busmo One
              </button>
              <a className="busmo-one-btn-secondary" href="/pricing">
                View software plans
              </a>
            </div>
            <p className="busmo-one-note">
              Secure Paystack checkout. Team coordinates delivery after payment.
            </p>
          </div>
          <div className="busmo-one-visual" aria-hidden>
            {/* keep existing imagery if parent styles provide img elsewhere */}
          </div>
        </div>

        <div className="busmo-one-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="busmo-one-card">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <div className="busmo-one-bottom">
          <h3>Ready for the counter?</h3>
          <p>Pay securely online — we fulfil terminals and activate your Scale year eligibility after purchase.</p>
          <button type="button" className="busmo-one-btn-primary" onClick={() => setOpen(true)}>
            Buy Busmo One
          </button>
        </div>
      </div>

      <BusmoOnePreorderModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
