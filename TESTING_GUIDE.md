# 🧪 Testing Guide - MO AI Features

**Servers Running:**
- ✅ Main App: http://localhost:3000
- ✅ WhatsApp Bot: http://localhost:3000 (port 3000)

---

## 🎯 What to Test

### **1. Ask MO Page (Frontend)** 🖼️

**URL:** http://localhost:3000/owner/dashboard/ask-mo

**Test Steps:**

1. **Navigate to Ask MO:**
   - Go to owner dashboard
   - Click "Ask MO" in sidebar
   - Should see MO chat interface

2. **Test Text Questions:**
   ```
   Try asking:
   - "How is my business doing?"
   - "What should I restock?"
   - "Am I spending too much?"
   - "Can I afford to grow?"
   ```
   **Expected:** MO responds with business insights

3. **Test Image Upload:**
   - Click image upload button (📎)
   - Select a product image
   - Ask: "What products do you see?"
   - Send
   **Expected:** MO analyses image and responds

4. **Test Suggestion Chips:**
   - Click any suggestion chip
   **Expected:** Question auto-fills and sends

---

### **2. WhatsApp Bot** 📱

**Note:** Requires WhatsApp Business API setup

**Test Commands:**

1. **Greeting:**
   ```
   Send: "hi" or "hello"
   Expected: Welcome message with menu
   ```

2. **Add Product via Image:**
   ```
   Send: [Product photo] with caption "5000 naira"
   Expected: 
   ✅ Here's your product summary:
   📦 Product: [AI-extracted name]
   💰 Price: ₦5,000
   
   Reply YES to add
   ```

3. **Record Sale via Text:**
   ```
   Send: "Sold 2 bags of rice for 15000"
   Expected:
   🎉 Amazing! Sale recorded!
   2 bags of rice for ₦15,000
   ```

4. **Get Report:**
   ```
   Send: "Show me today's sales"
   Expected:
   📊 Busmo Sales Report
   ✅ Total Sales: [count]
   💰 Total Revenue: [amount]
   ```

---

## ✅ Expected Behaviors

### **Ask MO Page:**

| Action | Expected Result |
|--------|----------------|
| Open page | MO greeting appears |
| Type question | MO responds in < 5 seconds |
| Upload image | Preview shows, MO analyses it |
| Click suggestion | Question auto-sends |
| Ask about profit | Shows ₦13,050 (29% margin) |
| Ask about cash | Shows ₦150K (45 days) |

### **WhatsApp Bot:**

| Message Type | Expected Response |
|--------------|-------------------|
| "hi", "hello" | Welcome menu |
| Product image | Analysis + confirmation |
| "Sold X for Y" | Sale recorded + motivational message |
| "Show report" | Sales statistics |
| "YES" (after product) | Product saved + celebration |

---

## 🐛 Common Issues & Fixes

### **Issue 1: Ask MO returns error**

**Symptom:** "Failed to get AI response"

**Fix:**
```bash
# Check if DASHSCOPE_API_KEY is set
# In .env.local:
DASHSCOPE_API_KEY=sk-27af2a883f5c4aca8f08ff33a4418d1d

# Restart server
npm run dev
```

### **Issue 2: Image upload doesn't work**

**Symptom:** Image preview doesn't show

**Fix:**
- Check browser console for errors
- Ensure file is image (jpg, png, webp)
- Try different image file

### **Issue 3: WhatsApp bot not responding**

**Symptom:** No response from bot

**Fix:**
```bash
# Check bot is running
cd busmo-whatsapp
node index.js

# Should see:
# 🚀 Busmo WhatsApp Bot running on port 3000
```

---

## 📋 Testing Checklist

### **Frontend (Ask MO):**
- [ ] Page loads successfully
- [ ] MO greeting displays
- [ ] Can type and send messages
- [ ] MO responds to questions
- [ ] Image upload button works
- [ ] Image preview shows
- [ ] MO analyses uploaded images
- [ ] Suggestion chips work
- [ ] Typing indicator shows
- [ ] Multi-currency formatting works

### **WhatsApp Bot:**
- [ ] Bot responds to "hi"
- [ ] Bot analyses product images
- [ ] Bot extracts price from captions
- [ ] Bot records sales from text
- [ ] Bot generates motivational confirmations
- [ ] Bot provides reports
- [ ] YES/NO confirmation works
- [ ] Pidgin English understood

---

## 🎯 Success Criteria

**Ask MO is working if:**
✅ Can upload image + ask question  
✅ MO responds with relevant insights  
✅ Responses include business context  
✅ Currency formatting is correct  

**WhatsApp Bot is working if:**
✅ Responds to greetings  
✅ Analyses product images  
✅ Records sales from natural language  
✅ Generates AI confirmations  

---

## 📞 Quick Commands

### **Check Servers:**
```bash
# Check main app
netstat -ano | findstr :3000

# Check WhatsApp bot
ps aux | grep "node index.js"
```

### **Restart Servers:**
```bash
# Stop all (Ctrl+C in each terminal)

# Start main app
npm run dev

# Start WhatsApp bot (new terminal)
cd busmo-whatsapp && node index.js
```

---

## 🎉 Ready to Test!

**URLs:**
- Main App: http://localhost:3000
- Owner Dashboard: http://localhost:3000/owner
- Ask MO: http://localhost:3000/owner/dashboard/ask-mo

**Test the changes and let me know what works!** 🧪
