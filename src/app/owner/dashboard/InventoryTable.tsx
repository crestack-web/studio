import React, { useState, useMemo } from 'react';
import { useTranslation } from './LangContext';
import {
  Product, StockStatus, CATEGORIES,
  getStockStatus, getDaysSinceLastSale,
} from './inventoryData';
import { useCurrency } from './CurrencyContext';

interface InventoryTableProps {
  products: Product[];
  onProductClick: (p: Product) => void;
}

type SortKey = 'name' | 'stock' | 'unitsSold30d' | 'profit' | 'totalValue';
type SortDir = 'asc' | 'desc';

const STATUS_MAP: Record<StockStatus, { label: string; cls: string }> = {
  in_stock: { label: 'In Stock', cls: 'inv-badge-green' },
  low:      { label: 'Low',      cls: 'inv-badge-amber' },
  out:      { label: 'Out',      cls: 'inv-badge-red'   },
};

const TrendIcon: React.FC<{ dir: Product['trend'] }> = ({ dir }) => {
  if (dir === 'up') return (
    <span className="inv-trend inv-trend-up">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 9L6 3l4 6"/>
      </svg>
    </span>
  );
  if (dir === 'down') return (
    <span className="inv-trend inv-trend-down">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 3L6 9l4-6"/>
      </svg>
    </span>
  );
  return (
    <span className="inv-trend inv-trend-flat">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 6h8"/>
      </svg>
    </span>
  );
};

const SortArrow: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <span className={`inv-sort-arrow${active ? ' active' : ''}`}>
    {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
  </span>
);

const PAGE_SIZE = 8;

const InventoryTable: React.FC<InventoryTableProps> = ({ products, onProductClick }) => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const [search, setSearch]           = useState('');
  const [category, setCategory]       = useState('All');
  const [statusFilter, setStatus]     = useState<'all' | StockStatus>('all');
  const [sortKey, setSortKey]         = useState<SortKey>('name');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');
  const [page, setPage]               = useState(1);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (search)
      list = list.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      );
    if (category !== 'All')
      list = list.filter(p => p.category === category);
    if (statusFilter !== 'all')
      list = list.filter(p => getStockStatus(p) === statusFilter);

    list.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case 'name':         va = a.name; vb = b.name; break;
        case 'stock': va = a.stock; vb = b.stock; break;
        case 'unitsSold30d': va = a.unitsSold30d; vb = b.unitsSold30d; break;
        case 'profit':       va = a.sellingPrice - a.costPrice; vb = b.sellingPrice - b.costPrice; break;
        case 'totalValue':   va = a.costPrice * a.stock; vb = b.costPrice * b.stock; break;
        default:             va = a.name; vb = b.name;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
    });
    return list;
  }, [products, search, category, statusFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sortTh = (key: SortKey, label: string) => (
    <th className="inv-th inv-th-sort" onClick={() => handleSort(key)}>
      {label} <SortArrow active={sortKey === key} dir={sortDir} />
    </th>
  );

  return (
    <div className="card">
      {/* ── Header ── */}
      <div className="chd">
        <div className="cttl">
          <div className="cic" style={{ background: 'var(--purple-lt)', color: 'var(--purple)' }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 4l6-2 6 2v6l-6 2-6-2V4z"/>
            </svg>
          </div>
          {t('inventory.title')}
        </div>
        <span className="inv-count-chip">{t('inventory.productCount', { count: filtered.length })}</span>
      </div>

      {/* ── Filters ── */}
      <div className="inv-filters">
        <div className="inv-search-wrap">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="6" cy="6" r="4"/><path d="M9.5 9.5l3 3"/>
          </svg>
          <input
            className="inv-search"
            placeholder={t('inventory.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className="inv-search-clear" onClick={() => { setSearch(''); setPage(1); }}>✕</button>
          )}
        </div>

        <select
          className="inv-select"
          value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}
        >
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <select
          className="inv-select"
          value={statusFilter}
          onChange={e => { setStatus(e.target.value as typeof statusFilter); setPage(1); }}
        >
          <option value="all">{t('inventory.status.all')}</option>
          <option value="in_stock">{t('inventory.status.inStock')}</option>
          <option value="low">{t('inventory.status.low')}</option>
          <option value="out">{t('inventory.status.outOfStock')}</option>
        </select>
      </div>

      {/* ── Table ── */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th className="inv-th">{t('inventory.table.product')}</th>
              <th className="inv-th">{t('inventory.table.sku')}</th>
              <th className="inv-th">{t('inventory.table.category')}</th>
              {sortTh('stock', t('inventory.table.stock'))}
              <th className="inv-th">{t('inventory.table.cost')}</th>
              <th className="inv-th">{t('inventory.table.price')}</th>
              {sortTh('profit', t('inventory.table.profit'))}
              {sortTh('totalValue', t('inventory.table.stockValue'))}
              <th className="inv-th">{t('inventory.table.status')}</th>
              {sortTh('unitsSold30d', t('inventory.table.sold30d'))}
              <th className="inv-th">{t('inventory.table.trend')}</th>
              <th className="inv-th">{t('inventory.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="inv-empty">
                  <div className="inv-empty-inner">
                    <span>📦</span>
                    <span>{t('inventory.noProducts')}</span>
                  </div>
                </td>
              </tr>
            ) : paginated.map(p => {
              const status = getStockStatus(p);
              const badge  = STATUS_MAP[status];
              const profit = p.sellingPrice - p.costPrice;
              const totalValue = p.costPrice * p.stock;
              const daysSince = getDaysSinceLastSale(p);
              return (
                <tr
                  key={p.id}
                  className="inv-tr"
                  onClick={() => onProductClick(p)}
                >
                  {/* Product name + image */}
                  <td className="inv-td inv-td-name">
                    <div className="inv-prod-cell">
                      <div className="inv-prod-img">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                        ) : (
                          p.emoji
                        )}
                      </div>
                      <div>
                        <div className="inv-prod-name">{p.name}</div>
                        <div className="inv-prod-days">
                          {daysSince === 0 ? t('inventory.soldToday') : daysSince === 1 ? t('inventory.soldYesterday') : t('inventory.soldDaysAgo', { days: daysSince })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="inv-td inv-td-mono">{p.sku}</td>
                  <td className="inv-td">
                    <span className="inv-cat-chip">{p.category}</span>
                  </td>
                  {/* Stock quantity */}
                  <td className="inv-td inv-td-num">
                    <span className={`inv-qty${status !== 'in_stock' ? ' inv-qty-warn' : ''}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="inv-td inv-td-num">{formatMoney(p.costPrice)}</td>
                  <td className="inv-td inv-td-num">{formatMoney(p.sellingPrice)}</td>
                  <td className="inv-td inv-td-num inv-profit">+{formatMoney(profit)}</td>
                  <td className="inv-td inv-td-num">{formatMoney(totalValue)}</td>
                  <td className="inv-td">
                    <span className={`inv-badge ${badge.cls}`}>{badge.label}</span>
                  </td>
                  <td className="inv-td inv-td-num">{p.unitsSold30d}</td>
                  <td className="inv-td"><TrendIcon dir={p.trend} /></td>
                  <td className="inv-td inv-td-actions" onClick={e => e.stopPropagation()}>
                    <button className="inv-act-btn" title={t('inventory.actions.edit')} onClick={() => onProductClick(p)}>
                      <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M8 2l3 3L4 12H1V9L8 2z"/>
                      </svg>
                    </button>
                    <button className="inv-act-btn inv-act-restock" title={t('inventory.actions.restock')} onClick={() => onProductClick(p)}>
                      <svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M6.5 2v9M2 6.5l4.5-4.5L11 6.5"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="inv-pagination">
          <span className="inv-page-info">
            {t('inventory.pagination.showing', { start: (page - 1) * PAGE_SIZE + 1, end: Math.min(page * PAGE_SIZE, filtered.length), total: filtered.length })}
          </span>
          <div className="inv-page-btns">
            <button
              className="btn bxs inv-page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              {t('common.prev')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`btn bxs inv-page-btn${n === page ? ' bpr' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="btn bxs inv-page-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
