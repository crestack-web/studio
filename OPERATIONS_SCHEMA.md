# Operations Layer Firestore Schema

## Core Principle
Use simple business language, not ERP terminology.
- "Receive Stock" (not "Goods Received Notes")
- "Suppliers" (not "Vendor Master")
- "Move Stock" (not "Inventory Transfer")
- "Restock" (not "Reorder")

## New Collections

### 1. Suppliers Collection
**Path**: `merchants/{businessId}/suppliers/{supplierId}`

Auto-generated from stock receipts. Never manually created.

```typescript
{
  id: string,
  name: string,                    // Supplier name (from receipt)
  phone?: string,                  // Optional phone number
  email?: string,                  // Optional email
  address?: string,                // Optional address
  
  // Analytics (auto-calculated)
  productsSupplied: string[],      // Array of product IDs
  totalAmountSpent: number,        // Total purchases from this supplier
  lastSupplyDate: Timestamp,       // Most recent stock receipt date
  supplyCount: number,             // Number of times supplied
  
  // Credit tracking (optional)
  outstandingBalance?: number,     // If credit purchases supported
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  active: boolean
}
```

### 2. Stock Receipts Collection
**Path**: `merchants/{businessId}/stockReceipts/{receiptId}`

Records when stock is received from suppliers.

```typescript
{
  id: string,
  receiptNumber: string,          // Auto-generated: REC-YYYY-XXXXX
  
  // Supplier info
  supplierId: string,              // Reference to supplier (auto-created if new)
  supplierName: string,            // Denormalized for quick access
  
  // Receipt details
  items: [{
    productId: string,
    productName: string,
    quantity: number,
    unitCost: number,
    totalCost: number,
    location: 'main_store' | 'back_store' | 'warehouse',
  }],
  
  // Totals
  totalQuantity: number,
  totalCost: number,
  
  // Location where stock was received
  receivedAt: 'main_store' | 'back_store' | 'warehouse',
  
  // Payment info
  paymentMethod: 'cash' | 'transfer' | 'credit',
  paidAmount: number,
  creditAmount?: number,           // If on credit
  
  // Metadata
  receivedBy: string,             // User ID who received stock
  receivedByName: string,         // User's name
  notes?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 3. Stock Locations Collection
**Path**: `merchants/{businessId}/stockLocations/{locationId}`

Defines available storage locations.

```typescript
{
  id: string,
  name: string,                    // e.g., "Main Store", "Back Store", "Warehouse"
  type: 'main_store' | 'back_store' | 'warehouse' | 'branch',
  branchId?: string,               // If this is a branch location
  address?: string,
  
  // Analytics
  totalStockValue: number,         // Calculated from products
  productCount: number,
  
  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  active: boolean
}
```

### 4. Stock Transfers Collection
**Path**: `merchants/{businessId}/stockTransfers/{transferId}`

Records stock movements between locations.

```typescript
{
  id: string,
  transferNumber: string,          // Auto-generated: TRF-YYYY-XXXXX
  
  // Movement details
  fromLocation: string,            // Location ID or type
  fromLocationName: string,
  toLocation: string,              // Location ID or type
  toLocationName: string,
  
  // Items being transferred
  items: [{
    productId: string,
    productName: string,
    quantity: number,
  }],
  
  // Status
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled',
  
  // Metadata
  transferredBy: string,           // User ID
  transferredByName: string,
  notes?: string,
  createdAt: Timestamp,
  completedAt?: Timestamp,
  updatedAt: Timestamp
}
```

## Product Schema Updates

### Location-based Stock Tracking
Update `merchants/{businessId}/products/{productId}` to include location-based stock:

```typescript
{
  // ... existing fields ...
  
  // Location-based stock (new)
  stockByLocation: {
    main_store: number,
    back_store: number,
    warehouse: number,
    // Dynamic branch IDs: {branchId}: number
  },
  
  // Keep legacy field for backward compatibility
  stock: number,                   // Total across all locations
  
  // Supplier info (new)
  preferredSupplierId?: string,    // Primary supplier for this product
  suppliers: [{                    // All suppliers who have provided this product
    supplierId: string,
    supplierName: string,
    lastSupplyDate: Timestamp,
    lastUnitCost: number,
  }],
  
  // Restocking info (new)
  reorderQuantity?: number,        // Suggested reorder quantity
  reorderDays?: number,            // Days of stock to keep on hand
}
```

## Default Locations

Every business gets these default locations on creation:
1. **Main Store** (`main_store`) - Primary sales floor
2. **Back Store** (`back_store`) - Storage area
3. **Warehouse** (`warehouse`) - Main warehouse (if applicable)

Branch locations are created dynamically when branches are added.

## Auto-Generation Logic

### Supplier Creation
When a stock receipt is created:
1. Check if supplier with same name exists
2. If not, create new supplier record
3. Update supplier analytics (total spent, last supply date, products supplied)
4. Update product's supplier list

### Receipt Number Generation
Format: `REC-YYYY-XXXXX` where XXXXX is a sequential number per year.

### Transfer Number Generation
Format: `TRF-YYYY-XXXXX` where XXXXX is a sequential number per year.

## Indexes Required

```json
{
  "indexes": [
    {
      "collectionGroup": "stockReceipts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "supplierId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stockReceipts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "receivedAt", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stockTransfers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fromLocation", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "stockTransfers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toLocation", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "suppliers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "totalAmountSpent", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Security Rules

### Suppliers
- Read: All authenticated users in business
- Write: Only owners and managers
- Auto-create: Allowed on stock receipt creation

### Stock Receipts
- Read: All authenticated users in business
- Write: All authenticated users (staff can receive stock)
- Delete: Only owners

### Stock Locations
- Read: All authenticated users in business
- Write: Only owners
- Default locations: Cannot be deleted

### Stock Transfers
- Read: All authenticated users in business
- Write: All authenticated users
- Complete transfer: Only users with permission at destination

## Migration Path

1. Create new collections
2. Add default locations to existing businesses
3. Update product schema with `stockByLocation` (initialize all stock to `main_store`)
4. Migrate existing transfer logs to new format
5. Update UI components to use new schema
