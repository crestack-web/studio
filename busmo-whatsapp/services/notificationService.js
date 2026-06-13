const { sendMessage } = require('./whatsappService');

const sendOrderNotification = async (sellerPhone, order) => {
  try {
    const message = `🛍️ *New Order Received!*\n\n📦 Product: ${order.productName}\n🔢 Quantity: ${order.quantity}\n💰 Amount: ₦${order.totalAmount.toLocaleString()}\n👤 Customer: ${order.customerName}\n📍 Delivery: ${order.deliveryAddress || 'Pickup'}\n🕐 Time: ${new Date().toLocaleTimeString()}\n\nReply *CONFIRM ${order.orderId}* to accept\nReply *REJECT ${order.orderId}* to decline`;
    await sendMessage(sellerPhone, message);
  } catch (err) { console.error('❌ sendOrderNotification error:', err.message); }
};

const sendLowStockAlert = async (sellerPhone, product) => {
  try {
    const message = `⚠️ *Low Stock Alert!*\n\n📦 Product: ${product.name}\n🔢 Remaining: ${product.quantity} units left\n${product.quantity === 0 ? '🚨 *OUT OF STOCK!*' : ''}\n\nUpdate your stock now!\nReply *RESTOCK* for help.`;
    await sendMessage(sellerPhone, message);
  } catch (err) { console.error('❌ sendLowStockAlert error:', err.message); }
};

const sendDailySummary = async (sellerPhone, summary) => {
  try {
    const message = `📊 *Busmo Daily Summary*\n📅 ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n✅ Total Orders: ${summary.totalOrders}\n💰 Total Revenue: ₦${summary.totalRevenue.toLocaleString()}\n📦 Products Sold: ${summary.productsSold}\n🏆 Best Seller: ${summary.bestSeller || 'N/A'}\n⚠️ Low Stock Items: ${summary.lowStockCount}\n\n${summary.totalRevenue > 0 ? '🚀 Great work today!' : '💪 Tomorrow is a new opportunity!'}\n\n_Sent by Busmo at 6:00 PM_`;
    await sendMessage(sellerPhone, message);
  } catch (err) { console.error('❌ sendDailySummary error:', err.message); }
};

const sendPaymentConfirmationSeller = async (sellerPhone, payment) => {
  try {
    const message = `💳 *Payment Confirmed!*\n\n✅ Status: SUCCESSFUL\n💰 Amount: ₦${payment.amount.toLocaleString()}\n📦 Order: ${payment.productName}\n👤 From: ${payment.customerName}\n🔖 Ref: ${payment.reference}\n🕐 Time: ${new Date().toLocaleTimeString()}\n\nFunds will be settled shortly. 🎉`;
    await sendMessage(sellerPhone, message);
  } catch (err) { console.error('❌ sendPaymentConfirmationSeller error:', err.message); }
};

const sendPaymentConfirmationBuyer = async (buyerPhone, payment) => {
  try {
    const message = `🎉 *Payment Successful!*\n\n✅ Your payment was received\n💰 Amount: ₦${payment.amount.toLocaleString()}\n📦 Product: ${payment.productName}\n🏪 Seller: ${payment.sellerName}\n🔖 Ref: ${payment.reference}\n🕐 Time: ${new Date().toLocaleTimeString()}\n\nYour order is being processed. 📦`;
    await sendMessage(buyerPhone, message);
  } catch (err) { console.error('❌ sendPaymentConfirmationBuyer error:', err.message); }
};

module.exports = { sendOrderNotification, sendLowStockAlert, sendDailySummary, sendPaymentConfirmationSeller, sendPaymentConfirmationBuyer };
