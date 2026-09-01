"use client";

import React, { useState, useEffect } from 'react';
import {
  Store,
  UtensilsCrossed,
  Factory,
  Briefcase,
  Package,
  Hospital,
} from 'lucide-react';

interface BusinessCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: React.ReactNode;
}

const iconProps = { size: 28, strokeWidth: 1.75, 'aria-hidden': true as const };

const businessCategories: BusinessCategory[] = [
  {
    id: 'retail',
    name: 'Retail & Supermarkets',
    description: 'Manage inventory, track sales, and optimize stock levels for retail businesses of all sizes.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
    icon: <Store {...iconProps} />
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Food Service',
    description: 'Track daily sales, manage food costs, and monitor staff performance for restaurants.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    icon: <UtensilsCrossed {...iconProps} />
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Production',
    description: 'Track production costs, monitor inventory, and manage supply chains efficiently.',
    image: 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=600&fit=crop',
    icon: <Factory {...iconProps} />
  },
  {
    id: 'services',
    name: 'Service Businesses',
    description: 'Manage appointments, track revenue, and monitor client relationships for service providers.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    icon: <Briefcase {...iconProps} />
  },
  {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    description: 'Manage bulk orders, track inventory across locations, and optimize distribution.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop',
    icon: <Package {...iconProps} />
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Pharmacies',
    description: 'Track medicine inventory, manage patient records, and monitor financial health.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop',
    icon: <Hospital {...iconProps} />
  }
];

export function BusinessCategoriesSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % businessCategories.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % businessCategories.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + businessCategories.length) % businessCategories.length);
  };

  const currentCategory = businessCategories[currentIndex];

  return (
    <section className="business-categories-section">
      <div className="max-w">
        <div className="section-head center">
          <div className="section-label">Industries We Serve</div>
          <h2 className="section-title">Built for <em>Real Businesses.</em></h2>
          <p className="section-sub">From retail to manufacturing, Busmo adapts to your industry's unique needs.</p>
        </div>

        <div className="slider-container">
          <div className="slider-content">
            {/* Image Side */}
            <div className="slider-image">
              <img
                src={currentCategory.image}
                alt={currentCategory.name}
                className="category-image"
              />
              <div className="image-overlay">
                <div className="category-icon-large">{currentCategory.icon}</div>
              </div>
            </div>

            {/* Text Side */}
            <div className="slider-text">
              <div className="category-icon">{currentCategory.icon}</div>
              <h3 className="category-title">{currentCategory.name}</h3>
              <p className="category-description">{currentCategory.description}</p>
              
              {/* Navigation Dots */}
              <div className="slider-dots">
                {businessCategories.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div className="slider-arrows">
                <button
                  className="arrow-btn"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button
                  className="arrow-btn"
                  onClick={nextSlide}
                  aria-label="Next slide"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .business-categories-section {
          padding: 80px 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        }

        .slider-container {
          margin-top: 48px;
        }

        .slider-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .slider-image {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 4/3;
        }

        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .slider-image:hover .category-image {
          transform: scale(1.05);
        }

        .image-overlay {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .category-icon-large {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--purple);
        }
        .category-icon-large svg {
          width: 2.5rem;
          height: 2.5rem;
        }

        .slider-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .category-icon {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          color: var(--purple);
        }
        .category-icon svg {
          width: 2.5rem;
          height: 2.5rem;
        }

        .category-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-1);
          margin: 0 0 16px 0;
          line-height: 1.2;
        }

        .category-description {
          font-size: 1.1rem;
          color: var(--text-2);
          line-height: 1.6;
          margin: 0 0 32px 0;
        }

        .slider-dots {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dot:hover {
          border-color: var(--purple);
        }

        .dot.active {
          background: var(--purple);
          border-color: var(--purple);
        }

        .slider-arrows {
          display: flex;
          gap: 12px;
        }

        .arrow-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          color: var(--text-1);
        }

        .arrow-btn:hover {
          border-color: var(--purple);
          background: var(--purple);
          color: white;
        }

        .arrow-btn svg {
          width: 20px;
          height: 20px;
        }

        @media (max-width: 768px) {
          .slider-content {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 24px;
          }

          .slider-image {
            aspect-ratio: 16/9;
          }

          .category-title {
            font-size: 1.5rem;
          }

          .category-description {
            font-size: 1rem;
          }
        }
      `}</style>
    </section>
  );
}
