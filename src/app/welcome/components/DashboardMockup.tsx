"use client";

import React from 'react';

export const DashboardMockup: React.FC = () => (
  <section className="dashboard-mockup-section">
    <div className="max-w">
      <div className="section-head center">
        <div className="section-label">See Busmo in Action</div>
        <h2 className="section-title">
          Your Business.<em style={{ color: 'var(--purple-mid)' }}>At a Glance.</em>
        </h2>
        <p className="section-sub">
          A clean, intuitive dashboard designed for African business owners.
        </p>
      </div>

      <div className="dashboard-mockup-container">
        {/* Dashboard Header */}
        <div className="mockup-header">
          <div className="mockup-logo">
            <span className="mockup-busmo">Busmo</span>
          </div>
          <div className="mockup-nav">
            <span className="mockup-nav-item active">Dashboard</span>
            <span className="mockup-nav-item">Sales</span>
            <span className="mockup-nav-item">Inventory</span>
            <span className="mockup-nav-item">Staff</span>
          </div>
          <div className="mockup-user">
            <span className="mockup-avatar">👤</span>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mockup-content">
          {/* Stats Cards */}
          <div className="mockup-stats">
            <div className="mockup-card stat-primary">
              <div className="mockup-stat-label">Today's Profit</div>
              <div className="mockup-stat-value">₦47,200</div>
              <div className="mockup-stat-change positive">↑ 12% vs yesterday</div>
            </div>
            <div className="mockup-card">
              <div className="mockup-stat-label">Sales Today</div>
              <div className="mockup-stat-value">₦118,500</div>
              <div className="mockup-stat-sub">23 transactions</div>
            </div>
            <div className="mockup-card">
              <div className="mockup-stat-label">Inventory</div>
              <div className="mockup-stat-value">234</div>
              <div className="mockup-stat-sub">items in stock</div>
            </div>
            <div className="mockup-card">
              <div className="mockup-stat-label">Cash Balance</div>
              <div className="mockup-stat-value">₦156,800</div>
              <div className="mockup-stat-sub">available</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="mockup-grid">
            {/* Recent Sales */}
            <div className="mockup-panel">
              <div className="mockup-panel-header">
                <h3 className="mockup-panel-title">Recent Sales</h3>
                <span className="mockup-panel-action">View All</span>
              </div>
              <div className="mockup-list">
                <div className="mockup-list-item">
                  <div className="mockup-item-icon">🛒</div>
                  <div className="mockup-item-info">
                    <div className="mockup-item-name">Indomie Noodles</div>
                    <div className="mockup-item-meta">10:32 AM</div>
                  </div>
                  <div className="mockup-item-amount">₦4,500</div>
                </div>
                <div className="mockup-list-item">
                  <div className="mockup-item-icon">🛒</div>
                  <div className="mockup-item-info">
                    <div className="mockup-item-name">Rice (5kg)</div>
                    <div className="mockup-item-meta">9:45 AM</div>
                  </div>
                  <div className="mockup-item-amount">₦8,000</div>
                </div>
                <div className="mockup-list-item">
                  <div className="mockup-item-icon">🛒</div>
                  <div className="mockup-item-info">
                    <div className="mockup-item-name">Cooking Oil (5L)</div>
                    <div className="mockup-item-meta">8:15 AM</div>
                  </div>
                  <div className="mockup-item-amount">₦6,200</div>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="mockup-panel">
              <div className="mockup-panel-header">
                <h3 className="mockup-panel-title">Low Stock Alerts</h3>
                <span className="mockup-panel-badge">3 items</span>
              </div>
              <div className="mockup-list">
                <div className="mockup-list-item alert">
                  <div className="mockup-item-icon alert">📦</div>
                  <div className="mockup-item-info">
                    <div className="mockup-item-name">Indomie Noodles</div>
                    <div className="mockup-item-meta">8 packs left</div>
                  </div>
                  <div className="mockup-item-status urgent">Restock</div>
                </div>
                <div className="mockup-list-item alert">
                  <div className="mockup-item-icon alert">📦</div>
                  <div className="mockup-item-info">
                    <div className="mockup-item-name">Rice (5kg)</div>
                    <div className="mockup-item-meta">15kg left</div>
                  </div>
                  <div className="mockup-item-status warning">Low</div>
                </div>
                <div className="mockup-list-item alert">
                  <div className="mockup-item-icon alert">📦</div>
                  <div className="mockup-item-info">
                    <div className="mockup-item-name">Cooking Oil</div>
                    <div className="mockup-item-meta">5L left</div>
                  </div>
                  <div className="mockup-item-status warning">Low</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mockup-actions">
            <button className="mockup-action-btn primary">
              <span>➕</span>
              <span>Record Sale</span>
            </button>
            <button className="mockup-action-btn">
              <span>💸</span>
              <span>Add Expense</span>
            </button>
            <button className="mockup-action-btn">
              <span>📦</span>
              <span>Add Product</span>
            </button>
            <button className="mockup-action-btn">
              <span>🤖</span>
              <span>Ask MO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
