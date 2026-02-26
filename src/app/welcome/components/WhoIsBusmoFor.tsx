"use client";
import React from "react";

export const WhoIsBusmoFor: React.FC = () => (
  <section style={{ background: "var(--grey-50)" }}>
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Who is Busmo for?</div>
        <h2 className="section-title">One Platform. <em>Three Powerful Paths.</em></h2>
        <p className="section-sub">
          Whether you run a shop, sell products online, or fund African businesses — Busmo has a path built for you.
        </p>
      </div>
      <div className="paths-grid">
        {/* Owner */}
        <div className="path-card featured">
          <div className="path-icon"><span role="img" aria-label="shop">🏪</span></div>
          <div className="path-title">Business Owners</div>
          <div className="path-desc">
            Get instant visibility into your profit, inventory, and cash — without accountants or spreadsheets.
          </div>
          <ul className="path-list">
            <li>Record sales in seconds</li>
            <li>Know your profit margin daily</li>
            <li>Track inventory & get restock alerts</li>
            <li>Ask AI questions about your business</li>
            <li>See cash runway and forecasts</li>
          </ul>
          <button className="path-cta" onClick={() => window.location.href = "/signup"}>
            Start Free Trial →
          </button>
        </div>
        {/* Seller */}
        <div className="path-card">
          <div className="path-icon seller"><span role="img" aria-label="shopping">🛍️</span></div>
          <div className="path-title">Marketplace Sellers</div>
          <div className="path-desc">
            List your products, reach new customers, accept payments, and offer delivery — all in one place.
          </div>
          <ul className="path-list">
            <li>Free online storefront</li>
            <li>Integrated BusmoPay checkout</li>
            <li>BusmoGo delivery built in</li>
            <li>Sales auto-sync to dashboard</li>
            <li>Clear payout tracking</li>
          </ul>
          <button className="path-cta" onClick={() => window.location.href = "/seller"}>
            Become a Seller →
          </button>
        </div>
        {/* Investor */}
        <div className="path-card">
          <div className="path-icon investor"><span role="img" aria-label="chart">📈</span></div>
          <div className="path-title">Investors</div>
          <div className="path-desc">
            Discover and fund verified African businesses — backed by real-time data you can trust.
          </div>
          <ul className="path-list">
            <li>Data-verified opportunities</li>
            <li>Transparent business signals</li>
            <li>Profit-sharing or equity deals</li>
            <li>Reduced risk via live data</li>
            <li>Invest in Africa's growth</li>
          </ul>
          <button className="path-cta" onClick={() => window.location.href = "/invest"}>
            Explore Investments →
          </button>
        </div>
      </div>
    </div>
  </section>
);
export default WhoIsBusmoFor;