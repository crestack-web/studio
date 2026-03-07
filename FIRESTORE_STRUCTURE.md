# Firestore Structure Analysis & Migration Plan

## Current Firestore Structure (Existing)
```
merchants/{merchantId}/
  ├── sales/{saleId}
  │     ├── products: [{productId, name, quantity, price}]
  │     ├── total: number
  │     ├── paymentMethod: string
  │     ├── customerName?: string
  │     ├── notes?: string
  │     ├── createdAt: Timestamp
  │     ├── updatedAt: Timestamp
  │     └── status: 'completed' | 'pending' | 'cancelled'
  │
  └── products/{productId}
        ├── name: string
        ├── description?: string
        ├── category?: string
        ├── price: number
        ├── cost?: number
        ├── stock: number
        ├── lowStockThreshold: number (default: 10)
        ├── imageUrl?: string
        ├── attributes?: Record<string, string>
        ├── createdAt: Timestamp
        ├── updatedAt: Timestamp
        └── active: boolean
```

## New UI Expected Structure
```
businesses/{businessId}/
  ├── sales/{saleId}
  │     ├── products: [{productId, name, price, quantity}]
  │     ├── total: number
  │     ├── profit: number
  │     ├── paymentMethod: 'cash' | 'transfer' | 'card'
  │     ├── note?: string
  │     ├── soldBy: string (staff userId)
  │     ├── soldByName: string
  │     ├── businessId: string
  │     └── createdAt: Timestamp
  │
  └── products/{productId}
        ├── name: string
        ├── sku: string
        ├── category: string
        ├── sellingPrice: number
        ├── costPrice: number
        ├── stock: number
        ├── lowStockThreshold: number
        ├── emoji?: string
        ├── active: boolean
        ├── createdAt: string (ISO)
        └── updatedAt: string (ISO)
```

## Users Collection (Existing)
```
users/{userId}/
  ├── role: 'Owner' | 'Staff'
  ├── businessId: string (references merchants/{id})
  ├── displayName: string
  ├── email: string
  ├── plan: 'Free' | 'Shop' | 'Supermarket' | 'Multibranch' | 'Company'
  ├── avatarContent?: string
  ├── avatarBg?: string
  ├── avatarColor?: string
  └── staffPermissions?: {
        sale: boolean,
        inv: boolean,
        hist: boolean,
        atd: boolean,
        msg: boolean,
        earn: boolean
      }
```

## Required Changes

### 1. Update Data Service to Use `merchants` Instead of `businesses`
**File**: `src/app/staff/home/services/dataService.ts`
- Change `businesses/{businessId}` → `merchants/{businessId}`
- Update field names to match existing structure

### 2. Update AddProductPage
**File**: `src/app/owner/dashboard/Addproductpage.tsx`
- Change collection path to `merchants/{businessId}/products`
- Map UI field names to existing field names:
  - `sellingPrice` → `price`
  - `costPrice` → `cost`
  - Remove `sku` (not in existing schema) or add to `attributes`

### 3. Update HomePage Data Fetching
**File**: `src/app/owner/dashboard/HomePage.tsx`
- Change `businesses/{businessId}/sales` → `merchants/{businessId}/sales`
- Update field mappings

### 4. Update InventoryPage
**File**: `src/app/owner/dashboard/InventoryPage.tsx`
- Already uses API which calls Cloud Functions
- Cloud Functions already use correct `merchants` collection

### 5. Update Staff SalePage
**File**: `src/app/staff/home/SalePage.tsx`
- Change `businesses/{businessId}` → `merchants/{businessId}`
- Update sale data structure to match existing schema

### 6. Update Staff OtherPages (History, Inventory)
**File**: `src/app/staff/home/pages/OtherPages.tsx`
- Change collection paths to use `merchants`

## Field Mapping Reference

### Product Fields
| UI Field | Existing Field | Action |
|----------|---------------|--------|
| sellingPrice | price | Rename |
| costPrice | cost | Rename |
| sku | attributes.sku | Move to attributes |
| emoji | attributes.emoji | Move to attributes |
| lowStockThreshold | lowStockThreshold | Keep |
| stock | stock | Keep |
| active | active | Keep |

### Sale Fields
| UI Field | Existing Field | Action |
|----------|---------------|--------|
| total | total | Keep |
| profit | (calculate) | Add calculation |
| paymentMethod | paymentMethod | Keep |
| note | notes | Rename |
| soldBy | customerName | Repurpose or add new field |
| soldByName | (new) | Add new field |
| products | products | Keep (same structure) |

## Migration Steps

1. ✅ Update dataService.ts to use `merchants` collection
2. ✅ Update AddProductPage field mapping
3. ✅ Update HomePage collection path
4. ✅ Update Staff SalePage collection path
5. ✅ Update OtherPages (History, Inventory)
6. ✅ Test all flows with existing Firestore data
7. ✅ Deploy and verify

## New Features to Add

### 1. Staff Tracking in Sales
Add these fields to `merchants/{id}/sales`:
- `soldBy: string` (userId of staff who made sale)
- `soldByName: string` (name of staff)
- `profit: number` (calculated from product costs)

### 2. Enhanced Product Fields
Add to `merchants/{id}/products`:
- `attributes.emoji: string` (for product emoji icon)
- `attributes.sku: string` (SKU/product code)
- Keep existing structure intact

### 3. Business Collection (Optional Enhancement)
Create `businesses` collection that mirrors `merchants` for better organization:
```
businesses/{businessId}/
  ├── ownerId: string (references users/{id})
  ├── businessName: string
  ├── merchantId: string (links to merchants/{id})
  └── settings: {...}
```

This allows:
- Better separation of business metadata
- Easier migration path
- Backward compatibility with existing data

## Implementation Priority

### HIGH PRIORITY (Core Functionality)
1. ✅ Fix collection paths (businesses → merchants)
2. ✅ Fix field mappings (sellingPrice → price, etc.)
3. ✅ Ensure authentication works
4. ✅ Test sale recording flow
5. ✅ Test product management flow

### MEDIUM PRIORITY (Enhanced Features)
6. Add staff tracking to sales
7. Add profit calculation
8. Add emoji/SKU to product attributes
9. Improve loading states

### LOW PRIORITY (Nice to Have)
10. Create businesses collection for better organization
11. Add data migration script
12. Add admin panel for data management
