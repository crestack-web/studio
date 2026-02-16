export interface ExpiredProduct {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  quantity: number;
  costPrice: number;
  totalLoss: number; // quantity × costPrice
  expiryDate: Date;
  markedExpiredDate: Date; // When it was marked as expired
  addedDate: Date; // When the batch was originally added

  // Disposal tracking
  disposalStatus: 'pending' | 'disposed' | 'returned' | 'discounted_sale';
  disposalDate?: Date;
  disposalMethod?: string; // 'trash', 'returned_to_supplier', 'donated', 'sold_at_discount'
  disposalNotes?: string;

  // Recovery tracking
  recoveredAmount?: number; // If sold at discount or returned

  createdAt: Date;
  updatedAt: Date;
}
