# Busmo Data Pipeline Analysis

## Current Data Pipeline Status

### ✅ **CONNECTED TO MO (Working)**

#### 1. **Sales Data** (`RecordSalePage.tsx`)
- **Creates**: 
  - `sales` document
  - `cashFlow` entry (moneyIn = expectedCash)
  - `bankTransactions` (if bank payment)
  - `auditTrail` entry
- **MO Loads**: 
  - Sales data (30 days)
  - Calculates: totalSales, totalProfit, todaySales, todayProfit, pendingCollections
- **Status**: ✅ Fixed (timestamp format + cash flow entry)

#### 2. **Expenses Data** (`Addexpensepage.tsx`)
- **Creates**:
  - `expenses` document
  - `cashFlow` entry (moneyOut = amount)
  - `auditTrail` entry
- **MO Loads**:
  - Expenses data (30 days)
  - Calculates: totalExpenses
- **Status**: ✅ Fixed (cash flow entry added)

#### 3. **Stock Receipts** (`ReceiveStockPage.tsx`)
- **Creates**:
  - `stockReceipts` document
  - `supplierLedger` entry
  - `cashFlow` entry (moneyOut = paid amount)
- **MO Loads**:
  - Stock receipts count
  - Suppliers data
  - Calculates: suppliersCount, totalSpentOnSuppliers
- **Status**: ✅ Fixed (cash flow entry added)

#### 4. **Products/Inventory** (various pages)
- **Creates/Updates**: `products` document
- **MO Loads**:
  - Products data (active only)
  - Calculates: lowStockCount, outOfStockCount, totalInventoryValue
  - Restaurant-specific: dishesCount, ingredientsCount, ingredientsNeedingReorder
  - Product sales data: topSellingProducts (top 10 by units sold, revenue, last sale date)
- **Enhanced**: Now tracks product sales history (lastSaleDate, unitsSold30d, totalSalesCount, lastSalePrice)
- **Status**: ✅ Enhanced with sales tracking

#### 5. **Bank Accounts** (`Cashflowpage.tsx`, `BankAccountsPage.tsx`)
- **Creates**:
  - `bankAccounts` document
  - `bankTransactions` document
- **MO Loads**:
  - Bank accounts count
  - Total bank balance
  - Bank transactions count
- **Status**: ✅ Working

#### 6. **Staff Data** (`StaffPage.tsx`)
- **Creates**:
  - `staff` document
  - `staffActivity` document
- **MO Loads**:
  - Staff count
  - Staff activity data
  - Calculates: staffSalesCount, staffRevenue
- **Status**: ✅ Working

#### 7. **Suppliers** (`SuppliersPage.tsx`)
- **Creates**:
  - `suppliers` document
  - `supplierLedger` document
- **MO Loads**:
  - Suppliers count
  - Total spent on suppliers
- **Status**: ✅ Working

#### 8. **Credit Customers** (various pages)
- **Creates**:
  - `credit_customers` document
  - `credit_transactions` document
- **MO Loads**:
  - Customer credit balance
  - Pending credit payments
- **Status**: ✅ Working

#### 9. **Supplier Credit** (various pages)
- **Creates**: `supplier_credit` document
- **MO Loads**: Supplier credit balance
- **Status**: ✅ Working

#### 10. **Stock Transfers** (`StockTransfersPage.tsx`)
- **Creates**: `stockTransfers` document
- **MO Loads**: Stock transfers count only
- **Status**: ⚠️ Partial (count only, no cash flow impact)

#### 11. **Statement/Financial Reports** (`Statementpage.tsx`)
- **Current**: Generates comprehensive financial statements
- **Data Sources**:
  - Sales data (with COGS calculation)
  - Expenses data
  - Products data (for stock movement)
- **Calculates**:
  - totalRevenue, totalExpenses, netProfit
  - closingStock, openingStock, totalCOGS
  - Stock movement (open, sold, loss, restock, close)
- **MO Status**: ✅ Now loaded (COGS, stock movement, profit calculations)
- **Impact**: MO can now see financial statements, profit/loss analysis, stock movement reports
- **Data Available**: Transaction history, stock summaries, financial metrics
- **Status**: ✅ Fixed - Added to MO businessSummary

---

### ❌ **NOT CONNECTED TO MO (Missing)**

#### 1. **Invoices** (`invoices` collection)
- **Current**: Created for warehouse release sales
- **MO Status**: ❌ Not loaded
- **Impact**: MO can't see invoice status, pending pickups, revenue recognition
- **Data Available**: invoiceNumber, saleId, customerName, status, pickupStatus

#### 2. **Purchase Orders** (`purchaseOrders` collection)
- **Current**: Created for supplier orders
- **MO Status**: ❌ Not loaded
- **Impact**: MO can't see pending orders, supplier commitments, expected costs
- **Data Available**: orderNumber, supplierId, items, totalCost, status, expectedDelivery

#### 3. **Returns & Refunds** (if exists)
- **Current**: Unknown if tracked
- **MO Status**: ❌ Not loaded
- **Impact**: MO can't see return rates, refund costs, customer satisfaction
- **Data Available**: Return reason, refund amount, product impact

#### 4. **Customer Management** (beyond credit)
- **Current**: Basic customer tracking
- **MO Status**: ❌ Not loaded
- **Impact**: MO can't see customer lifetime value, purchase frequency, segmentation
- **Data Available**: Customer profiles, purchase history, contact info

#### 5. **Stock Adjustments** (manual adjustments)
- **Current**: Tracked in products
- **MO Status**: ❌ Not loaded as separate data
- **Impact**: MO can't see shrinkage, waste, theft, manual corrections
- **Data Available**: Adjustment reason, quantity change, timestamp

#### 6. **Stock Transfer Details**
- **Current**: Basic count loaded
- **MO Status**: ⚠️ Limited (count only)
- **Impact**: MO can't see transfer patterns, location efficiency, stock movement
- **Data Available**: Transfer items, from/to locations, quantities, reasons

#### 7. **Bank Transaction Details**
- **Current**: Basic count loaded
- **MO Status**: ⚠️ Limited (count only)
- **Impact**: MO can't see transaction patterns, reconciliation status, fees
- **Data Available**: Transaction details, categories, reconciliation status

#### 8. **Audit Trail**
- **Current**: Created for all actions
- **MO Status**: ❌ Not loaded
- **Impact**: MO can't see who did what, accountability, security events
- **Data Available**: User actions, timestamps, changes made

#### 9. **Business Settings/Profile**
- **Current**: Stored in business document
- **MO Status**: ⚠️ Partial (basic info only)
- **Impact**: MO can't see business hours, tax rates, payment methods, operational settings
- **Data Available**: Business configuration, preferences, integrations

#### 10. **Staff Performance Metrics**
- **Current**: Basic activity tracking
- **MO Status**: ⚠️ Limited (basic counts)
- **Impact**: MO can't see performance trends, efficiency, training needs
- **Data Available**: Sales per staff, accuracy, speed, customer feedback

---

### 📊 **DATA PIPELINE DIAGRAM**

```
User Action → Firestore Collection → Cash Flow Entry → MO Loading → AI Response

SALES:
RecordSale → sales collection → cashFlow (moneyIn) → ✅ MO loads → ✅ AI uses

EXPENSES:
AddExpense → expenses collection → cashFlow (moneyOut) → ✅ MO loads → ✅ AI uses

STOCK RECEIPTS:
ReceiveStock → stockReceipts collection → cashFlow (moneyOut) → ✅ MO loads → ✅ AI uses

STOCK TRANSFERS:
TransferStock → stockTransfers collection → ❌ No cash flow → ⚠️ MO loads count only

INVOICES:
WarehouseSale → invoices collection → ❌ No cash flow → ❌ MO doesn't load

PURCHASE ORDERS:
CreateOrder → purchaseOrders collection → ❌ No cash flow → ❌ MO doesn't load

RETURNS:
ProcessReturn → returns collection → ❌ No cash flow → ❌ MO doesn't load

BANK TRANSACTIONS:
AddMoney → bankTransactions collection → ❌ No cash flow → ⚠️ MO loads count only

AUDIT TRAIL:
Any Action → auditTrail collection → ❌ No cash flow → ❌ MO doesn't load
```

---

### 🔧 **RECOMMENDED FIXES**

#### Priority 1 (High Impact)
1. **Add cash flow entries for stock transfers** (money movement between locations)
2. **Load invoice data in MO** (pending pickups, revenue recognition)
3. **Load purchase order data in MO** (pending costs, supplier commitments)
4. **Load bank transaction details in MO** (transaction patterns, reconciliation)

#### Priority 2 (Medium Impact)
5. **Load customer management data** (LTV, segmentation, insights)
6. **Load stock adjustment data** (shrinkage, waste analysis)
7. **Load stock transfer details** (location efficiency, patterns)
8. **Load audit trail data** (accountability, security)

#### Priority 3 (Low Impact)
9. **Load business settings/profile** (operational context)
10. **Enhance staff performance metrics** (trends, efficiency)

---

### 📈 **DATA QUALITY ISSUES**

1. **Timestamp Format**: Fixed - now using `Timestamp.now()` consistently
2. **Cash Flow Coverage**: Fixed - sales, expenses, stock receipts now create entries
3. **Data Completeness**: Partial - some collections not loaded by MO
4. **Real-time Sync**: Unknown - no real-time listeners for MO data updates
5. **Data Validation**: Unknown - no validation checks mentioned

---

### 🎯 **NEXT STEPS**

1. **Immediate**: Test current fixes with new sales/expenses
2. **Short-term**: Add Priority 1 fixes (invoices, POs, bank transactions)
3. **Medium-term**: Add Priority 2 fixes (customers, adjustments, transfers)
4. **Long-term**: Add Priority 3 fixes (settings, enhanced metrics)
5. **Ongoing**: Monitor data quality and add validation
