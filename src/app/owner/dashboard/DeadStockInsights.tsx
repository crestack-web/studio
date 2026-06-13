import React from 'react';
import { useTranslation } from './LangContext';
import { Product, getDeadStockProducts, getDaysSinceLastSale } from './inventoryData';
import { formatMoney } from './currencies';

interface DeadStockInsightsProps {
  products: Product[];
  onProductClick: (product: Product) => void;
}

const DeadStockInsights: React.FC<DeadStockInsightsProps> = ({ products, onProductClick }) => {
  const { t } = useTranslation();
  const deadStock = getDeadStockProducts(products);

  return (
    <div className="insight-card">
      <h2 className="insight-title">Slowest Movers</h2>
      <p className="insight-sub">Products that haven't sold in 30+ days</p>

      {deadStock.length === 0 ? (
        <div className="inv-section-empty">
          <svg className="inv-empty-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(124,58,237,.12)" strokeWidth="1.5" strokeDasharray="6,4"/>
            {/* big bell outline (empty) */}
            <path d="M60 24 Q74 28 78 44 L82 60 L38 60 L42 44 Q46 28 60 24 Z" fill="rgba(124,58,237,.08)" stroke="rgba(124,58,237,.2)" strokeWidth="1.5"/>
            <path d="M54 60 Q54 66 60 66 Q66 66 66 60" fill="none" stroke="rgba(124,58,237,.2)" strokeWidth="1.5"/>
            <line x1="60" y1="24" x2="60" y2="20" stroke="rgba(124,58,237,.2)" strokeWidth="2" strokeLinecap="round"/>
            {/* zzz inside bell */}
            <text x="54" y="48" fontSize="9" fill="rgba(124,58,237,.4)" fontWeight="bold">zzz</text>
            {/* Mo sleeping peacefully below */}
            <circle cx="60" cy="86" r="13" fill="#F5C9A0"/>
            <path d="M47 82 C47 73 73 73 73 82 L73 78 C73 70 47 70 47 78 Z" fill="#2C1A0E"/>
            {/* sleeping eyes */}
            <path d="M53 85 Q56 88 59 85" stroke="#1A2B3C" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M61 85 Q64 88 67 85" stroke="#1A2B3C" strokeWidth="2" strokeLinecap="round" fill="none"/>
            {/* smile/drool */}
            <path d="M55 91 Q60 94 65 91" stroke="#CC7A3A" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            {/* pillow */}
            <ellipse cx="60" cy="98" rx="20" ry="8" fill="rgba(124,58,237,.15)" stroke="rgba(124,58,237,.2)" strokeWidth="1"/>
            {/* z floats */}
            <text x="72" y="78" fontSize="8" fill="#7C3AED" opacity=".6" fontWeight="bold">Z</text>
            <text x="80" y="70" fontSize="6" fill="#7C3AED" opacity=".4" fontWeight="bold">z</text>
          </svg>
          <h4>No Dead Stock</h4>
          <p>Great! All your products are moving. No slow-moving items to worry about.</p>
        </div>
      ) : (
        <div className="insight-list">
          {deadStock.map(p => (
            <div key={p.id} className="insight-item" onClick={() => onProductClick(p)}>
              <div className="insight-item-left">
                <div className="insight-item-name">{p.name}</div>
                <div className="insight-item-detail">
                  Last sold: <span className="insight-item-date">{getDaysSinceLastSale(p)} days ago</span>
                </div>
              </div>
              <div className="insight-item-right">
                <div className="insight-item-stock">{p.currentStock} units</div>
                <div className="insight-item-value">{formatMoney(p.currentStock * p.sellingPrice)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeadStockInsights;
