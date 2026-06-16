const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();

async function addProduct(productData, userPhone) {
  try {
    const docRef = await db.collection('products').add({
      name: productData.name,
      price: productData.price,
      imageUrl: productData.imageUrl,
      imageSource: productData.imageSource,
      sellerPhone: userPhone,
      addedVia: 'whatsapp',
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Product added:', docRef.id);
    return docRef.id;
  } catch (err) {
    throw new Error("Sorry, couldn't save that right now. Please try again in a moment. 🙏");
  }
}

async function recordSale(saleData, userPhone) {
  try {
    await db.collection('sales').add({
      productName: saleData.name,
      quantity: saleData.quantity || 1,
      totalAmount: saleData.price,
      sellerPhone: userPhone,
      recordedVia: 'whatsapp',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return `✅ Sale Recorded!\n\n📦 Product: ${saleData.name}\n🔢 Quantity: ${saleData.quantity || 1}\n💰 Amount: ₦${saleData.price}\n\nKeep it up! 💪`;
  } catch (err) {
    throw new Error("Sorry, couldn't save that right now. Please try again in a moment. 🙏");
  }
}

async function getReport(period, userPhone) {
  try {
    let startDate = new Date();
    if (period === 'this_week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'this_month') startDate.setDate(startDate.getDate() - 30);
    else startDate.setDate(startDate.getDate() - 1);
    const q = db.collection('sales')
      .where('sellerPhone', '==', userPhone)
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(startDate));
    const snap = await q.get();
    if (snap.empty) return `📊 No sales recorded for ${period || 'today'} yet. Start selling! 💪`;
    let count = 0, total = 0, productCount = {};
    snap.forEach(doc => {
      const d = doc.data();
      count++;
      total += d.totalAmount || 0;
      productCount[d.productName] = (productCount[d.productName] || 0) + 1;
    });
    const bestProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    return `📊 *Busmo Sales Report*\n📅 Period: ${period || 'today'}\n\n✅ Total Sales: ${count}\n💰 Total Revenue: ₦${total}\n🏆 Top Product: ${bestProduct}\n\nKeep selling! 🚀`;
  } catch (err) {
    return "Sorry, couldn't fetch your report. Please try again later. 🙏";
  }
}


async function getUserByPhone(phone) {
  const snap = await db.collection('users').where('phoneNumber', '==', phone).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

async function updateOrderStatus(orderId, status) {
  await db.collection('orders').doc(orderId).set({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
}

// Conversation memory functions for WhatsApp MO
async function getConversationHistory(userPhone, limit = 10) {
  try {
    const snap = await db.collection('whatsapp_conversations')
      .where('userPhone', '==', userPhone)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    const messages = [];
    snap.forEach(doc => {
      const data = doc.data();
      messages.push({
        role: data.role,
        content: data.content,
        timestamp: data.createdAt?.toDate()
      });
    });
    
    // Return in chronological order (oldest first)
    return messages.reverse();
  } catch (err) {
    console.error('Error fetching conversation history:', err);
    return [];
  }
}

async function saveConversationMessage(userPhone, role, content) {
  try {
    await db.collection('whatsapp_conversations').add({
      userPhone,
      role,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error('Error saving conversation message:', err);
  }
}

async function clearOldConversationHistory(userPhone, daysToKeep = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const snap = await db.collection('whatsapp_conversations')
      .where('userPhone', '==', userPhone)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();
    
    const batch = db.batch();
    snap.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (snap.size > 0) {
      await batch.commit();
      console.log(`Cleared ${snap.size} old messages for ${userPhone}`);
    }
  } catch (err) {
    console.error('Error clearing old conversation history:', err);
  }
}

async function getConversationSummary(userPhone) {
  try {
    const recentMessages = await getConversationHistory(userPhone, 20);
    if (recentMessages.length === 0) return null;
    
    // Simple summary based on recent messages
    const userMessages = recentMessages.filter(m => m.role === 'user');
    const botMessages = recentMessages.filter(m => m.role === 'bot');
    
    return {
      totalMessages: recentMessages.length,
      userMessages: userMessages.length,
      botMessages: botMessages.length,
      lastInteraction: recentMessages[recentMessages.length - 1]?.timestamp,
      recentTopics: extractTopics(userMessages.slice(-5))
    };
  } catch (err) {
    console.error('Error getting conversation summary:', err);
    return null;
  }
}

function extractTopics(messages) {
  const topics = [];
  const keywords = {
    'sales': ['sold', 'sale', 'buy', 'purchase', 'revenue'],
    'products': ['product', 'item', 'inventory', 'stock', 'add'],
    'reports': ['report', 'summary', 'analytics', 'performance'],
    'expenses': ['expense', 'cost', 'spending', 'budget']
  };
  
  messages.forEach(msg => {
    const content = msg.content.toLowerCase();
    Object.entries(keywords).forEach(([topic, words]) => {
      if (words.some(word => content.includes(word)) && !topics.includes(topic)) {
        topics.push(topic);
      }
    });
  });
  
  return topics;
}

module.exports = { 
  addProduct, 
  recordSale, 
  getReport, 
  getUserByPhone, 
  updateOrderStatus,
  getConversationHistory,
  saveConversationMessage,
  clearOldConversationHistory,
  getConversationSummary
};
