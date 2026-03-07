# ✅ Ask MO - Comprehensive Business Context Integration

**Date:** March 4, 2026  
**Status:** ✅ **FULLY INTEGRATED WITH FIRESTORE**

---

## 🎯 What Changed

### **Before:**
```javascript
// Limited context
context: {
  totalSales: 45000,
  totalProfit: 13050,
  cashBalance: 150000,
  expenses: 28400,
}
```

### **After:**
```javascript
// COMPREHENSIVE business context from Firestore
{
  // Sales Performance
  totalSales: 0,
  todaySales: 0,
  weekSales: 0,
  monthSales: 0,
  totalProfit: 0,
  todayProfit: 0,
  transactionCount: 0,
  averageTransactionValue: 0,
  profitMargin: 0,
  
  // Cash Flow
  cashBalance: 0,
  dailyBurnRate: 0,
  cashRunway: 0,
  totalExpenses: 0,
  topExpenseCategory: '',
  
  // Inventory
  totalProducts: 0,
  totalInventoryValue: 0,
  lowStockProducts: [],      // Products below threshold
  outOfStockProducts: [],    // Products at 0 stock
  topProducts: [],           // Top 5 by revenue
  
  // Recent Activity
  recentSales: []            // Last 5 sales
}
```

---

## 🔧 How It Works

### **1. User Asks Question:**
```
User: "How is my business doing?"
```

### **2. API Fetches Real Data:**
```javascript
// Fetches from Firestore:
- merchants/{id}/record_sale (last 30 days)
- merchants/{id}/expense (last 30 days)
- merchants/{id}/products (active products)
```

### **3. Builds Master Prompt:**
```
═══════════════════════════════════════════
📊 COMPREHENSIVE BUSINESS CONTEXT
═══════════════════════════════════════════

💰 SALES PERFORMANCE:
• Total Sales (30 days): ₦125,000
• Today's Sales: ₦8,500
• Total Profit: ₦36,250
• Profit Margin: 29%
• Transactions: 45
• Avg Transaction: ₦2,778

💵 CASH FLOW:
• Cash Balance: ₦96,600
• Daily Burn Rate: ₦943
• Cash Runway: 102 days
• Total Expenses: ₦28,400

📦 INVENTORY STATUS:
• Total Products: 23
• Total Inventory Value: ₦245,000
• ⚠️ OUT OF STOCK: 2 products
   - Bottled Water
   - Face Powder
• 🔴 LOW STOCK: 3 products
   - Sabuni: 4 left (threshold: 10)
   - Rice: 8 left (threshold: 15)
   - Oil: 12 left (threshold: 20)

🏆 TOP PRODUCTS:
1. Sabuni Premium Bar: ₦52,000 (40 units)
2. School Bag: ₦20,000 (2 units)
3. Polo Co-Ord: ₦18,000 (3 units)

📈 RECENT SALES:
• Sabuni Bar - ₦2,000 (Feb 17)
• School Bag - ₦10,000 (Feb 16)
• Polo Co-Ord - ₦26,000 (Feb 15)
═══════════════════════════════════════════
```

### **4. Qwen Generates Insightful Response:**
```
📊 Your business is performing well!

💰 Sales are strong at ₦125K this month with a healthy 29% 
margin. Today alone you made ₦8,500.

⚠️ URGENT: Bottled Water and Face Powder are OUT OF STOCK! 
Restock immediately to avoid lost sales.

💵 Cash position is excellent with 102 days runway.

🎯 Action: Restock Bottled Water and Sabuni today — they're 
your top sellers and running low.
```

---

## 📋 Data Sources

### **Sales Data** (`record_sale` collection)
```javascript
query: merchants/{merchantId}/record_sale
where: createdAt >= 30 days ago
orderBy: createdAt DESC
limit: 100

Calculates:
- Total sales, profit, transactions
- Today's sales
- Average transaction value
- Profit margin
- Top products by revenue
- Recent sales
```

### **Expenses Data** (`expense` collection)
```javascript
query: merchants/{merchantId}/expense
where: createdAt >= 30 days ago
orderBy: createdAt DESC
limit: 100

Calculates:
- Total expenses
- Daily burn rate
- Cash balance
- Cash runway
- Top expense category
```

### **Inventory Data** (`products` collection)
```javascript
query: merchants/{merchantId}/products
where: active == true
limit: 200

Calculates:
- Total products
- Total inventory value
- Low stock products (stock <= threshold)
- Out of stock products (stock == 0)
```

---

## 🧪 Test It

### **1. Ask MO Questions:**

**URL:** http://localhost:3000/owner/dashboard/ask-mo

**Try These:**

1. **"How is my business doing?"**
   - Gets full business summary
   - Includes sales, profit, cash, inventory

2. **"What should I restock?"**
   - Shows low stock products
   - Shows out of stock products
   - Prioritizes by urgency

3. **"Am I spending too much?"**
   - Shows expenses vs revenue
   - Compares to 20% threshold
   - Shows top expense category

4. **"What's my cash situation?"**
   - Shows cash balance
   - Shows daily burn rate
   - Shows cash runway in days

5. **"Which products are selling best?"**
   - Shows top 5 products by revenue
   - Shows quantity sold
   - Shows revenue per product

---

## 📊 Example Conversations

### **Example 1: Business Health**

**User:** "How is my business doing?"

**MO (with comprehensive context):**
```
📊 Business Summary:

💰 Sales: ₦125,000 (30 days)
📈 Profit: ₦36,250 (29% margin)
💵 Cash: ₦96,600 (102 days runway)

✅ Strong performance! Your 29% margin is above the 
25% target.

⚠️ Alert: 2 products out of stock, 3 products low.

🎯 Focus: Restock Bottled Water and Sabuni — they're 
your top sellers.
```

### **Example 2: Inventory Question**

**User:** "What should I restock?"

**MO:**
```
🔴 URGENT: Restock these ASAP:

• Bottled Water: 0 left (OUT OF STOCK)
• Face Powder: 0 left (OUT OF STOCK)
• Sabuni: 4 left (threshold: 10)
• Rice: 8 left (threshold: 15)

These 4 products could cost you sales. Bottled Water 
and Sabuni are your top sellers — restock TODAY!
```

### **Example 3: Cash Flow**

**User:** "Do I have enough cash?"

**MO:**
```
💵 Cash Position:

• Balance: ₦96,600
• Daily Burn: ₦943
• Runway: 102 days ✅

You're in a STRONG position with over 3 months runway.

🎯 You can safely invest ₦30K in:
1. Restocking low products
2. Marketing campaigns
3. New product lines
```

---

## 🔧 Configuration

### **API Route:** `src/app/api/ask-mo/route.ts`

**Key Functions:**
1. `getBusinessContext(merchantId)` - Fetches all data from Firestore
2. `POST handler` - Builds master prompt with all context
3. `getMockResponse()` - Fallback with business context

### **Frontend:** `AskMOPage.tsx`

**Sends:**
```javascript
{
  message: "How is my business?",
  merchantId: "demo" // Replace with actual merchant ID
}
```

---

## 🐛 Troubleshooting

### **Issue: Getting generic responses**

**Symptom:**
```
MO responds with generic advice, not using business data
```

**Check:**
```bash
# Verify merchantId is sent
console.log('Merchant ID:', merchantId);

# Check Firestore data exists
merchants/demo/record_sale
merchants/demo/expense
merchants/demo/products
```

### **Issue: Slow response**

**Symptom:**
```
MO takes > 10 seconds to respond
```

**Cause:** Fetching large datasets from Firestore

**Fix:**
```javascript
// In route.ts, reduce limits
limit(50)  // Instead of 100 for sales
limit(100) // Instead of 200 for products
```

---

## ✅ Summary

**Ask MO now has COMPLETE business visibility:**

- ✅ Sales data (30 days, today, profit, margin)
- ✅ Cash flow (balance, burn rate, runway)
- ✅ Expenses (total, categories)
- ✅ Inventory (products, low stock, out of stock)
- ✅ Top products (by revenue)
- ✅ Recent sales (last 5)

**MO can now answer questions like:**
- "How's my business?" ✅
- "What should I restock?" ✅
- "Am I spending too much?" ✅
- "Do I have enough cash?" ✅
- "Which products sell best?" ✅

**Test now:** http://localhost:3000/owner/dashboard/ask-mo

**MO knows EVERYTHING about the business!** 🤖📊✨
