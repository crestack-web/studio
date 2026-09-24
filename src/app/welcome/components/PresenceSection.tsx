"use client";

import React from "react";

const COUNTRIES = [
  {
    name: "Nigeria",
    code: "ng",
    note: "Live",
  },
  {
    name: "Ghana",
    code: "gh",
    note: "Live",
  },
  {
    name: "Niger",
    code: "ne",
    note: "Live",
  },
];

export const PresenceSection: React.FC = () => (
  <section className="presence-section" aria-label="Countries where Busmo operates">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Where we operate</div>
        <h2 className="section-title">
          Present across Africa. <em style={{ color: "var(--purple-mid)" }}>Open to every country.</em>
        </h2>
        <p className="section-sub">
          Busmo is live in Nigeria, Ghana, and Niger — and ready for operators anywhere on the continent
          who want clearer stock, sales, and cash control.
        </p>
      </div>

      <div className="presence-grid">
        {COUNTRIES.map((c) => (
          <div key={c.code} className="presence-card">
            <img
              className="presence-flag"
              src={`https://flagcdn.com/w160/${c.code}.png`}
              srcSet={`https://flagcdn.com/w320/${c.code}.png 2x`}
              width={80}
              height={60}
              alt={`${c.name} flag`}
              loading="lazy"
            />
            <div className="presence-name">{c.name}</div>
            <div className="presence-badge">{c.note}</div>
          </div>
        ))}

        <div className="presence-card presence-card-open">
          <div className="presence-africa" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="56" height="56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path
                d="M28 12c4 2 8 1 11 4 3 3 2 8 5 11 2 2 6 2 7 6 1 4-2 7-1 11 1 3 4 5 3 8-4 2-8 0-11 2-3 2-3 7-7 7s-5-5-9-5-7 3-10 1c-2-3 0-7-1-10-1-4-5-5-5-9 0-4 4-6 5-10 1-3-1-7 2-9 3-2 7 0 11-1z"
                fill="currentColor"
                opacity="0.9"
              />
            </svg>
          </div>
          <div className="presence-name">All of Africa</div>
          <div className="presence-badge presence-badge-open">Open to every country</div>
        </div>
      </div>
    </div>
  </section>
);
