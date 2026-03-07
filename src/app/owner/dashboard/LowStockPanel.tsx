import React from 'react';
import { useTranslation } from './LangContext';
import {
  Product, getLowStockProducts, getStockStatus,
  getDaysUntilStockout,
} from './inventoryData';
import { useCurrency } from './CurrencyContext';

interface LowStockPanelProps {
  products: Product[];
  onProductClick: (p: Product) => void;
}

const LowStockPanel: React.FC<LowStockPanelProps> = ({ products, onProductClick }) => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const lowItems = getLowStockProducts(products);
  
  // Show empty state if no products at all
  if (products.length === 0) {
    return (
      <div className="inv-section-empty">
        <div className="inv-section-empty-icon">⚠️</div>
        <h4>No Low Stock Alerts</h4>
        <p>Add products to receive low stock and out of stock alerts</p>
      </div>
    );
  }
  
  // Show different message if products exist but none are low
  if (lowItems.length === 0) {
    return (
      <div className="inv-section-empty">
        <div className="inv-section-empty-icon">✅</div>
        <h4>All Stock Levels Healthy!</h4>
        <p>Great job! None of your products are running low</p>
      </div>
    );
  }

  const outCount = lowItems.filter(p => getStockStatus(p) === 'out').length;

  return (
    <div className="inv-lowstock-panel">
      {/* Panel header */}
      <div className="inv-ls-header">
        <div className="inv-ls-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2l6 12H2L8 2z"/>
            <path d="M8 7v3M8 11.5v.5"/>
          </svg>
        </div>
        <div className="inv-ls-title-wrap">
          <div className="inv-ls-title">
            {t('insights.lowStock.title')}
          </div>
          <div className="inv-ls-sub">
            {t('insights.lowStock.subtitle', { count: lowItems.length })}
            {outCount > 0 && <> — <span className="inv-ls-out">{t('insights.lowStock.out', { count: outCount })}</span></>}
          </div>
        </div>
        <span className="inv-ls-badge">{lowItems.length}</span>
      </div>

      {/* Items */}
      <div className="inv-ls-list">
        {lowItems.map(p => {
          const isOut    = getStockStatus(p) === 'out';
          const daysLeft = getDaysUntilStockout(p);
          const restock  = p.suggestedReorder;
          const restockCost = restock * p.costPrice;

          return (
            <div
              key={p.id}
              className={`inv-ls-item${isOut ? ' inv-ls-item-out' : ''}`}
              onClick={() => onProductClick(p)}
            >
              <div className="inv-ls-item-left">
                <div className="inv-ls-emoji">{p.emoji}</div>
                <div className="inv-ls-info">
                  <div className="inv-ls-name">{p.name}</div>
                  <div className="inv-ls-meta">
                    {isOut ? (
                      <span className="inv-ls-tag-out">{t('stockStatus.out')}</span>
                    ) : (
                      <span className="inv-ls-tag-low">
                        {t('stockStatus.low', { count: p.stock, threshold: p.reorderThreshold })}
                      </span>
                    )}
                    {daysLeft !== null && !isOut && (
                      <span className={`inv-ls-days${daysLeft <= 3 ? ' urgent' : ''}`}>
                        {t('insights.lowStock.stockoutDays', { days: daysLeft })}
                      </span>
                    )}
                    {isOut && (
                      <span className="inv-ls-days urgent">{t('insights.lowStock.stockoutNow')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="inv-ls-item-right">
                <div className="inv-ls-suggest">
                  {t('insights.lowStock.reorder', { count: restock })}
                </div>
                <div className="inv-ls-cost">≈ {formatMoney(restockCost)}</div>
                <button
                  className="btn bxs inv-ls-restock-btn"
                  onClick={e => { e.stopPropagation(); onProductClick(p); }}
                >
                  {t('common.restock')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LowStockPanel;
