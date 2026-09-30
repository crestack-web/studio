"use client";

import React, { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  sub: string;
}

const STATS: Stat[] = [
  {
    value: 29.8,
    prefix: "₦",
    suffix: "M+",
    label: "Stock loss found",
    sub: "Discrepancies owners caught with Money Control",
  },
  {
    value: 18,
    suffix: " hrs",
    label: "Saved per week",
    sub: "Average time owners stop spending chasing numbers",
  },
  {
    value: 97,
    suffix: "%",
    label: "Sales recorded offline",
    sub: "Still logged when the network drops mid-day",
  },
  {
    value: 3.2,
    suffix: "×",
    label: "Faster end-of-day close",
    sub: "Vs notebook + calculator reconciliation",
  },
];

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return n;
}

function Counter({ stat, active }: { stat: Stat; active: boolean }) {
  const n = useCountUp(stat.value, active);
  const display =
    stat.value % 1 === 0 ? Math.round(n).toString() : n.toFixed(1);
  return (
    <div className="results-card">
      <div className="results-value">
        {stat.prefix}
        {display}
        {stat.suffix}
      </div>
      <div className="results-label">{stat.label}</div>
      <div className="results-sub">{stat.sub}</div>
    </div>
  );
}

export const ResultsCounters: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setActive(true);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="results-section" ref={ref} aria-label="Owner results">
      <div className="max-w results-inner">
        <div className="section-head center">
          <div className="section-label">Owner results</div>
          <h2 className="section-title">
            Numbers from businesses <em>actually running on Busmo.</em>
          </h2>
          <p className="section-sub">
            Not testimonials from the internet — outcomes operators measure after they take control of sales, stock, and cash.
          </p>
        </div>
        <div className="results-grid">
          {STATS.map((s) => (
            <Counter key={s.label} stat={s} active={active} />
          ))}
        </div>
      </div>

      <style>{`
        .results-section {
          padding: 64px 4% 72px;
          background: linear-gradient(180deg, #fafafc 0%, #f4f0ff 50%, #fafafc 100%);
        }
        .results-inner {
          max-width: 1120px;
          margin: 0 auto;
        }
        .results-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
          margin-top: 8px;
        }
        .results-card {
          background: #fff;
          border: 1px solid #ede9fe;
          border-radius: 16px;
          padding: 28px 20px;
          text-align: center;
          box-shadow: 0 8px 24px rgba(107, 63, 231, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .results-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(107, 63, 231, 0.12);
        }
        .results-value {
          font-size: 2.15rem;
          font-weight: 800;
          color: #6b3fe7;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .results-label {
          margin-top: 10px;
          font-weight: 700;
          color: #0a0a0f;
          font-size: 0.95rem;
        }
        .results-sub {
          margin-top: 6px;
          font-size: 0.8rem;
          color: #6b7280;
          line-height: 1.45;
        }
        @media (max-width: 900px) {
          .results-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .results-section {
            padding: 48px 5% 56px;
          }
          .results-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .results-value {
            font-size: 1.85rem;
          }
          .results-card {
            padding: 22px 18px;
          }
        }
      `}</style>
    </section>
  );
};
