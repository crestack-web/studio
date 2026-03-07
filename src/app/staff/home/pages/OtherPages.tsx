import React, { useState, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';
import { getFirestore } from 'firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchRecentSales, fetchProducts } from '../services/dataService';
import { formatCurrency } from '@/lib/currency';
import { LockedPage } from '../components/shared';

interface OtherPagesProps {
  page: string;
}

// ═══════════════════════════════════════════
//  Inventory Page
// ═══════════════════════════════════════════

export function InventoryPage({ hasAccess }: { hasAccess: boolean }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        const userDoc = await getDoc(doc(getFirestore(), 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBusinessId(userData.businessId || null);
          
          if (userData.businessId) {
            const fetchedProducts = await fetchProducts(getFirestore(), userData.businessId);
            setProducts(fetchedProducts);
          }
        }
      } catch (error) {
        console.error('Error loading inventory:', error);
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  if (!hasAccess) return <LockedPage pageName="Inventory"/>;

  return (
    <div className="staff-page">
      <h2>Inventory</h2>
      <p>View current stock levels</p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <p>No products in inventory</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {products.map(product => (
            <div key={product.id} className="inventory-item">
              <div className="item-emoji">{product.emoji || '📦'}</div>
              <div className="item-info">
                <div className="item-name">{product.name}</div>
                <div className="item-price">{formatCurrency(product.price)}</div>
              </div>
              <div className={`item-stock ${product.stock <= (product.lowStockThreshold || 10) ? 'low' : 'ok'}`}>
                {product.stock} in stock
                {product.stock <= (product.lowStockThreshold || 10) && (
                  <span className="low-stock-badge">⚠️ Low</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
//  History Page
// ═══════════════════════════════════════════

export function HistoryPage({ hasAccess, sessionSales }: { hasAccess: boolean, sessionSales: any[] }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const { auth } = initializeFirebase();
        const user = auth.currentUser;
        
        if (!user) return;

        const userDoc = await getDoc(doc(getFirestore(), 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBusinessId(userData.businessId || null);
          
          if (userData.businessId) {
            const recentSales = await fetchRecentSales(getFirestore(), userData.businessId, 50);
            setSales(recentSales);
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  if (!hasAccess) return <LockedPage pageName="Sales History"/>;

  return (
    <div className="staff-page">
      <h2>Sales History</h2>
      <p>View recent transactions</p>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sales history...</p>
        </div>
      ) : sales.length === 0 ? (
        <div className="empty-state">
          <p>No sales recorded yet</p>
        </div>
      ) : (
        <div className="sales-history">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Sold By</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => {
                const date = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date();
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                return (
                  <tr key={sale.id}>
                    <td>
                      <div className="time-cell">
                        <div className="time">{timeStr}</div>
                        <div className="date">{dateStr}</div>
                      </div>
                    </td>
                    <td>
                      <div className="items-cell">
                        {sale.products?.slice(0, 2).map((p: any, i: number) => (
                          <div key={i}>{p.name} × {p.quantity}</div>
                        ))}
                        {sale.products?.length > 2 && (
                          <div className="more-items">+{sale.products.length - 2} more</div>
                        )}
                      </div>
                    </td>
                    <td className="total-cell">{formatCurrency(sale.total)}</td>
                    <td>
                      <span className={`payment-badge ${sale.paymentMethod === 'cash' ? 'cash' : 'transfer'}`}>
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="sold-by">{sale.soldByName || 'Unknown'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
//  Attendance Page
// ═══════════════════════════════════════════

export function AttendancePage({ hasAccess }: { hasAccess: boolean }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!hasAccess) return <LockedPage pageName="Attendance"/>;

  return (
    <div className="staff-page">
      <h2>Attendance</h2>
      <p>Track your work hours</p>
      
      <div className="attendance-card">
        <div className="current-time">
          <div className="time-display">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="date-display">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        
        <button
          className={`clock-btn ${clockedIn ? 'clocked-in' : 'clocked-out'}`}
          onClick={() => setClockedIn(!clockedIn)}
        >
          {clockedIn ? '🕐 Clock Out' : '⏰ Clock In'}
        </button>
        
        {clockedIn && (
          <div className="clocked-in-status">
            <span className="status-indicator">●</span> Currently Clocked In
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  Messages Page
// ═══════════════════════════════════════════

export function MessagesPage({ hasAccess }: { hasAccess: boolean }) {
  const [messages] = useState<any[]>([]);

  if (!hasAccess) return <LockedPage pageName="Messages"/>;

  return (
    <div className="staff-page">
      <h2>Messages</h2>
      <p>View messages from business owner</p>
      
      {messages.length === 0 ? (
        <div className="empty-state">
          <p>No messages yet</p>
          <p className="text-sm text-gray-500">The business owner will send you important updates here</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map(msg => (
            <div key={msg.id} className="message-card">
              <div className="message-header">
                <span className="message-from">{msg.from}</span>
                <span className="message-date">{new Date(msg.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="message-body">{msg.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
//  Settings Page
// ═══════════════════════════════════════════

export function SettingsPage({ staff, theme, onToggleTheme, onLogout, onToast }: any) {
  if (!staff) return null;

  return (
    <div className="staff-page">
      <h2>Settings</h2>
      <p>Manage your account</p>
      
      <div className="settings-section">
        <h3>Profile</h3>
        <div className="setting-item">
          <label>Name</label>
          <div className="setting-value">{staff.name}</div>
        </div>
        <div className="setting-item">
          <label>Role</label>
          <div className="setting-value">{staff.role}</div>
        </div>
      </div>
      
      <div className="settings-section">
        <h3>Preferences</h3>
        <div className="setting-item">
          <label>Theme</label>
          <button onClick={onToggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <button onClick={onLogout} className="logout-btn">
          Log Out
        </button>
      </div>
    </div>
  );
}
