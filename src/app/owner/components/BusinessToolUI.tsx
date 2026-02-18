// Converted from provided HTML UI
// Font style: Segoe UI, Arial, sans-serif
import React, { useState, useEffect } from 'react';

// TODO: Break into smaller components for each tab/page
// TODO: Replace all inline event handlers with React logic
// TODO: Replace all document.getElementById with React state
// TODO: Replace all form save simulations with actual handlers
// TODO: Replace all hardcoded values with props/data

const fontFamily = 'Segoe UI, Arial, sans-serif';

export default function BusinessToolUI({ activeTab, onClose }) {
  const [tab, setTab] = useState(activeTab || 'add-product');

  // Sync tab state with activeTab prop
  useEffect(() => {
    if (activeTab && activeTab !== tab) {
      setTab(activeTab);
    }
  }, [activeTab]);

  // ...existing state and handlers for each form...

  return (
    <div style={{ fontFamily }}>
      {/* Top Nav */}
      <nav className="topnav">
        <div className="topnav-left">
          <button className="back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Owner Home
          </button>
          <div className="topnav-divider"></div>
          <div className="topnav-title">{tab === 'add-product' ? 'Add Product' : tab === 'add-expense' ? 'Add Expense' : tab === 'cashflow' ? 'Cashflow' : 'Summary & Statement'}</div>
        </div>
        <div className="page-tabs">
          <button className={tab === 'add-product' ? 'page-tab active' : 'page-tab'} onClick={() => setTab('add-product')}>Add Product</button>
          <button className={tab === 'add-expense' ? 'page-tab active' : 'page-tab'} onClick={() => setTab('add-expense')}>Add Expense</button>
          <button className={tab === 'cashflow' ? 'page-tab active' : 'page-tab'} onClick={() => setTab('cashflow')}>Cashflow</button>
          <button className={tab === 'statement' ? 'page-tab active' : 'page-tab'} onClick={() => setTab('statement')}>Summary & Statement</button>
        </div>
        <div className="topnav-right">
          {/* Print/Download buttons for statement tab */}
          {tab === 'statement' && (
            <>
              <button className="btn btn-ghost btn-sm">Print</button>
              <button className="btn btn-ghost btn-sm">Download PDF</button>
            </>
          )}
        </div>
      </nav>
      {/* Pages */}
      <div className={tab === 'add-product' ? 'page active' : 'page'}> {/* Add Product UI here */} </div>
      <div className={tab === 'add-expense' ? 'page active' : 'page'}> {/* Add Expense UI here */} </div>
      <div className={tab === 'cashflow' ? 'page active' : 'page'}> {/* Cashflow UI here */} </div>
      <div className={tab === 'statement' ? 'page active' : 'page'}> {/* Statement UI here */} </div>
    </div>
  );
}
