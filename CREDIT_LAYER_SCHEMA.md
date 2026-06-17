# Retail Operations & Credit Layer - Firestore Schema

## Core Principle
Simple business language, no financial jargon.
- "Supplier Credit" (not "Accounts Payable")
- "Customer Credit" (not "Accounts Receivable")
- "Collections" (not "Debt Recovery")
- "Bank Accounts" (not "General Ledger")

---

## New Collections

### 1. Supplier Credit Ledger
**Path**: `merchants/{businessId}/supplierCreditLedger/{ledgerId}`

Tracks credit received from suppliers (inventory purchased on credit).

```typescript
{
  id: string,
  supplierId: string,              // Reference to supplier
  supplierName: string,
  
  // Linked stock receipt
  stockReceiptId: string,
  receiptNumber: string,
  
  // Credit details
  totalAmount: number,            // Total value of goods received
  amountPaid: number,              // Amount paid so far
  outstandingBalance: number,     // Remaining balance
  dueDate?: Timestamp,            // Optional due date
  
  // Items received on credit
  items: [{
    productId: string,
    productName: string,
    quantity: number,
    unitCost: number,
    totalCost: number,
  }],
  
  // Payment history
  payments: [{
    paymentId: string,
    amount: number,
    paymentDate: Timestamp,
    paymentMethod: 'cash' | 'transfer' | 'bank_transfer',
    bankAccountId?: string,
    notes?: string,
  }],
  
  // Status
  status: 'pending' | 'partial' | 'paid' | 'overdue',
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  createdByName: string,
}
```

### 2. Customer Credit Ledger
**Path**: `merchants/{businessId}/customerCreditLedger/{ledgerId}`

Tracks credit given to customers (sales on credit).

```typescript
{
  id: string,
  customerId: string,             // Reference to customer
  customerName: string,
  customerPhone?: string,
  
  // Linked sale
  saleId: string,
  saleNumber: string,
  
  // Credit details
  totalAmount: number,            // Total sale value
  amountPaid: number,              // Amount paid so far
  outstandingBalance: number,     // Remaining balance
  dueDate?: Timestamp,            // Optional due date
  
  // Items sold on credit
  items: [{
    productId: string,
    productName: string,
    quantity: number,
    unitPrice: number,
    totalPrice: number,
  }],
  
  // Payment history
  payments: [{
    paymentId: string,
    amount: number,
    paymentDate: Timestamp,
    paymentMethod: 'cash' | 'transfer' | 'bank_transfer',
    bankAccountId?: string,
    collectedBy: string,
    collectedByName: string,
    notes?: string,
  }],
  
  // Status
  status: 'pending' | 'partial' | 'paid' | 'overdue',
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: string,
  createdByName: string,
}
```

### 3. Bank Accounts
**Path**: `merchants/{businessId}/bankAccounts/{accountId}`

Multiple bank accounts for the business.

```typescript
{
  id: string,
  accountName: string,            // e.g., "Access Bank - Main Account"
  accountNumber?: string,         // Last 4 digits for identification
  bankName: string,               // e.g., "Access Bank", "UBA", "Opay"
  accountType: 'cash' | 'bank' | 'mobile_money' | 'pos',
  
  // Balance tracking
  openingBalance: number,
  currentBalance: number,
  
  // Transaction summary
  totalMoneyIn: number,
  totalMoneyOut: number,
  
  // Status
  isActive: boolean,
  isDefault: boolean,            // Default account for collections
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 4. Bank Transactions
**Path**: `merchants/{businessId}/bankTransactions/{transactionId}`

Every money movement linked to a bank account.

```typescript
{
  id: string,
  transactionNumber: string,      // Auto-generated: TXN-YYYY-XXXXX
  
  // Account
  bankAccountId: string,
  accountName: string,
  
  // Transaction details
  type: 'money_in' | 'money_out',
  category: 'sale' | 'collection' | 'expense' | 'supplier_payment' | 'withdrawal' | 'deposit' | 'transfer',
  
  // Amount
  amount: number,
  balanceAfter: number,          // Account balance after transaction
  
  // Reference
  referenceId?: string,          // Sale ID, Credit Ledger ID, Expense ID, etc.
  referenceType?: 'sale' | 'supplier_credit' | 'customer_credit' | 'expense',
  
  // Description
  description: string,
  
  // Payment method
  paymentMethod: 'cash' | 'transfer' | 'bank_transfer' | 'pos' | 'mobile_money',
  
  // Metadata
  performedBy: string,
  performedByName: string,
  notes?: string,
  createdAt: Timestamp,
}
```

### 5. Cash Flow Records
**Path**: `merchants/{businessId}/cashFlow/{flowId}`

Daily cash flow summaries (can be aggregated for weekly/monthly).

```typescript
{
  id: string,
  date: Timestamp,                // The date (start of day)
  
  // Money In
  moneyIn: {
    sales: number,
    collections: number,
    deposits: number,
    transfers: number,
    other: number,
    total: number,
  },
  
  // Money Out
  moneyOut: {
    expenses: number,
    supplierPayments: number,
    withdrawals: number,
    transfers: number,
    purchases: number,
    other: number,
    total: number,
  },
  
  // Net
  netCashFlow: number,           // moneyIn.total - moneyOut.total
  
  // Opening/closing balances (across all accounts)
  openingBalance: number,
  closingBalance: number,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### 6. Staff Activity Log
**Path**: `merchants/{businessId}/staffActivity/{activityId}`

Audit trail for all staff actions.

```typescript
{
  id: string,
  activityNumber: string,        // Auto-generated: ACT-YYYY-XXXXX
  
  // Staff
  staffId: string,
  staffName: string,
  staffRole: 'owner' | 'manager' | 'cashier' | 'storekeeper' | 'admin',
  
  // Action
  action: 'sale_recorded' | 'inventory_added' | 'inventory_removed' | 'stock_transferred' | 
          'credit_collected' | 'supplier_paid' | 'expense_recorded' | 'product_updated' |
          'price_updated' | 'customer_created' | 'refund_processed',
  
  // Details
  entityType: 'sale' | 'product' | 'supplier' | 'customer' | 'expense' | 'transfer',
  entityId: string,
  entityName: string,
  
  // Change tracking
  previousValue?: any,
  newValue?: any,
  
  // Financial impact (if applicable)
  amount?: number,
  
  // Location/branch
  branchId?: string,
  branchName?: string,
  
  // Metadata
  description: string,
  ipAddress?: string,
  deviceInfo?: string,
  createdAt: Timestamp,
}
```

### 7. Receipt Templates
**Path**: `merchants/{businessId}/receiptTemplates/{templateId}`

Customizable receipt templates.

```typescript
{
  id: string,
  templateName: string,           // e.g., "Thermal 58mm", "Thermal 80mm", "A4"
  
  // Template settings
  paperSize: '58mm' | '80mm' | 'a4',
  showLogo: boolean,
  showBusinessAddress: boolean,
  showCustomerPhone: boolean,
  showBarcode: boolean,
  showQrCode: boolean,
  
  // Custom header/footer
  headerText?: string,
  footerText?: string,
  
  // Metadata
  isActive: boolean,
  isDefault: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

---

## Schema Updates to Existing Collections

### Sales Collection Update
Add warehouse source selection and bank account tracking.

```typescript
// Add to existing sales document
{
  // ... existing fields ...
  
  // Warehouse source
  sourceLocation: 'main_store' | 'back_store' | 'warehouse' | string, // branch ID if branch
  sourceLocationName: string,
  
  // Bank account for payment
  bankAccountId?: string,
  bankAccountName?: string,
  
  // Receipt generation
  receiptGenerated: boolean,
  receiptNumber?: string,
}
```

### Stock Receipts Collection Update
Add bank account tracking for payments.

```typescript
// Add to existing stockReceipts document
{
  // ... existing fields ...
  
  // Bank account for payment
  bankAccountId?: string,
  bankAccountName?: string,
}
```

### Products Collection Update
Add warehouse-specific stock tracking.

```typescript
// Add to existing products document
{
  // ... existing fields ...
  
  // Warehouse source tracking
  stockByLocation: {
    main_store: number,
    back_store: number,
    warehouse: number,
    [branchId: string]: number,
  },
  
  // Last sale location tracking
  lastSaleLocation?: string,
  lastSaleLocationName?: string,
}
```

---

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "supplierCreditLedger",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "supplierId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "supplierCreditLedger",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "customerCreditLedger",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customerId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "customerCreditLedger",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bankTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "bankAccountId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bankTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bankTransactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "referenceId", "order": "ASCENDING" },
        { "fieldPath": "referenceType", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "cashFlow",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "staffActivity",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "staffId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "staffActivity",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "action", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "staffActivity",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "entityType", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## Security Rules

### Supplier Credit Ledger
- Read: Business owner and staff
- Create: Business owner and staff (during stock receipt)
- Update: Business owner (for payments)
- Delete: Business owner only

### Customer Credit Ledger
- Read: Business owner and staff
- Create: Business owner and staff (during sale)
- Update: Business owner and staff (for collections)
- Delete: Business owner only

### Bank Accounts
- Read: Business owner and staff
- Create: Business owner only
- Update: Business owner only
- Delete: Business owner only

### Bank Transactions
- Read: Business owner and staff
- Create: Business owner and staff (auto-generated on transactions)
- Update: Never (immutable)
- Delete: Business owner only

### Cash Flow
- Read: Business owner and staff
- Create: System (auto-generated daily)
- Update: System (auto-generated daily)
- Delete: Business owner only

### Staff Activity Log
- Read: Business owner and staff
- Create: System (auto-generated on all actions)
- Update: Never (immutable)
- Delete: Business owner only

### Receipt Templates
- Read: Business owner and staff
- Create: Business owner only
- Update: Business owner only
- Delete: Business owner only

---

## Data Flow Examples

### Supplier Credit Flow
1. Stock receipt created with partial payment
2. Supplier credit ledger entry created automatically
3. Outstanding balance tracked
4. Payment recorded → ledger updated → bank transaction created
5. Balance reaches zero → status changes to 'paid'

### Customer Credit Flow
1. Sale recorded with partial payment
2. Customer credit ledger entry created automatically
3. Outstanding balance tracked
4. Collection recorded → ledger updated → bank transaction created
5. Balance reaches zero → status changes to 'paid'

### Bank Transaction Flow
1. Any financial transaction (sale, collection, expense, payment)
2. Bank transaction created automatically
3. Account balance updated
4. Cash flow record updated (daily aggregation)

### Activity Logging Flow
1. Any action performed by staff
2. Activity log entry created automatically
3. Previous/new values captured
4. Staff ID and role recorded
5. Timestamp and device info captured

---

## Migration Path

1. Create new collections
2. Update existing collections (sales, stockReceipts, products)
3. Create indexes
4. Migrate existing credit data (if any)
5. Initialize default bank account for existing businesses
6. Update UI components to use new schema
7. Enable activity logging for all actions
