"use client";
import React from "react";
import { useRouter } from "next/navigation";

const WhoisBusmoFor: React.FC = () => {
  const router = useRouter();

  return (
    <section className="whois-busmo-for">
      <div className="max-w">
        <div className="section-head center animate-slideup">
          <div className="section-label">Who is Busmo for?</div>
          <h2 className="section-title">
            One Platform. <em>Three Powerful Paths.</em>
          </h2>
          <p className="section-sub" style={{ marginBottom: "2.5rem" }}>
            Whether you run a shop, sell products online, or create digital content — Busmo has a path built for you.
          </p>
        </div>
        <div className="paths-grid mt-10">
          {/* Owner */}
          <div className="path-card featured card-hover" style={{ padding: "1.2rem", borderRadius: "1rem" }}>
            <div className="path-icon" style={{ fontSize: "1.7rem", padding: "0.3rem 0.7rem", marginBottom: "0.7rem" }}>
              <span role="img" aria-label="store">🏪</span>
            </div>
            <div className="path-title" style={{ fontSize: "1rem", marginBottom: "0.3rem" }}>Business Owners</div>
            <div className="path-desc" style={{ fontSize: "0.95rem", marginBottom: "0.7rem" }}>
              Get instant visibility into your profit, inventory, and cash — without accountants or spreadsheets.
            </div>
            <ul className="path-list" style={{ listStyleType: "disc", paddingLeft: "1.2rem", fontSize: "0.95rem", marginBottom: "0.7rem" }}>
              <li>Record sales in seconds</li>
              <li>Know your profit margin daily</li>
              <li>Track inventory & get restock alerts</li>
              <li>Ask AI questions about your business</li>
              <li>See cash runway and forecasts</li>
            </ul>
            <button className="path-cta" style={{ fontSize: "0.95rem", padding: "0.5rem 1.1rem", marginTop: "0.7rem" }} onClick={() => router.push("/signup")}>
              Start Free Trial &rarr;
            </button>
          </div>
          {/* Seller */}
          <div className="path-card card-hover" style={{ padding: "1.2rem", borderRadius: "1rem" }}>
            <div className="path-icon seller" style={{ fontSize: "1.7rem", padding: "0.3rem 0.7rem", marginBottom: "0.7rem" }}>
              <span role="img" aria-label="shopping">🛍️</span>
            </div>
            <div className="path-title" style={{ fontSize: "1rem", marginBottom: "0.3rem" }}>Marketplace Sellers</div>
            <div className="path-desc" style={{ fontSize: "0.95rem", marginBottom: "0.7rem" }}>
              List your products, reach new customers, accept payments, and offer delivery — all in one place.
            </div>
            <ul className="path-list" style={{ listStyleType: "disc", paddingLeft: "1.2rem", fontSize: "0.95rem", marginBottom: "0.7rem" }}>
              <li>Free online storefront</li>
              <li>Integrated BusmoPay checkout</li>
              <li>BusmoGo delivery built in</li>
              <li>Sales auto-sync to dashboard</li>
              <li>Clear payout tracking</li>
            </ul>
            <button className="path-cta" style={{ fontSize: "0.95rem", padding: "0.5rem 1.1rem", marginTop: "0.7rem" }} onClick={() => router.push("/seller")}>
              Become a Seller &rarr;
            </button>
          </div>
          {/* Creators */}
          <div className="path-card card-hover" style={{ borderColor: "var(--purple-mid)", padding: "1.2rem", borderRadius: "1rem" }}>
            <div className="path-icon" style={{ background: "var(--purple-light)", fontSize: "1.7rem", padding: "0.3rem 0.7rem", marginBottom: "0.7rem" }}>
              <span role="img" aria-label="creator">🎨</span>
            </div>
            <div className="path-title" style={{ color: "var(--purple)", fontSize: "1rem", marginBottom: "0.3rem" }}>
              Digital Creators
            </div>
            <div className="path-desc" style={{ fontSize: "0.95rem", marginBottom: "0.7rem" }}>
              Sell digital products, courses, or content. Get paid instantly and track your earnings with clarity.
            </div>
            <ul className="path-list" style={{ listStyleType: "disc", paddingLeft: "1.2rem", fontSize: "0.95rem", marginBottom: "0.7rem" }}>
              <li>Sell digital goods & courses</li>
              <li>Instant payouts via BusmoPay</li>
              <li>Track sales & earnings in real time</li>
              <li>Audience analytics & insights</li>
              <li>Works for creators, coaches, educators, and communities</li>
              <li>Easy digital delivery & customer management</li>
            </ul>
            <button
              className="path-cta"
              style={{ borderColor: "var(--purple-mid)", color: "var(--purple)", fontSize: "0.95rem", padding: "0.5rem 1.1rem", marginTop: "0.7rem" }}
              onClick={() => router.push("/creators")}
            >
              Start as a Creator &rarr;
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoisBusmoFor;