"use client";

import React from "react";

const LOGOS = [
  { name: "Mudatex", src: "/partners/mudatex.jpg", alt: "Mudatex — Mudassir & Brothers" },
  { name: "ZAU", src: "/partners/zau.jpg", alt: "ZAU" },
  { name: "Hill 360 Supermarket", src: "/partners/hill360.jpg", alt: "Hill 360 Supermarket" },
  { name: "Cadbury", src: "/partners/cadbury.jpg", alt: "Cadbury" },
  { name: "Chicken Republic", src: "/partners/chicken-republic.jpg", alt: "Chicken Republic" },
];

/** Duplicate track for seamless infinite scroll */
const TRACK = [...LOGOS, ...LOGOS, ...LOGOS];

export const TrustedBySection: React.FC = () => (
  <section className="trusted-by-section" aria-label="Trusted by leading businesses">
    <div className="max-w trusted-by-inner">
      <div className="section-head center trusted-by-head">
        <div className="section-label">Trusted across Africa</div>
        <h2 className="section-title trusted-by-title">
          Used by businesses that <em style={{ color: "var(--purple-mid)" }}>run on clarity.</em>
        </h2>
        <p className="section-sub trusted-by-sub">
          From local brands to household names — operators who need stock, sales, and cash under control.
        </p>
      </div>
    </div>

    <div className="trusted-marquee" aria-hidden="false">
      <div className="trusted-marquee-track">
        {TRACK.map((logo, i) => (
          <div key={`${logo.name}-${i}`} className="trusted-logo-card">
            <img
              src={logo.src}
              alt={logo.alt}
              className="trusted-logo-img"
              loading={i < 5 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>

    {/* Static grid fallback for reduced-motion / accessibility */}
    <div className="max-w trusted-logos-static" role="list">
      {LOGOS.map((logo) => (
        <div key={logo.name} className="trusted-logo-card" role="listitem">
          <img src={logo.src} alt={logo.alt} className="trusted-logo-img" loading="lazy" />
        </div>
      ))}
    </div>
  </section>
);
