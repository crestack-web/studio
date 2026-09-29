"use client";

import React from "react";

const AREAS = [
  {
    number: 1,
    title: "Sales",
    description: "Know what is being sold and when — by who, and for how much.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009550/IMG_2411_zblrqq.png",
  },
  {
    number: 2,
    title: "Stock",
    description: "Know what you have, what is moving, and what it is worth.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009549/IMG_2412_gixq0q.png",
  },
  {
    number: 3,
    title: "Cash",
    description: "Track where money comes from and where it goes.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009550/IMG_2414_ggelsf.png",
  },
  {
    number: 4,
    title: "Staff",
    description: "Know who is handling sales, cash and business activity.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009550/IMG_2413_esqkdh.png",
  },
  {
    number: 5,
    title: "Profit",
    description: "Understand what your business is actually making.",
    icon: "https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785009549/IMG_2410_uos5yq.png",
  },
];

export const HowBusmoWorks: React.FC = () => (
  <section className="how-busmo-works-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">The Busmo System</div>
        <h2 className="section-title">
          One system.{" "}
          <em style={{ color: "var(--purple-mid)" }}>Complete business visibility.</em>
        </h2>
        <p className="section-sub">
          Busmo connects sales, stock, cash, staff and profit so you always know what is happening inside your business.
        </p>
      </div>

      <div className="steps-container hbw-steps">
        {AREAS.map((step, index) => (
          <div key={index} className="step-item hbw-step">
            <div className="step-number hbw-num">{step.number}</div>
            <div className="step-icon hbw-icon">
              <img src={step.icon} alt={step.title} className="step-icon-image hbw-icon-img" />
            </div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description hbw-desc">{step.description}</p>
            </div>
            {index < AREAS.length - 1 && (
              <div className="step-connector hbw-connector" aria-hidden>
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    <style>{`
      /* Override globals: always 5 columns, horizontal on mobile */
      .how-busmo-works-section .hbw-steps {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: flex-start;
        justify-content: space-between;
        gap: 8px;
        margin: 40px 0 0;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        padding-bottom: 8px;
      }
      .how-busmo-works-section .hbw-steps::-webkit-scrollbar {
        display: none;
      }
      .how-busmo-works-section .hbw-step {
        flex: 1 1 0;
        min-width: 0;
        text-align: center;
        position: relative;
      }
      .how-busmo-works-section .hbw-num {
        width: 36px;
        height: 36px;
        font-size: 0.95rem;
        margin: 0 auto 10px;
      }
      .how-busmo-works-section .hbw-icon {
        margin-bottom: 8px;
      }
      .how-busmo-works-section .hbw-icon-img {
        width: 52px;
        height: 52px;
        object-fit: contain;
      }
      .how-busmo-works-section .hbw-desc {
        font-size: 0.8rem;
      }
      .how-busmo-works-section .hbw-connector {
        display: none;
      }

      @media (max-width: 768px) {
        .how-busmo-works-section .hbw-steps {
          gap: 4px;
          margin-top: 28px;
        }
        .how-busmo-works-section .hbw-step {
          flex: 0 0 20%;
          min-width: 64px;
          padding: 0 2px;
        }
        .how-busmo-works-section .hbw-num {
          width: 28px;
          height: 28px;
          font-size: 0.75rem;
          margin-bottom: 6px;
        }
        .how-busmo-works-section .hbw-icon-img {
          width: 40px;
          height: 40px;
        }
        .how-busmo-works-section .step-title {
          font-size: 0.72rem !important;
          margin-bottom: 0 !important;
          line-height: 1.2;
        }
        /* Hide long descriptions on small screens — icons + titles only */
        .how-busmo-works-section .hbw-desc {
          display: none;
        }
      }

      @media (min-width: 769px) and (max-width: 1024px) {
        .how-busmo-works-section .hbw-icon-img {
          width: 48px;
          height: 48px;
        }
        .how-busmo-works-section .hbw-desc {
          font-size: 0.75rem;
        }
      }
    `}</style>
  </section>
);
