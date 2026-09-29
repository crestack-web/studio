"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  CircleDollarSign,
  Package,
  Sparkles,
  WifiOff,
  Moon,
  Bell,
} from "lucide-react";
import { MoIcon, NavIcons } from "../../owner/dashboard/NavIcons";

const pillIconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true as const };
const topbarIconProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true as const };

type Role = "mo" | "user";
interface ChatMsg {
  id: string;
  role: Role;
  html: string;
  time: string;
}

const SCRIPT: Array<{ role: Role; html: string; time: string; delayAfter?: number }> = [
  {
    role: "mo",
    time: "09:55",
    html: `Hey Jane 👋 I'm <strong>MO</strong>, your business AI.<br/><br/>I have full context on your sales, inventory, expenses, and cashflow. Ask me anything or tap a suggestion below.`,
    delayAfter: 900,
  },
  {
    role: "user",
    time: "10:02",
    html: `Add sale: 3 bags of rice at ₦18,000 each and 2 bottles of groundnut oil at ₦4,500 each`,
    delayAfter: 700,
  },
  {
    role: "mo",
    time: "10:02",
    html: `<div style="font-weight:700;margin-bottom:6px;font-size:0.75rem">✅ Sale recorded!</div>
      <div class="mo-sale-confirm">
        <div class="mo-sale-row"><span>Rice × 3</span><span class="mo-sale-val">₦54,000</span></div>
        <div class="mo-sale-row"><span>Groundnut Oil × 2</span><span class="mo-sale-val">₦9,000</span></div>
        <div class="mo-sale-total"><span>Total Revenue</span><span class="mo-sale-amount">₦63,000</span></div>
      </div>
      <div style="font-size:0.68rem;color:#888;margin-top:6px">Inventory updated · Profit logged</div>`,
    delayAfter: 1000,
  },
  {
    role: "user",
    time: "10:05",
    html: `How much profit have I made today?`,
    delayAfter: 700,
  },
  {
    role: "mo",
    time: "10:05",
    html: `Here's your <strong>today's summary</strong>:
      <div class="mo-insight-card">
        <div class="mo-insight-row"><span class="mo-insight-label">Revenue</span><span class="mo-insight-val purple">₦63,000</span></div>
        <div class="mo-insight-row"><span class="mo-insight-label">Expenses</span><span class="mo-insight-val" style="color:#EF4444">−₦14,200</span></div>
        <div class="mo-insight-row" style="border-top:1px solid rgba(107,63,231,0.12);padding-top:4px;margin-top:2px">
          <span class="mo-insight-label" style="font-weight:700;color:#0A0A0F">Net Profit</span>
          <span class="mo-insight-val up">₦48,800 ↑</span>
        </div>
      </div>
      <div style="font-size:0.68rem;color:#16A34A;margin-top:6px;font-weight:600">+22% vs yesterday</div>`,
    delayAfter: 1600,
  },
];

const CHIP_REPLIES: Record<string, string> = {
  "Profit today?": `Today's net profit is <strong>₦48,800</strong> on ₦63,000 revenue. Expenses were ₦14,200 — you're +22% vs yesterday.`,
  "Restock advice": `Restock soon: <strong>Indomie</strong> (8 packs), <strong>Rice</strong> (15kg), <strong>Cooking Oil</strong> (5L). At current pace they'll run out by Friday.`,
  "Check expenses": `Expenses this week: <strong>₦87,400</strong>. Biggest drivers — supplier restock (+₦42k) and transport (+₦18k).`,
  "Cash status": `Cash on hand: <strong>₦126,500</strong>. Expected collections today: ₦38,000. Two staff shifts still open — reconcile before close.`,
  "Add a product": `Tell me the product name, cost, and selling price — e.g. <em>"Add Peak Milk 400g, cost ₦1,200, sell ₦1,450"</em> — and I'll log it.`,
};

const CHIPS = Object.keys(CHIP_REPLIES);

export const MoSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [chipsEnabled, setChipsEnabled] = useState(false);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);

  const scrollBottom = () => {
    requestAnimationFrame(() => {
      if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight;
    });
  };

  useEffect(() => {
    alive.current = true;
    if (scriptIdx >= SCRIPT.length) {
      setChipsEnabled(true);
      setTyping(false);
      return;
    }
    const step = SCRIPT[scriptIdx];
    setTyping(true);
    const t = setTimeout(() => {
      if (!alive.current) return;
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `s-${scriptIdx}`, role: step.role, html: step.html, time: step.time },
      ]);
      scrollBottom();
      setTimeout(() => {
        if (alive.current) setScriptIdx((i) => i + 1);
      }, step.delayAfter ?? 800);
    }, step.role === "mo" ? 600 : 400);
    return () => {
      alive.current = false;
      clearTimeout(t);
    };
  }, [scriptIdx]);

  useEffect(() => {
    if (!chipsEnabled || activeChip) return;
    const t = setTimeout(() => {
      setMessages([]);
      setScriptIdx(0);
      setChipsEnabled(false);
      setActiveChip(null);
    }, 22000);
    return () => clearTimeout(t);
  }, [chipsEnabled, activeChip, messages.length]);

  const handleChip = useCallback(
    (chip: string) => {
      if (!chipsEnabled) return;
      setActiveChip(chip);
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", html: chip, time: now }]);
      setTyping(true);
      scrollBottom();
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            role: "mo",
            html: CHIP_REPLIES[chip] || "I'm on it — check your dashboard for the full breakdown.",
            time: now,
          },
        ]);
        scrollBottom();
      }, 700);
    },
    [chipsEnabled]
  );

  const Feature = ({ Icon, label, sub }: { Icon: React.ComponentType<any>; label: string; sub: string }) => (
    <div className="mo-feat-pill">
      <div className="mo-feat-pill-icon">
        <Icon {...pillIconProps} />
      </div>
      <div className="mo-feat-pill-text">
        <div className="mo-feat-pill-label">{label}</div>
        <div className="mo-feat-pill-sub">{sub}</div>
      </div>
    </div>
  );

  return (
    <section className="mo-section-new">
      <div className="mo-scene">
        <div className="mo-glow-blob" />

        <div className="mo-features-left">
          <Feature Icon={ShoppingCart} label="Add Sale by Text" sub="Just type what you sold" />
          <Feature Icon={CircleDollarSign} label="Instant Profit Check" sub="Ask anytime, get real numbers" />
          <Feature Icon={Package} label="Restock Alerts" sub="MO knows what's running low" />
          <Feature Icon={Sparkles} label="Smart Forecasts" sub="Tomorrow's sales, predicted today" />
          <Feature Icon={WifiOff} label="Works Offline" sub="MO syncs when you reconnect" />
        </div>

        <div className="mo-iphone-wrap">
          <div className="mo-iphone-frame">
            <div className="mo-iphone-inner">
              <div className="mo-dynamic-island">
                <div className="mo-di-camera" />
                <div className="mo-di-sensor" />
              </div>
              <div className="mo-status-bar">
                <span className="mo-status-time">09:55</span>
              </div>
              <div className="mo-topbar">
                <button className="mo-topbar-menu" type="button" aria-label="Menu">
                  <svg viewBox="0 0 18 14" fill="none" aria-hidden>
                    <rect y="0" width="18" height="2" rx="1" fill="#0A0A0F" />
                    <rect y="6" width="12" height="2" rx="1" fill="#0A0A0F" />
                    <rect y="12" width="18" height="2" rx="1" fill="#0A0A0F" />
                  </svg>
                </button>
                <span className="mo-topbar-title">Ask MO</span>
                <div className="mo-topbar-right">
                  <div className="mo-topbar-icon">
                    <Moon {...topbarIconProps} />
                  </div>
                  <div className="mo-topbar-icon" style={{ position: "relative" }}>
                    <Bell {...topbarIconProps} />
                    <span style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#EF4444", border: "1.5px solid #F5F5F7", display: "block" }} />
                  </div>
                  <div className="mo-topbar-avatar">
                    JD
                    <span className="mo-topbar-avatar-label">owner</span>
                  </div>
                </div>
              </div>

              <div className="mo-chat-header">
                <div className="mo-chat-info">
                  <div className="mo-chat-avatar">
                    <MoIcon size={16} />
                    <div className="mo-online-dot" />
                  </div>
                  <div>
                    <div className="mo-chat-name">Ask MO</div>
                    <div className="mo-chat-status">{typing ? "Typing…" : "Online · ready to help"}</div>
                  </div>
                </div>
                <button className="mo-back-btn" type="button">← Back</button>
              </div>

              <div className="mo-chat-area" ref={areaRef}>
                {messages.map((m) => (
                  <div key={m.id} className={`mo-msg-row${m.role === "user" ? " user" : ""}`}>
                    <div className={`mo-msg-av${m.role === "user" ? " user-av" : ""}`}>
                      {m.role === "user" ? "JD" : <MoIcon size={11} />}
                    </div>
                    <div>
                      <div
                        className={`mo-bubble ${m.role === "user" ? "user" : "mo"}`}
                        style={m.role === "mo" ? { maxWidth: 240 } : undefined}
                        dangerouslySetInnerHTML={{ __html: m.html }}
                      />
                      <div className={`mo-bubble-time${m.role === "user" ? " user-time" : ""}`}>{m.time}</div>
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="mo-msg-row">
                    <div className="mo-msg-av"><MoIcon size={11} /></div>
                    <div className="mo-typing">
                      <div className="mo-typing-dot" />
                      <div className="mo-typing-dot" />
                      <div className="mo-typing-dot" />
                    </div>
                  </div>
                )}
              </div>

              <div className="mo-suggestions" role="group" aria-label="Suggested questions">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`mo-chip${activeChip === chip ? " active" : ""}`}
                    onClick={() => handleChip(chip)}
                    disabled={!chipsEnabled}
                    style={{ opacity: chipsEnabled ? 1 : 0.55, cursor: chipsEnabled ? "pointer" : "default" }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="mo-input-bar">
                <div className="mo-input-wrap">Ask anything about your business…</div>
                <button className="mo-send-btn" type="button" aria-label="Send">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M18 10L2 2l3 8-3 8 16-8z" fill="white" />
                  </svg>
                </button>
              </div>

              <div className="mo-bottom-nav">
                <div className="mo-nav-item"><div className="mo-nav-item-icon"><NavIcons id="home" size={14} /></div><span>Home</span></div>
                <div className="mo-nav-item"><div className="mo-nav-item-icon"><NavIcons id="sale" size={14} /></div><span>Sale</span></div>
                <div className="mo-nav-item mo-nav active"><div className="mo-nav-item-icon mo-nav-icon"><MoIcon size={18} /></div><span>Ask MO</span></div>
                <div className="mo-nav-item"><div className="mo-nav-item-icon"><NavIcons id="staff" size={14} /></div><span>Staff</span></div>
                <div className="mo-nav-item"><div className="mo-nav-item-icon"><NavIcons id="services" size={14} /></div><span>Services</span></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mo-features-right">
          <div className="mo-stat-card"><div className="mo-stat-val">42K<span>+</span></div><div className="mo-stat-label">MO queries answered this month</div></div>
          <div className="mo-stat-card"><div className="mo-stat-val">1.2<span>s</span></div><div className="mo-stat-label">Average MO response time</div></div>
          <div className="mo-stat-card"><div className="mo-stat-val">284</div><div className="mo-stat-label">Sales recorded by text today</div></div>
          <div className="mo-try-card">
            <div className="mo-try-title">Try asking MO</div>
            <div className="mo-try-examples">
              <div className="mo-try-item">&quot;What&apos;s my best seller this week?&quot;</div>
              <div className="mo-try-item">&quot;Add sale: 5 phones at ₦85k&quot;</div>
              <div className="mo-try-item">&quot;Will I make profit this month?&quot;</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
