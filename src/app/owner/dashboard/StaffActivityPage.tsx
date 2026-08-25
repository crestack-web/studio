'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { fetchDocs } from '@/lib/supabase-client-data';
import { Pagination } from '@/components/Pagination';
import { getUserPlan } from '@/lib/featureRestrictions';
import styles from './StaffActivityPage.module.css';

interface StaffActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  role: 'Owner' | 'Manager' | 'Storekeeper' | 'Cashier' | 'Admin';
  action: string;
  actionType: 'sale' | 'inventory' | 'transfer' | 'collection' | 'payment' | 'expense' | 'product_update' | 'other';
  details: string;
  timestamp: string | Date;
  metadata?: {
    saleId?: string;
    productId?: string;
    amount?: number;
    quantity?: number;
    location?: string;
  };
}

interface StaffSummary {
  userId: string;
  userName: string;
  role: string;
  totalActions: number;
  salesCount: number;
  totalRevenue: number;
  lastActivity: string | Date;
}

export function StaffActivityPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  
  const [activities, setActivities] = useState<StaffActivity[]>([]);
  const [staffSummaries, setStaffSummaries] = useState<StaffSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isProUser, setIsProUser] = useState<boolean | null>(null);

  useEffect(() => {
    checkPlan();
    setCurrentPage(1);
    loadData();
  }, [businessId, filterRole, filterAction, filterDate]);

  const checkPlan = async () => {
    if (!user?.id) return;
    
    try {
      const plan = await getUserPlan(user.id);
      const isPro = plan === 'pro';
      setIsProUser(isPro);
      
      if (!isPro) {
        showToast('⚠️ Staff Activity Monitoring requires a Pro plan');
      }
    } catch (error) {
      console.error('Error checking plan:', error);
      setIsProUser(false);
    }
  };

  const loadData = async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const now = new Date();
      let startDate: Date;
      
      if (filterDate === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (filterDate === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const activitiesList = await fetchDocs(`businesses/${businessId}/staffActivity`, {
        filters: [{ field: 'timestamp', op: '>=', value: startDate.toISOString() }],
        orderBy: { field: 'timestamp', ascending: false },
        limit: 100,
      });
      
      // Apply filters
      let filteredActivities = activitiesList;
      
      if (filterRole !== 'all') {
        filteredActivities = filteredActivities.filter(a => a.role === filterRole);
      }
      
      if (filterAction !== 'all') {
        filteredActivities = filteredActivities.filter(a => a.actionType === filterAction);
      }
      
      setActivities(filteredActivities);
      
      // Calculate staff summaries
      const summaryMap = new Map<string, StaffSummary>();
      
      activitiesList.forEach(activity => {
        const existing = summaryMap.get(activity.userId);
        
        if (existing) {
          existing.totalActions++;
          if (activity.actionType === 'sale') {
            existing.salesCount++;
            existing.totalRevenue += activity.metadata?.amount || 0;
          }
          if (activity.timestamp > existing.lastActivity) {
            existing.lastActivity = activity.timestamp;
          }
        } else {
          summaryMap.set(activity.userId, {
            userId: activity.userId,
            userName: activity.userName,
            role: activity.role,
            totalActions: 1,
            salesCount: activity.actionType === 'sale' ? 1 : 0,
            totalRevenue: activity.actionType === 'sale' ? (activity.metadata?.amount || 0) : 0,
            lastActivity: activity.timestamp,
          });
        }
      });
      
      setStaffSummaries(Array.from(summaryMap.values()));
    } catch (error) {
      console.error('Error loading staff activity:', error);
      showToast('❌ Failed to load staff activity');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'sale': return '💰';
      case 'inventory': return '📦';
      case 'transfer': return '🔄';
      case 'collection': return '📥';
      case 'payment': return '💳';
      case 'expense': return '📤';
      case 'product_update': return '✏️';
      default: return '📋';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Owner': return '#6b7280';
      case 'Manager': return '#3b82f6';
      case 'Storekeeper': return '#10b981';
      case 'Cashier': return '#f59e0b';
      case 'Admin': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Pagination logic
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const paginatedActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalActions = activities.length;
  const totalSales = staffSummaries.reduce((sum, s) => sum + s.salesCount, 0);
  const totalRevenue = staffSummaries.reduce((sum, s) => sum + s.totalRevenue, 0);

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Staff Activity</h2>
          <p className={styles.pageDesc}>Loading...</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  if (isProUser === false) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h2 className={styles.pageTitle}>Staff Activity</h2>
            <p className={styles.pageDesc}>Monitor staff actions and performance</p>
          </div>
        </div>
        <div className={styles.notEligible}>
          <div className={styles.notEligibleIcon}>🔒</div>
          <h3 className={styles.notEligibleTitle}>Pro Feature</h3>
          <p className={styles.notEligibleMessage}>
            Staff Activity Monitoring is available on the Pro plan only.
          </p>
          <p className={styles.notEligibleSubMessage}>
            Upgrade to Pro to access advanced staff monitoring features including:
          </p>
          <ul className={styles.notEligibleFeatures}>
            <li>Complete activity history tracking</li>
            <li>Staff performance analytics</li>
            <li>Sales attribution by staff</li>
            <li>Role-based activity filtering</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Staff Activity</h2>
          <p className={styles.pageDesc}>Monitor staff actions and performance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>👥</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Staff</span>
            <span className={styles.summaryValue}>{staffSummaries.length}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📊</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Actions</span>
            <span className={styles.summaryValue}>{totalActions}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Sales Recorded</span>
            <span className={styles.summaryValue}>{totalSales}</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💵</div>
          <div className={styles.summaryInfo}>
            <span className={styles.summaryLabel}>Total Revenue</span>
            <span className={styles.summaryValue}>{formatMoney(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Role</label>
          <select
            className={styles.filterSelect}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="Owner">Owner</option>
            <option value="Manager">Manager</option>
            <option value="Storekeeper">Storekeeper</option>
            <option value="Cashier">Cashier</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Action Type</label>
          <select
            className={styles.filterSelect}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="sale">Sales</option>
            <option value="inventory">Inventory</option>
            <option value="transfer">Transfers</option>
            <option value="collection">Collections</option>
            <option value="payment">Payments</option>
            <option value="expense">Expenses</option>
            <option value="product_update">Product Updates</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date Range</label>
          <select
            className={styles.filterSelect}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Staff Summaries */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Staff Performance</h3>
        {staffSummaries.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No staff activity recorded</p>
          </div>
        ) : (
          <div className={styles.staffGrid}>
            {staffSummaries.map(staff => (
              <div key={staff.userId} className={styles.staffCard}>
                <div className={styles.staffHeader}>
                  <div className={styles.staffAvatar}>
                    {staff.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.staffInfo}>
                    <h4 className={styles.staffName}>{staff.userName}</h4>
                    <span
                      className={styles.staffRole}
                      style={{ color: getRoleColor(staff.role) }}
                    >
                      {staff.role}
                    </span>
                  </div>
                </div>
                <div className={styles.staffStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Actions</span>
                    <span className={styles.statValue}>{staff.totalActions}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Sales</span>
                    <span className={styles.statValue}>{staff.salesCount}</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Revenue</span>
                    <span className={styles.statValue}>{formatMoney(staff.totalRevenue)}</span>
                  </div>
                </div>
                <div className={styles.staffFooter}>
                  <span className={styles.lastActivity}>
                    Last active: {formatTimestamp(staff.lastActivity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Activity Log</h3>
        {activities.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No activity recorded for this period</p>
          </div>
        ) : (
          <>
            <div className={styles.activityList}>
              {paginatedActivities.map(activity => (
                <div key={activity.id} className={styles.activityCard}>
                  <div className={styles.activityHeader}>
                    <div className={styles.activityIcon}>
                      {getActionIcon(activity.actionType)}
                    </div>
                    <div className={styles.activityInfo}>
                      <h4 className={styles.activityAction}>{activity.action}</h4>
                      <span className={styles.activityUser}>{activity.userName}</span>
                    </div>
                    <span className={styles.activityTime}>
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  <div className={styles.activityDetails}>
                    <p className={styles.activityDescription}>{activity.details}</p>
                    {activity.metadata && (
                      <div className={styles.activityMetadata}>
                        {activity.metadata.amount && (
                          <span>Amount: {formatMoney(activity.metadata.amount)}</span>
                        )}
                        {activity.metadata.quantity && (
                          <span>Quantity: {activity.metadata.quantity}</span>
                        )}
                        {activity.metadata.location && (
                          <span>Location: {activity.metadata.location}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={activities.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

