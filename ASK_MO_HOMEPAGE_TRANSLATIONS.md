# ✅ Ask MO - Homepage Integration with Translations

**Date:** March 4, 2026  
**Status:** ✅ **REAL API CALLS + MULTI-LANGUAGE**

---

## 🎯 What Changed

### **Before:**
- ❌ Used hardcoded mock data from `MO_ASK_CHIPS`
- ❌ Only English suggestions
- ❌ Clicking chips showed static responses

### **After:**
- ✅ Uses translation keys for all languages
- ✅ Makes real API calls to Ask MO endpoint
- ✅ Shows real AI responses from Qwen
- ✅ Supports 10 languages

---

## 🌍 Translated Suggestions

### **English (en):**
```
• How is my business doing?
• What's my cash balance?
• What should I restock?
• Am I spending too much?
• Sold 2 bags of rice for 5000 cash
• Add rice at 25000 with 50 stock
```

### **Français (fr):**
```
• Comment va mon entreprise ?
• Quel est mon solde de trésorerie ?
• Que dois-je réapprovisionner ?
• Est-ce que je dépense trop ?
• Vendu 2 sacs de riz pour 5000 espèces
• Ajouter riz à 25000 avec 50 stock
```

### **Hausa (ha):**
```
• Ta yaya kasuwata take?
• Menene ma'aunin kuɗina?
• Menene zan sake cika?
• Shin ina kashewa da yawa?
• Na sayar da jakunkunan shinkafa 2 da 5000
• Ƙara shinkafa a 25000 da 50 stock
```

### **Swahili (sw):**
```
• Biashara yangu ikoje?
• Salio langu la pesa ni kiasi gani?
• Nifanye hisa upya ya nini?
• Je, ninatumia pesa nyingi?
• Nimeuza mifuko 2 ya mchele kwa 5000
• Ongeza mchele kwa 25000 na stock 50
```

### **Yoruba (yo):**
```
• Bawo ni iṣowo mi?
• Kini iwontunwonsi owo mi?
• Kini MO yẹ ki o tun ṣokòòwò?
• Ṣe Mo nà owó púpọ̀?
• Mo ta àwọn àpò 2 iyẹ̀wù fún 5000
• Fi iyẹ̀wù kún ní 25000 pẹ̀lú 50 stock
```

### **Igbo (ig):**
```
• Ka azụmahịa m dị?
• Gịnị bụ nguzozi ego m?
• Gịnị ka m kwesịrị iji mezigharịa?
• Ọ̀ bụ na m na-emefu ego karịrị akarị?
• M rere akpa 2 osikapa maka 5000
• Tinye osikapa na 25000 na 50 stock
```

---

## 🔧 How It Works

### **1. User Clicks Suggestion:**
```
User clicks: "How is my business doing?"
```

### **2. Real API Call Made:**
```javascript
fetch('/api/ask-mo', {
  method: 'POST',
  body: JSON.stringify({
    message: "How is my business doing?",
    merchantId: 'demo'
  })
})
```

### **3. Qwen AI Processes:**
- Fetches business data from Firestore
- Analyzes sales, profit, cash, inventory
- Generates contextual response

### **4. Real Response Shown:**
```
📊 Business Summary:

💰 Sales: ₦125,000
📈 Profit: ₦36,250 (29%)
💵 Cash: ₦96,600 (102 days)

✅ You're doing excellently!
```

---

## 📊 Translation Keys Added

```typescript
// New translation keys
'mo.suggest.howBusiness': 'How is my business doing?'
'mo.suggest.cashBalance': 'What's my cash balance?'
'mo.suggest.restock': 'What should I restock?'
'mo.suggest.expenses': 'Am I spending too much?'
'mo.suggest.recordSale': 'Sold 2 bags of rice for 5000 cash'
'mo.suggest.addProduct': 'Add rice at 25000 with 50 stock'
```

---

## 🧪 Test It

### **Steps:**

1. **Go to Owner Dashboard:**
   ```
   http://localhost:3000/owner
   ```

2. **Change Language:**
   - Go to Settings
   - Select language (French, Hausa, Swahili, Yoruba, Igbo)

3. **Check Ask MO Card:**
   - Suggestions should be in selected language
   - Click any suggestion

4. **Verify Real Response:**
   - Should show real business data
   - Not static mock response

---

## 📋 Files Changed

| File | Changes |
|------|---------|
| `translations.ts` | ✅ Added 6 new translation keys<br>✅ Translated to all 10 languages |
| `HomePage.tsx` | ✅ Uses translation keys<br>✅ Makes real API calls<br>✅ Shows real responses |

---

## ✅ Summary

**Ask MO Homepage now:**

- ✅ Uses real translations (not hardcoded English)
- ✅ Makes real API calls to Qwen
- ✅ Shows real business data in responses
- ✅ Supports all 10 languages
- ✅ Includes sale recording & product adding suggestions

**Test now:** http://localhost:3000/owner

**Change language and click Ask MO suggestions!** 🌍🤖✨
