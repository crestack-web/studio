import React from 'react';
import { MoIcon, NavIcons } from '../../owner/dashboard/NavIcons';

export const MoSection: React.FC = () => (
  <section className="mo-section-new">
    <div className="mo-scene">
      {/* Glow blob background */}
      <div className="mo-glow-blob" />

      {/* Left: Feature pills */}
      <div className="mo-features-left">
        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">🛒</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Add Sale by Text</div>
            <div className="mo-feat-pill-sub">Just type what you sold</div>
          </div>
        </div>

        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">💰</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Instant Profit Check</div>
            <div className="mo-feat-pill-sub">Ask anytime, get real numbers</div>
          </div>
        </div>

        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">📦</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Restock Alerts</div>
            <div className="mo-feat-pill-sub">MO knows what's running low</div>
          </div>
        </div>

        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">🔮</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Smart Forecasts</div>
            <div className="mo-feat-pill-sub">Tomorrow's sales, predicted today</div>
          </div>
        </div>

        <div className="mo-feat-pill">
          <div className="mo-feat-pill-icon">🌍</div>
          <div className="mo-feat-pill-text">
            <div className="mo-feat-pill-label">Works Offline</div>
            <div className="mo-feat-pill-sub">MO syncs when you reconnect</div>
          </div>
        </div>
      </div>

      {/* Center: iPhone mockup */}
      <div className="mo-iphone-wrap">
        <div className="mo-iphone-frame">
          <div className="mo-iphone-inner">
            {/* Dynamic Island */}
            <div className="mo-dynamic-island">
              <div className="mo-di-camera" />
              <div className="mo-di-sensor" />
            </div>

            {/* Status bar */}
            <div className="mo-status-bar">
              <span className="mo-status-time">09:55</span>
              <div className="mo-status-icons">
                <svg viewBox="0 0 17 12" fill="none">
                  <rect x="0" y="6" width="3" height="6" rx="1" fill="#0A0A0F"/>
                  <rect x="4.5" y="4" width="3" height="8" rx="1" fill="#0A0A0F"/>
                  <rect x="9" y="2" width="3" height="10" rx="1" fill="#0A0A0F"/>
                  <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#0A0A0F"/>
                </svg>
                <svg viewBox="0 0 16 12" fill="none" style={{width:'15px',height:'11px'}}>
                  <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="#0A0A0F"/>
                  <path d="M3.5 6.5A6.5 6.5 0 018 5a6.5 6.5 0 014.5 1.5" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M0.5 3.5A10 10 0 018 1a10 10 0 017.5 2.5" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <svg viewBox="0 0 25 12" fill="none" style={{width:'24px',height:'12px'}}>
                  <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#0A0A0F" strokeOpacity="0.35"/>
                  <rect x="2" y="2" width="16" height="8" rx="2" fill="#0A0A0F"/>
                  <path d="M23 4.5v3a1.5 1.5 0 000-3z" fill="#0A0A0F" fillOpacity="0.4"/>
                </svg>
              </div>
            </div>

            {/* App top bar */}
            <div className="mo-topbar">
              <button className="mo-topbar-menu">
                <svg viewBox="0 0 18 14" fill="none">
                  <rect y="0" width="18" height="2" rx="1" fill="#0A0A0F"/>
                  <rect y="6" width="12" height="2" rx="1" fill="#0A0A0F"/>
                  <rect y="12" width="18" height="2" rx="1" fill="#0A0A0F"/>
                </svg>
              </button>
              <span className="mo-topbar-title">Ask MO</span>
              <div className="mo-topbar-right">
                <div className="mo-topbar-icon">🌙</div>
                <div className="mo-topbar-icon" style={{position:'relative'}}>
                  🔔
                  <span style={{position:'absolute',top:0,right:0,width:'8px',height:'8px',borderRadius:'50%',background:'#EF4444',border:'1.5px solid #F5F5F7',display:'block'}} />
                </div>
                <div className="mo-topbar-avatar">
                  JD
                  <span className="mo-topbar-avatar-label">owner</span>
                </div>
              </div>
            </div>

            {/* MO header */}
            <div className="mo-chat-header">
              <div className="mo-chat-info">
                <div className="mo-chat-avatar">
                  <MoIcon size={16} />
                  <div className="mo-online-dot" />
                </div>
                <div>
                  <div className="mo-chat-name">Ask MO</div>
                  <div className="mo-chat-status">Online · ready to help</div>
                </div>
              </div>
              <button className="mo-back-btn">← Back</button>
            </div>

            {/* Chat messages */}
            <div className="mo-chat-area">
              {/* MO greeting */}
              <div className="mo-msg-row" style={{animationDelay:'0s'}}>
                <div className="mo-msg-av">
                  <MoIcon size={11} />
                </div>
                <div>
                  <div className="mo-bubble mo">
                    Hey Jane 👋 I'm <strong>MO</strong>, your business AI.<br/><br/>
                    I have full context on your sales, inventory, expenses, and cashflow. Ask me anything or tap a suggestion below.
                  </div>
                  <div className="mo-bubble-time">09:55</div>
                </div>
              </div>

              {/* User: add sale by text */}
              <div className="mo-msg-row user" style={{animationDelay:'0.1s'}}>
                <div className="mo-msg-av user-av">JD</div>
                <div>
                  <div className="mo-bubble user">
                    Add sale: 3 bags of rice at ₦18,000 each and 2 bottles of groundnut oil at ₦4,500 each
                  </div>
                  <div className="mo-bubble-time user-time">10:02</div>
                </div>
              </div>

              {/* MO: sale confirmation */}
              <div className="mo-msg-row" style={{animationDelay:'0.2s'}}>
                <div className="mo-msg-av">
                  <MoIcon size={11} />
                </div>
                <div>
                  <div className="mo-bubble mo" style={{maxWidth:'240px',padding:'10px 11px'}}>
                    <div style={{fontWeight:700,marginBottom:'6px',fontSize:'0.75rem'}}>✅ Sale recorded!</div>
                    <div className="mo-sale-confirm">
                      <div className="mo-sale-row">
                        <span>Rice × 3</span>
                        <span className="mo-sale-val">₦54,000</span>
                      </div>
                      <div className="mo-sale-row">
                        <span>Groundnut Oil × 2</span>
                        <span className="mo-sale-val">₦9,000</span>
                      </div>
                      <div className="mo-sale-total">
                        <span>Total Revenue</span>
                        <span className="mo-sale-amount">₦63,000</span>
                      </div>
                    </div>
                    <div style={{fontSize:'0.68rem',color:'#888',marginTop:'6px'}}>📦 Inventory updated · Profit logged</div>
                  </div>
                  <div className="mo-bubble-time">10:02</div>
                </div>
              </div>

              {/* User: profit question */}
              <div className="mo-msg-row user" style={{animationDelay:'0.3s'}}>
                <div className="mo-msg-av user-av">JD</div>
                <div>
                  <div className="mo-bubble user">How much profit have I made today?</div>
                  <div className="mo-bubble-time user-time">10:05</div>
                </div>
              </div>

              {/* MO: profit answer */}
              <div className="mo-msg-row" style={{animationDelay:'0.4s'}}>
                <div className="mo-msg-av">
                  <MoIcon size={11} />
                </div>
                <div>
                  <div className="mo-bubble mo" style={{maxWidth:'240px'}}>
                    Here's your <strong>today's summary</strong>:
                    <div className="mo-insight-card">
                      <div className="mo-insight-row">
                        <span className="mo-insight-label">Revenue</span>
                        <span className="mo-insight-val purple">₦63,000</span>
                      </div>
                      <div className="mo-insight-row">
                        <span className="mo-insight-label">Expenses</span>
                        <span className="mo-insight-val" style={{color:'#EF4444'}}>−₦14,200</span>
                      </div>
                      <div className="mo-insight-row" style={{borderTop:'1px solid rgba(107,63,231,0.12)',paddingTop:'4px',marginTop:'2px'}}>
                        <span className="mo-insight-label" style={{fontWeight:700,color:'#0A0A0F'}}>Net Profit</span>
                        <span className="mo-insight-val up">₦48,800 ↑</span>
                      </div>
                    </div>
                    <div style={{fontSize:'0.68rem',color:'#16A34A',marginTop:'6px',fontWeight:600}}>+22% vs yesterday 🚀</div>
                  </div>
                  <div className="mo-bubble-time">10:05</div>
                </div>
              </div>

              {/* Typing indicator */}
              <div className="mo-msg-row" style={{animationDelay:'0.5s'}}>
                <div className="mo-msg-av">
                  <MoIcon size={11} />
                </div>
                <div className="mo-typing">
                  <div className="mo-typing-dot" />
                  <div className="mo-typing-dot" />
                  <div className="mo-typing-dot" />
                </div>
              </div>
            </div>

            {/* Quick suggestion chips */}
            <div className="mo-suggestions">
              <button className="mo-chip active">Profit today?</button>
              <button className="mo-chip">Restock advice</button>
              <button className="mo-chip">Check expenses</button>
              <button className="mo-chip">Cash status</button>
              <button className="mo-chip">Add a product</button>
            </div>

            {/* Input bar */}
            <div className="mo-input-bar">
              <div className="mo-input-wrap">Ask anything about your business…</div>
              <button className="mo-send-btn">
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M18 10L2 2l3 8-3 8 16-8z" fill="white"/>
                </svg>
              </button>
            </div>

            {/* Bottom nav */}
            <div className="mo-bottom-nav">
              <div className="mo-nav-item">
                <div className="mo-nav-item-icon">
                  <NavIcons id="home" size={14} />
                </div>
                <span>Home</span>
              </div>
              <div className="mo-nav-item">
                <div className="mo-nav-item-icon">
                  <NavIcons id="sale" size={14} />
                </div>
                <span>Sale</span>
              </div>
              <div className="mo-nav-item mo-nav active">
                <div className="mo-nav-item-icon mo-nav-icon">
                  <MoIcon size={18} />
                </div>
                <span>Ask MO</span>
              </div>
              <div className="mo-nav-item">
                <div className="mo-nav-item-icon">
                  <NavIcons id="staff" size={14} />
                </div>
                <span>Staff</span>
              </div>
              <div className="mo-nav-item">
                <div className="mo-nav-item-icon">
                  <NavIcons id="services" size={14} />
                </div>
                <span>Services</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right: Stat cards */}
      <div className="mo-features-right">
        <div className="mo-stat-card">
          <div className="mo-stat-val">42K<span>+</span></div>
          <div className="mo-stat-label">MO queries answered this month</div>
        </div>

        <div className="mo-stat-card">
          <div className="mo-stat-val">1.2<span>s</span></div>
          <div className="mo-stat-label">Average MO response time</div>
        </div>

        <div className="mo-stat-card">
          <div className="mo-stat-val">284</div>
          <div className="mo-stat-label">Sales recorded by text today</div>
        </div>

        <div className="mo-try-card">
          <div className="mo-try-title">Try asking MO</div>
          <div className="mo-try-examples">
            <div className="mo-try-item">"What's my best seller this week?"</div>
            <div className="mo-try-item">"Add sale: 5 phones at ₦85k"</div>
            <div className="mo-try-item">"Will I make profit this month?"</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
