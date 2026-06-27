'use client';

import React from 'react';
import styles from './ActionConfirmationModal.module.css';

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: 'record_sale' | 'add_product' | 'other';
  actionData: any;
  productDetails?: {
    name: string;
    sellingPrice: number;
    costPrice: number;
    currentStock: number;
  };
}

export function ActionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  actionData,
  productDetails,
}: ActionConfirmationModalProps) {
  if (!isOpen) return null;

  const renderSaleConfirmation = () => {
    const quantity = actionData.quantity || 1;
    const productName = actionData.productName || productDetails?.name || 'Unknown Product';
    const price = productDetails?.sellingPrice || actionData.price || 0;
    const costPrice = productDetails?.costPrice || actionData.costPrice || 0;
    const totalRevenue = price * quantity;
    const totalCost = costPrice * quantity;
    const profit = totalRevenue - totalCost;

    return (
      <div className={styles.confirmationContent}>
        <div className={styles.confirmationIcon}>🛒</div>
        <h3 className={styles.confirmationTitle}>Confirm Sale Recording</h3>
        
        <div className={styles.productCard}>
          <div className={styles.productHeader}>
            <span className={styles.productName}>{productName}</span>
            <span className={styles.productQuantity}>x{quantity}</span>
          </div>
          
          <div className={styles.productDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Unit Price:</span>
              <span className={styles.detailValue}>₦{price.toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cost Price:</span>
              <span className={styles.detailValue}>₦{costPrice.toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Total Revenue:</span>
              <span className={styles.detailValue}>₦{totalRevenue.toLocaleString()}</span>
            </div>
            {profit > 0 && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Profit:</span>
                <span className={`${styles.detailValue} ${styles.profit}`}>₦{profit.toLocaleString()}</span>
              </div>
            )}
            {productDetails?.currentStock !== undefined && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Current Stock:</span>
                <span className={styles.detailValue}>{productDetails.currentStock} units</span>
              </div>
            )}
          </div>
        </div>

        <p className={styles.confirmationText}>
          Do you want to record this sale? This will update your inventory and sales records.
        </p>
      </div>
    );
  };

  const renderAddProductConfirmation = () => {
    const productName = actionData.name || 'Unknown Product';
    const price = actionData.price || 0;
    const costPrice = actionData.costPrice || 0;
    const stock = actionData.stock || 0;
    const category = actionData.category || 'Uncategorized';

    return (
      <div className={styles.confirmationContent}>
        <div className={styles.confirmationIcon}>📦</div>
        <h3 className={styles.confirmationTitle}>Confirm Product Addition</h3>
        
        <div className={styles.productCard}>
          <div className={styles.productHeader}>
            <span className={styles.productName}>{productName}</span>
          </div>
          
          <div className={styles.productDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Category:</span>
              <span className={styles.detailValue}>{category}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Selling Price:</span>
              <span className={styles.detailValue}>₦{price.toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cost Price:</span>
              <span className={styles.detailValue}>₦{costPrice.toLocaleString()}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Opening Stock:</span>
              <span className={styles.detailValue}>{stock} units</span>
            </div>
          </div>
        </div>

        <p className={styles.confirmationText}>
          Do you want to add this product to your inventory?
        </p>
      </div>
    );
  };

  const renderOtherConfirmation = () => {
    return (
      <div className={styles.confirmationContent}>
        <div className={styles.confirmationIcon}>⚡</div>
        <h3 className={styles.confirmationTitle}>Confirm Action</h3>
        <p className={styles.confirmationText}>
          MO wants to perform an action. Do you want to proceed?
        </p>
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {actionType === 'record_sale' && renderSaleConfirmation()}
        {actionType === 'add_product' && renderAddProductConfirmation()}
        {actionType === 'other' && renderOtherConfirmation()}
        
        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
