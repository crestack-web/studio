'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { useTranslation } from './LangContext';
import { useCurrency } from './CurrencyContext';
import { Card, CardHeader, CardIcon } from './Card';
import { Button } from './Button';
import { Pill } from './Badge';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where, updateDoc, doc, getDoc, addDoc, Timestamp } from 'firebase/firestore';
import styles from './InvoiceVerificationPage.module.css';

interface Invoice {
  id: string;
  invoiceNumber: string;
  saleId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  sourceLocation: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  pickupStatus?: 'pending' | 'assigned' | 'confirmed' | 'completed';
  pickupWarehouse?: string;
  pickupAssignedAt?: Date;
  pickupConfirmedAt?: Date;
  pickupConfirmedBy?: string;
}

interface StockRequest {
  id: string;
  invoiceId: string;
  productId: string;
  productName: string;
  quantity: number;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export function InvoiceVerificationPage() {
  const { showToast, user } = useApp();
  const { t } = useTranslation();
  const { formatMoney, currencyCode } = useCurrency();
  const { firestore } = initializeFirebase();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stockRequests, setStockRequests] = useState<StockRequest[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);

  useEffect(() => {
    loadInvoices();
    loadStockRequests();
  }, [firestore, user]);

  const loadInvoices = async () => {
    if (!firestore || !user) return;

    try {
      setIsLoading(true);
      const businessId = user.id; // Assuming user.id is the business ID for owner
      
      const invoicesQuery = query(
        collection(firestore, 'businesses', businessId, 'invoices'),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(invoicesQuery);
      const loadedInvoices: Invoice[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedInvoices.push({
          id: doc.id,
          invoiceNumber: data.invoiceNumber || '',
          saleId: data.saleId || '',
          customerName: data.customerName || '',
          customerPhone: data.customerPhone || '',
          items: data.items || [],
          totalAmount: data.totalAmount || 0,
          sourceLocation: data.sourceLocation || '',
          status: data.status || 'pending',
          createdAt: data.createdAt?.toDate() || new Date(),
          verifiedBy: data.verifiedBy,
          verifiedAt: data.verifiedAt?.toDate(),
          notes: data.notes,
        });
      });
      
      setInvoices(loadedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('❌ Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStockRequests = async () => {
    if (!firestore || !user) return;

    try {
      const businessId = user.id;
      
      const requestsQuery = query(
        collection(firestore, 'businesses', businessId, 'stockRequests'),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const loadedRequests: StockRequest[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        loadedRequests.push({
          id: doc.id,
          invoiceId: data.invoiceId || '',
          productId: data.productId || '',
          productName: data.productName || '',
          quantity: data.quantity || 0,
          location: data.location || '',
          status: data.status || 'pending',
          requestedBy: data.requestedBy || '',
          requestedAt: data.requestedAt?.toDate() || new Date(),
          approvedBy: data.approvedBy,
          approvedAt: data.approvedAt?.toDate(),
        });
      });
      
      setStockRequests(loadedRequests);
    } catch (error) {
      console.error('Error loading stock requests:', error);
    }
  };

  const handleVerifyInvoice = async (approved: boolean) => {
    if (!selectedInvoice || !firestore || !user) return;

    try {
      const businessId = user.id;
      const invoiceRef = doc(firestore, 'businesses', businessId, 'invoices', selectedInvoice.id);
      
      await updateDoc(invoiceRef, {
        status: approved ? 'verified' : 'rejected',
        verifiedBy: user.name,
        verifiedAt: Timestamp.now(),
        notes: verificationNotes,
        pickupStatus: approved ? 'assigned' : 'pending',
        pickupWarehouse: approved ? selectedInvoice.sourceLocation : undefined,
        pickupAssignedAt: approved ? Timestamp.now() : undefined,
      });

      // If approved, create stock requests for each item
      if (approved) {
        for (const item of selectedInvoice.items) {
          await addDoc(collection(firestore, 'businesses', businessId, 'stockRequests'), {
            invoiceId: selectedInvoice.id,
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            location: selectedInvoice.sourceLocation,
            status: 'pending',
            requestedBy: user.name,
            requestedAt: Timestamp.now(),
          });
        }
      }

      showToast(`✅ Invoice ${approved ? 'verified' : 'rejected'} successfully`);
      setSelectedInvoice(null);
      setVerificationNotes('');
      loadInvoices();
      loadStockRequests();
    } catch (error) {
      console.error('Error verifying invoice:', error);
      showToast('❌ Failed to verify invoice');
    }
  };

  const handleConfirmPickup = async (invoiceId: string) => {
    if (!firestore || !user) return;

    try {
      const businessId = user.id;
      const invoiceRef = doc(firestore, 'businesses', businessId, 'invoices', invoiceId);
      
      await updateDoc(invoiceRef, {
        pickupStatus: 'confirmed',
        pickupConfirmedAt: Timestamp.now(),
        pickupConfirmedBy: user.name,
      });

      showToast('✅ Pickup confirmed successfully');
      loadInvoices();
    } catch (error) {
      console.error('Error confirming pickup:', error);
      showToast('❌ Failed to confirm pickup');
    }
  };

  const handleApproveStockRequest = async (requestId: string) => {
    if (!firestore || !user) return;

    try {
      const businessId = user.id;
      const requestRef = doc(firestore, 'businesses', businessId, 'stockRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy: user.name,
        approvedAt: Timestamp.now(),
      });

      showToast('✅ Stock request approved');
      loadStockRequests();
    } catch (error) {
      console.error('Error approving stock request:', error);
      showToast('❌ Failed to approve stock request');
    }
  };

  const handleRejectStockRequest = async (requestId: string) => {
    if (!firestore || !user) return;

    try {
      const businessId = user.id;
      const requestRef = doc(firestore, 'businesses', businessId, 'stockRequests', requestId);
      
      await updateDoc(requestRef, {
        status: 'rejected',
        approvedBy: user.name,
        approvedAt: Timestamp.now(),
      });

      showToast('✅ Stock request rejected');
      loadStockRequests();
    } catch (error) {
      console.error('Error rejecting stock request:', error);
      showToast('❌ Failed to reject stock request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Invoice Verification</h1>
        <p>Verify wholesale invoices and manage stock requests</p>
      </div>

      {/* Pending Invoices Section */}
      <Card className={styles.section}>
        <CardHeader>
          <CardIcon bg="#6B3FE7">📋</CardIcon>
          <h2>Pending Invoices</h2>
        </CardHeader>
        
        {invoices.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No pending invoices to verify</p>
          </div>
        ) : (
          <div className={styles.invoiceList}>
            {invoices.map(invoice => (
              <div key={invoice.id} className={styles.invoiceCard}>
                <div className={styles.invoiceHeader}>
                  <div>
                    <h3>{invoice.invoiceNumber}</h3>
                    <p className={styles.customerInfo}>{invoice.customerName} • {invoice.customerPhone}</p>
                  </div>
                  <div className={styles.invoiceMeta}>
                    <Pill>Pending</Pill>
                    <span className={styles.date}>{invoice.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className={styles.invoiceDetails}>
                  <p><strong>Source:</strong> {invoice.sourceLocation}</p>
                  <p><strong>Total:</strong> {formatMoney(invoice.totalAmount)}</p>
                  <p><strong>Items:</strong> {invoice.items.length}</p>
                  {invoice.pickupStatus && (
                    <p><strong>Pickup Status:</strong> {invoice.pickupStatus}</p>
                  )}
                  {invoice.pickupWarehouse && (
                    <p><strong>Pickup Warehouse:</strong> {invoice.pickupWarehouse}</p>
                  )}
                </div>
                
                <div className={styles.invoiceActions}>
                  {invoice.pickupStatus === 'assigned' && (
                    <Button 
                      onClick={() => handleConfirmPickup(invoice.id)}
                      className={styles.confirmPickupButton}
                    >
                      Confirm Pickup
                    </Button>
                  )}
                  <Button 
                    onClick={() => setSelectedInvoice(invoice)}
                    className={styles.verifyButton}
                  >
                    Review & Verify
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Stock Requests Section */}
      <Card className={styles.section}>
        <CardHeader>
          <CardIcon bg="#6B3FE7">📦</CardIcon>
          <h2>Stock Requests</h2>
        </CardHeader>
        
        {stockRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No pending stock requests</p>
          </div>
        ) : (
          <div className={styles.requestList}>
            {stockRequests.map(request => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestInfo}>
                  <h3>{request.productName}</h3>
                  <p>Quantity: {request.quantity}</p>
                  <p>Location: {request.location}</p>
                  <p>Requested by: {request.requestedBy}</p>
                </div>
                
                <div className={styles.requestActions}>
                  <Button 
                    onClick={() => handleApproveStockRequest(request.id)}
                    className={styles.approveButton}
                  >
                    Approve
                  </Button>
                  <Button 
                    onClick={() => handleRejectStockRequest(request.id)}
                    className={styles.rejectButton}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Invoice Verification Modal */}
      {selectedInvoice && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Verify Invoice: {selectedInvoice.invoiceNumber}</h2>
              <button onClick={() => setSelectedInvoice(null)} className={styles.closeButton}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.invoiceDetailsFull}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Customer:</span>
                  <span>{selectedInvoice.customerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Phone:</span>
                  <span>{selectedInvoice.customerPhone}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Source Location:</span>
                  <span>{selectedInvoice.sourceLocation}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Date:</span>
                  <span>{selectedInvoice.createdAt.toLocaleString()}</span>
                </div>
              </div>
              
              <h3>Items</h3>
              <div className={styles.itemsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatMoney(item.price)}</td>
                        <td>{formatMoney(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className={styles.totalRow}>
                <strong>Total: {formatMoney(selectedInvoice.totalAmount)}</strong>
              </div>
              
              <div className={styles.notesSection}>
                <label>Verification Notes:</label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  className={styles.notesTextarea}
                />
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <Button 
                onClick={() => handleVerifyInvoice(false)}
                className={styles.rejectButton}
              >
                Reject Invoice
              </Button>
              <Button 
                onClick={() => handleVerifyInvoice(true)}
                className={styles.approveButton}
              >
                Verify & Create Stock Requests
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
