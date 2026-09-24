"use client";

import React from "react";

const LOGOS = [
  { name: "Mudatex", src: "/partners/mudatex.jpg", alt: "Mudatex — Mudassir & Brothers" },
  { name: "ZAU", src: "/partners/zau.jpg", alt: "ZAU" },
  { name: "Hill 360 Supermarket", src: "/partners/hill360.jpg", alt: "Hill 360 Supermarket" },
  { name: "Cadbury", src: "/partners/cadbury.jpg", alt: "Cadbury" },
  { name: "Chicken Republic", src: "/partners/chicken-republic.jpg", alt: "Chicken Republic" },
];

export const TrustedBySection: React.FC = () => (
  <section className="trusted-by-section" aria-label="Trusted by leading businesses">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">Trusted across Africa</div>
        <h2 className="section-title">
          Used by businesses that <em style={{ color: "var(--purple-mid)" }}>run on clarity.</em>
        </h2>
        <p className="section-sub">
          From local brands to household names — owners who need stock, sales, and cash under control
          choose Busmo to operate with confidence.
        </p>
      </div>

      <div className="trusted-logos" role="list">
        {LOGOS.map((logo) => (
          <div key={logo.name} className="trusted-logo-card" role="listitem">
            <img src={logo.src} alt={logo.alt} className="trusted-logo-img" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  </section>
);
