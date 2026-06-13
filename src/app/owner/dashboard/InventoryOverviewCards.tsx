import React, { useState, useEffect } from 'react';
import { useTranslation } from './LangContext';
import { getInventoryStats, Product } from './inventoryData';
import { useCurrency } from './CurrencyContext';
import { useApp } from './AppContext';
import { isRestaurantBusiness } from './utils/restaurantHelpers';

interface InventoryOverviewCardsProps {
  products: Product[];
}

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;       // CSS var name
  accentBg: string;
  alert?: boolean;
}

const InventoryOverviewCards: React.FC<InventoryOverviewCardsProps> = ({ products }) => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { user } = useApp();
  const [isRestaurant, setIsRestaurant] = useState(false);

  // Check if business is a restaurant
  useEffect(() => {
    async function checkRestaurant() {
      if (user.businessId) {
        const restaurant = await isRestaurantBusiness(user.businessId);
        setIsRestaurant(restaurant);
      }
    }
    checkRestaurant();
  }, [user.businessId]);

  // Show empty state if no products
  if (products.length === 0) {
    return (
      <div className="inv-section-empty">
        <svg className="inv-empty-svg" width="120" height="120" viewBox="0 0 80 80" fill="none">
          {/* big chart tablet */}
          <rect x="20" y="18" width="40" height="36" rx="5" fill="#0D1B2A" stroke="rgba(42,191,191,.3)" strokeWidth="1.2"/>
          {/* bar chart inside */}
          <rect x="25" y="44" width="6" height="6" rx="1.5" fill="rgba(42,191,191,.5)"/>
          <rect x="33" y="38" width="6" height="12" rx="1.5" fill="rgba(42,191,191,.7)"/>
          <rect x="41" y="34" width="6" height="16" rx="1.5" fill="#2ABFBF"/>
          <rect x="49" y="40" width="6" height="10" rx="1.5" fill="rgba(42,191,191,.6)"/>
          {/* trend line */}
          <polyline points="28,44 36,38 44,34 52,40" stroke="#F4A535" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <circle cx="44" cy="34" r="2.5" fill="#F4A535"/>
          {/* percent up badge */}
          <rect x="34" y="20" width="12" height="8" rx="2" fill="rgba(29,185,84,.2)" stroke="#1DB954" strokeWidth="1"/>
          <text x="40" y="26" fontSize="5.5" fill="#1DB954" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">↑32%</text>
          {/* Mo below holding the tablet up */}
          <circle cx="40" cy="68" r="10" fill="#F5C9A0"/>
          <path d="M30 65 C30 59 50 59 50 65 L50 62 C50 57 30 57 30 62 Z" fill="#2C1A0E"/>
          <circle cx="36" cy="67" r="2.5" fill="#1A2B3C"/>
          <circle cx="44" cy="67" r="2.5" fill="#1A2B3C"/>
          <path d="M35 72 Q40 76 45 72" stroke="#CC7A3A" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          {/* arms holding up tablet */}
          <path d="M30 67 Q26 64 22 58" stroke="#F5C9A0" strokeWidth="4" strokeLinecap="round" fill="none"/>
          <path d="M50 67 Q54 64 58 58" stroke="#F5C9A0" strokeWidth="4" strokeLinecap="round" fill="none"/>
        </svg>
        <h4>No Inventory Overview</h4>
        <p>Add products to see your inventory statistics and insights</p>
      </div>
    );
  }

  const stats = getInventoryStats(products);

  // Filter products by type for restaurants
  const ingredients = products.filter(p => (p as any).productType === 'ingredient');
  const dishes = products.filter(p => (p as any).productType === 'dish');
  const regularProducts = products.filter(p => (p as any).productType !== 'ingredient' && (p as any).productType !== 'dish');

  // Calculate restaurant-specific metrics
  const ingredientsNeedingReorder = ingredients.filter(p => p.stock <= (p.reorderThreshold || 10));
  const totalIngredientValue = ingredients.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const totalDishValue = dishes.reduce((sum, p) => sum + p.costPrice * p.stock, 0);

  const potentialProfit = products.reduce(
    (s, p) => s + (p.sellingPrice - p.costPrice) * p.stock,
    0
  );

  const cards: StatCard[] = isRestaurant ? [
    // Restaurant-specific cards
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 2v4M8 10v4M3.5 5.5l3 3-3 3M12.5 5.5l-3 3 3 3"/>
        </svg>
      ),
      label: 'Total Ingredients',
      value: `${ingredients.length}`,
      sub: `${ingredientsNeedingReorder.length} need reorder`,
      accent: 'var(--purple)',
      accentBg: 'var(--purple-lt)',
      alert: ingredientsNeedingReorder.length > 0,
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 4l6-2 6 2v8l-6 2-6-2V4z"/>
          <path d="M8 2v12M2 4l6 2 6-2"/>
        </svg>
      ),
      label: 'Dishes Available',
      value: `${dishes.length}`,
      sub: 'Menu items in stock',
      accent: 'var(--blue)',
      accentBg: 'var(--blue-bg)',
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="6"/>
          <path d="M8 5v3l2 1.5"/>
        </svg>
      ),
      label: 'Ingredient Value',
      value: formatMoney(totalIngredientValue),
      sub: 'At cost price',
      accent: 'var(--teal)',
      accentBg: 'var(--teal-bg)',
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 11L8 3l5 8H3z"/>
          <path d="M8 7v2M8 10.5v.5"/>
        </svg>
      ),
      label: 'Reorder Alerts',
      value: `${ingredientsNeedingReorder.length}`,
      sub: 'Ingredients below reorder level',
      accent: 'var(--amber)',
      accentBg: 'var(--amber-bg)',
      alert: ingredientsNeedingReorder.length > 0,
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M5 3V2M11 3V2" />
          <path d="M2 7h12" />
          <rect x="5" y="9.5" width="2" height="1.5" rx=".3" fill="currentColor" stroke="none"/>
          <rect x="9" y="9.5" width="2" height="1.5" rx=".3" fill="currentColor" stroke="none"/>
        </svg>
      ),
      label: 'Regular Products',
      value: `${regularProducts.length}`,
      sub: 'Non-restaurant items',
      accent: 'var(--green)',
      accentBg: 'var(--green-bg)',
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 12l4-4 3 3 5-7"/>
          <circle cx="14" cy="4" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      ),
      label: 'Total Inventory Value',
      value: formatMoney(stats.invValue),
      sub: 'All items at cost',
      accent: 'var(--red)',
      accentBg: 'var(--red-bg)',
    },
  ] : [
    // Standard inventory cards for non-restaurants
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M5 3V2M11 3V2" />
          <path d="M2 7h12" />
          <rect x="5" y="9.5" width="2" height="1.5" rx=".3" fill="currentColor" stroke="none"/>
          <rect x="9" y="9.5" width="2" height="1.5" rx=".3" fill="currentColor" stroke="none"/>
        </svg>
      ),
      label: 'Total Products',
      value: `${stats.total}`,
      sub: 'Active SKUs in inventory',
      accent: 'var(--purple)',
      accentBg: 'var(--purple-lt)',
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l6-2 6 2v8l-6 2-6-2V4z"/>
          <path d="M8 2v12M2 4l6 2 6-2"/>
        </svg>
      ),
      label: 'Units in Stock',
      value: stats.totalUnits.toLocaleString(),
      sub: 'Total physical units',
      accent: 'var(--blue)',
      accentBg: 'var(--blue-bg)',
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M8 2v4M8 10v4M3.5 5.5l3 3-3 3M12.5 5.5l-3 3 3 3"/>
        </svg>
      ),
      label: 'Low Stock',
      value: `${stats.lowStock}`,
      sub: `${stats.outOfStock} out of stock`,
      accent: 'var(--amber)',
      accentBg: 'var(--amber-bg)',
      alert: stats.lowStock > 0 || stats.outOfStock > 0,
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="8" cy="8" r="6"/>
          <path d="M8 5v3l2 1.5"/>
        </svg>
      ),
      label: 'Out of Stock',
      value: `${stats.outOfStock}`,
      sub: 'Items unavailable',
      accent: 'var(--red)',
      accentBg: 'var(--red-bg)',
      alert: stats.outOfStock > 0,
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 11L8 3l5 8H3z"/>
          <path d="M8 7v2M8 10.5v.5"/>
        </svg>
      ),
      label: 'Inventory Value',
      value: formatMoney(stats.invValue),
      sub: 'At cost price',
      accent: 'var(--teal)',
      accentBg: 'var(--teal-bg)',
    },
    {
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 12l4-4 3 3 5-7"/>
          <circle cx="14" cy="4" r="1.5" fill="currentColor" stroke="none"/>
        </svg>
      ),
      label: 'Potential Revenue',
      value: formatMoney(stats.potRevenue),
      sub: `${formatMoney(potentialProfit)} potential profit`,
      accent: 'var(--green)',
      accentBg: 'var(--green-bg)',
    },
  ];

  return (
    <div className="inv-overview-grid">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`inv-stat-card${c.alert ? ' inv-stat-alert' : ''}`}
          style={{ '--accent': c.accent, '--accent-bg': c.accentBg } as React.CSSProperties}
        >
          <div className="isc-top">
            <div className="isc-icon">{c.icon}</div>
            {c.alert && (
              <span className="isc-pulse">
                <span />
              </span>
            )}
          </div>
          <div className="isc-value">{c.value}</div>
          <div className="isc-label">{c.label}</div>
          {c.sub && <div className="isc-sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
};

export default InventoryOverviewCards;
