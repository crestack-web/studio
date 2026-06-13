export interface ExpiryAlert {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  quantity: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  alertType: 'warning' | 'critical' | 'expired';
  status: 'active' | 'dismissed' | 'resolved' | 'expired';

  notificationsSent: Array<{
    channel: 'email' | 'sms' | 'push' | 'whatsapp';
    sentAt: Date;
    status: 'sent' | 'failed';
  }>;

  action?: {
    type: 'sold' | 'discounted' | 'disposed' | 'ignored';
    date: Date;
    notes?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}
