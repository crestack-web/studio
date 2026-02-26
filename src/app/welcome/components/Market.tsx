"use client";
import { Button } from "./Button";

export function Market() {
  return (
    <section className="market-section">
      <div className="max-w">
        <div className="market-grid">
          <div>
            <div className="section-label">Seller central</div>
            <h2 className="section-title">
              Your Online Store.<br />
              <em>Busmo powers your business.</em>
            </h2>
            <p className="section-sub">
              Busmo helps sellers launch their own branded storefronts, manage sales, and grow their business. We serve as your digital middleman—like Shopify, but local and instant.
            </p>
            <ul className="market-bullets">
              <li><span className="icon">🛒</span><span>Open your own store, customize your theme, and start selling fast.</span></li>
              <li><span className="icon">📈</span><span>Get real-time sales, inventory, and profit insights.</span></li>
              <li><span className="icon">💳</span><span>BusmoPay handles checkout, payments, and payouts for you.</span></li>
              <li><span className="icon">🚚</span><span>Integrated delivery and order tracking for your customers.</span></li>
              <li><span className="icon">🎨</span><span>Choose from beautiful storefront themes—just like Shopify.</span></li>
            </ul>
            <Button className="btn-primary" onClick={() => window.location.href = "/seller"}>
              Create Your Storefront →
            </Button>
          </div>
          <div className="storefront-demo">
            <div className="storefront-screenshot">
              <img
                src="https://cdn.shopify.com/s/files/1/0661/9630/7113/files/Shopify_Theme_Store_Example.png?v=1708612345"
                alt="Shopify Theme Store Example"
                style={{ borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
              />
              <div className="storefront-caption">
                Example: Customize your Busmo storefront with themes, just like Shopify sellers.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}