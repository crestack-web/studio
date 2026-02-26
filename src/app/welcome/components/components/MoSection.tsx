import React from 'react';

export const MoSection: React.FC = () => (
  <section className="mo-section">
    <div className="max-w">
      <div className="mo-grid">
        {/* Left: copy */}
        <div className="mo-text">
          <div className="section-label">Ask Busmo AI — MO</div>
          <h2 className="section-title">
            Just tell MO<br />
            <em style={{ color: 'var(--purple-mid)' }}>what happened.</em>
          </h2>
          <p className="section-sub">
            MO is your AI business assistant. Record a sale by text, ask for your daily profit,
            check what to restock — all in plain language, right from your chat.
          </p>
          <ul className="mo-features">
            <li>
              <div className="mo-feat-icon">💬</div>
              <span>Type "I sold 10 Indomie at ₦200 each" — MO records it instantly</span>
            </li>
            <li>
              <div className="mo-feat-icon">📊</div>
              <span>Ask "Did I make profit today?" and get a direct, clear answer</span>
            </li>
            <li>
              <div className="mo-feat-icon">🔔</div>
              <span>MO proactively alerts you: low stock, unusual drops, best day trends</span>
            </li>
            <li>
              <div className="mo-feat-icon">🌐</div>
              <span>Works in English — Pidgin support coming soon</span>
            </li>
          </ul>
        </div>

        {/* Right: Phone mockup */}
        <div className="phone-wrap">
          <div className="phone-device">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-topbar">
                <span className="phone-app-title">MO · Ask Busmo AI</span>
                <span className="phone-status">● Online</span>
              </div>

              <div className="chat-area">
                {/* MO greeting */}
                <div className="chat-msg mo">
                  <div className="chat-label">MO</div>
                  <div className="chat-bubble">
                    Good morning Femi! 👋 You made <strong>₦47,200 profit</strong> yesterday.
                    Your top seller was Indomie. How can I help today?
                  </div>
                </div>

                {/* User: add sale by text */}
                <div className="chat-msg user">
                  <div className="chat-label">You</div>
                  <div className="chat-bubble">
                    Add sale: 20 packs of Indomie at ₦250 each. Customer paid cash.
                  </div>
                </div>

                {/* MO confirmation */}
                <div className="chat-msg mo">
                  <div className="chat-label">MO</div>
                  <div className="chat-bubble">
                    ✅ Sale recorded!
                    <div className="sale-confirm">
                      <div className="sale-confirm-row">
                        <span>Product</span><span>Indomie × 20</span>
                      </div>
                      <div className="sale-confirm-row">
                        <span>Revenue</span><span>₦5,000</span>
                      </div>
                      <div className="sale-confirm-row">
                        <span>Profit</span><span style={{ color: '#4ADE80', fontWeight: 700 }}>₦1,800</span>
                      </div>
                      <div className="sale-confirm-row">
                        <span>Stock left</span><span style={{ color: '#FCD34D' }}>⚠ 8 packs</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User: asks a question */}
                <div className="chat-msg user">
                  <div className="chat-label">You</div>
                  <div className="chat-bubble">
                    Should I restock Indomie today?
                  </div>
                </div>

                {/* MO smart answer */}
                <div className="chat-msg mo">
                  <div className="chat-label">MO</div>
                  <div className="chat-bubble">
                    Yes! You typically sell 30–40 packs on Fridays. With only 8 left,
                    you'll run out by midday. I'd restock <strong>at least 60 packs</strong> today.
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="phone-input-bar">
                <span className="phone-input-text">Ask MO anything…</span>
                <div className="phone-send">↑</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
