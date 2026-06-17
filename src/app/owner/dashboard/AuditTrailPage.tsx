'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useCurrency } from './CurrencyContext';
import { useBranch } from '@/context/BranchContext';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Pagination } from '@/components/Pagination';
import { getUserPlan } from '@/lib/featureRestrictions';
import styles from './AuditTrailPage.module.css';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  action: string;
  entityType: 'sale' | 'product' | 'supplier_credit' | 'customer_credit' | 'bank_account' | 'expense' | 'stock_transfer' | 'staff' | 'other';
  entityId: string;
  entityName: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

export function AuditTrailPage() {
  const { showToast, user } = useApp();
  const { formatMoney } = useCurrency();
  const { businessId } = useBranch();
  const { firestore } = initializeFirebase();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isProUser, setIsProUser] = useState<boolean | null>(null);

  useEffect(() => {
    checkPlan();
    setCurrentPage(1);
    loadData();
  }, [businessId, firestore, filterEntityType, filterDate]);

  const checkPlan = async () => {
    if (!user?.id) return;
    
    try {
      const plan = await getUserPlan(user.id);
      const isPro = plan === 'pro';
      setIsProUser(isPro);
      
      if (!isPro) {
        showToast('⚠️ Audit Trail requires a Pro plan');
      }
    } catch (error) {
      console.error('Error checking plan:', error);
      setIsProUser(false);
    }
  };

  const loadData = async () => {
    if (!businessId || !firestore) {
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
      
      const logsQuery = query(
        collection(firestore, 'businesses', businessId, 'auditTrail'),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const logsList: AuditLog[] = [];
      
      logsSnapshot.forEach(doc => {
        const data = doc.data();
        logsList.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          entityName: data.entityName,
          previousValues: data.previousValues,
          newValues: data.newValues,
          timestamp: data.timestamp,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        });
      });
      
      // Apply entity type filter
      let filteredLogs = logsList;
      if (filterEntityType !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.entityType === filterEntityType);
      }
      
      setLogs(filteredLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      showToast('❌ Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'sale': return '💰';
      case 'product': return '📦';
      case 'supplier_credit': return '🏭';
      case 'customer_credit': return '👤';
      case 'bank_account': return '🏦';
      case 'expense': return '📤';
      case 'stock_transfer': return '🔄';
      case 'staff': return '👥';
      default: return '📋';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'sale': return '#10b981';
      case 'product': return '#3b82f6';
      case 'supplier_credit': return '#f59e0b';
      case 'customer_credit': return '#8b5cf6';
      case 'bank_account': return '#06b6d4';
      case 'expense': return '#ef4444';
      case 'stock_transfer': return '#6366f1';
      case 'staff': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleString();
  };

  // Pagination logic
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'number') {
      return formatMoney(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return String(value);
  };

  const getChangedFields = (previous: Record<string, any> | undefined, current: Record<string, any> | undefined): Array<{ field: string; old: any; new: any }> => {
    if (!previous || !current) return [];
    
    const fields: Array<{ field: string; old: any; new: any }> = [];
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);
    
    allKeys.forEach(key => {
      if (previous[key] !== current[key]) {
        fields.push({ field: key, old: previous[key], new: current[key] });
      }
    });
    
    return fields;
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <h2 className={styles.pageTitle}>Audit Trail</h2>
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
            <h2 className={styles.pageTitle}>Audit Trail</h2>
            <p className={styles.pageDesc}>Track all financial and inventory changes</p>
          </div>
        </div>
        <div className={styles.notEligible}>
          <div className={styles.notEligibleIcon}>🔒</div>
          <h3 className={styles.notEligibleTitle}>Pro Feature</h3>
          <p className={styles.notEligibleMessage}>
            Audit Trail is available on the Pro plan only.
          </p>
          <p className={styles.notEligibleSubMessage}>
            Upgrade to Pro to access advanced audit features including:
          </p>
          <ul className={styles.notEligibleFeatures}>
            <li>Complete change history tracking</li>
            <li>Before/after value comparison</li>
            <li>User action attribution</li>
            <li>IP address and user agent logging</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Audit Trail</h2>
          <p className={styles.pageDesc}>Track all financial and inventory changes</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Entity Type</label>
          <select
            className={styles.filterSelect}
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="sale">Sales</option>
            <option value="product">Products</option>
            <option value="supplier_credit">Supplier Credit</option>
            <option value="customer_credit">Customer Credit</option>
            <option value="bank_account">Bank Accounts</option>
            <option value="expense">Expenses</option>
            <option value="stock_transfer">Stock Transfers</option>
            <option value="staff">Staff</option>
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

      {/* Audit Logs */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Change History</h3>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No audit logs recorded for this period</p>
          </div>
        ) : (
          <>
            <div className={styles.logsList}>
              {paginatedLogs.map(log => (
                <div key={log.id} className={styles.logCard} onClick={() => setSelectedLog(log)}>
                  <div className={styles.logHeader}>
                    <div className={styles.logIcon} style={{ background: getEntityTypeColor(log.entityType) + '20' }}>
                      {getEntityIcon(log.entityType)}
                    </div>
                    <div className={styles.logInfo}>
                      <h4 className={styles.logAction}>{log.action}</h4>
                      <span className={styles.logEntity}>{log.entityName}</span>
                    </div>
                    <span className={styles.logTime}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <div className={styles.logDetails}>
                    <span className={styles.logUser}>By: {log.userName}</span>
                    <span className={styles.logType} style={{ color: getEntityTypeColor(log.entityType) }}>
                      {log.entityType.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={logs.length}
                itemsPerPage={itemsPerPage}
              />
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Audit Log Details</h3>
              <button className={styles.modalClose} onClick={() => setSelectedLog(null)}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h4 className={styles.detailSectionTitle}>General Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Action:</span>
                  <span className={styles.detailValue}>{selectedLog.action}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Entity:</span>
                  <span className={styles.detailValue}>{selectedLog.entityName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Type:</span>
                  <span className={styles.detailValue} style={{ color: getEntityTypeColor(selectedLog.entityType) }}>
                    {selectedLog.entityType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>User:</span>
                  <span className={styles.detailValue}>{selectedLog.userName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Timestamp:</span>
                  <span className={styles.detailValue}>{formatTimestamp(selectedLog.timestamp)}</span>
                </div>
                {selectedLog.ipAddress && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>IP Address:</span>
                    <span className={styles.detailValue}>{selectedLog.ipAddress}</span>
                  </div>
                )}
              </div>

              {selectedLog.previousValues && selectedLog.newValues && (
                <div className={styles.detailSection}>
                  <h4 className={styles.detailSectionTitle}>Changes</h4>
                  {getChangedFields(selectedLog.previousValues, selectedLog.newValues).length === 0 ? (
                    <p className={styles.noChanges}>No changes detected</p>
                  ) : (
                    <div className={styles.changesList}>
                      {getChangedFields(selectedLog.previousValues, selectedLog.newValues).map((change, index) => (
                        <div key={index} className={styles.changeItem}>
                          <span className={styles.changeField}>{change.field}</span>
                          <div className={styles.changeValues}>
                            <span className={styles.changeOld}>
                              {formatValue(change.old)}
                            </span>
                            <span className={styles.changeArrow}>→</span>
                            <span className={styles.changeNew}>
                              {formatValue(change.new)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
