// Test sale intent detection patterns
const testMessages = [
  "Sold 2 bags of rice for 5000",
  "sold 5000 of rice",
  "record sale of 5000 rice",
  "I sold rice",
  "made a sale of rice",
  "customer bought 2 rice",
];

function detectSaleIntent(message) {
  const lower = message.toLowerCase();
  
  const salePatterns = [
    /sold\s+(\d+)\s+(.+?)\s+for\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /sold\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+of\s+(.+)/i,
    /record\s+sale\s+of\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(.+)/i,
    /sale:\s*(.+)/i,
    /i\s+sold\s+(.+)/i,
    /made\s+a\s+sale\s+(.+)/i,
    /just\s+sold\s+(\d+)\s+(.+)/i,
    /sold\s+(.+?)\s+(\d+)\s*(?:units?|pcs?|pieces?)/i,
    /(\d+)\s+(.+?)\s+sold/i,
    /sold\s+(.+?)\s+for\s+(?:₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /customer\s+bought\s+(\d+)\s+(.+)/i,
    /sold\s+(\d+)x\s+(.+)/i,
  ];
  
  for (const pattern of salePatterns) {
    const match = message.match(pattern);
    if (match) {
      console.log(`✅ Pattern matched for: "${message}"`);
      console.log(`   Match:`, match);
      return { isSaleIntent: true, match };
    }
  }
  
  console.log(`❌ No pattern matched for: "${message}"`);
  return { isSaleIntent: false };
}

console.log('Testing sale intent detection...\n');
testMessages.forEach(msg => detectSaleIntent(msg));
