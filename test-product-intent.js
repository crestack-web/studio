// Test product intent detection patterns
const testMessages = [
  "Add rice at 25000",
  "Add Sabuni at 850 with 50 stock",
  "New product: Bottled Water 500ml",
  "I want to add Face Powder at 1200",
  "Stock Cooking Oil at 1500 with 30 units",
];

function detectProductIntent(message) {
  const lower = message.toLowerCase();
  
  const productPatterns = [
    /add\s+(?:product\s+)?(?:named\s+)?(.+?)\s+(?:at\s+|for\s+|₦|naira|ngn)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /new\s+product:\s*(.+)/i,
    /create\s+product\s+(.+)/i,
    /i\s+want\s+to\s+add\s+(.+)/i,
    /add\s+to\s+inventory:\s*(.+)/i,
    /stock\s+(.+)/i,
    /add\s+(.+?)\s+to\s+inventory/i,
    /new\s+item\s+(.+)/i,
    /add\s+(.+)/i,
  ];
  
  for (const pattern of productPatterns) {
    const match = message.match(pattern);
    if (match) {
      console.log(`✅ Pattern matched for: "${message}"`);
      console.log(`   Match:`, match);
      return { isProductIntent: true, match };
    }
  }
  
  console.log(`❌ No pattern matched for: "${message}"`);
  return { isProductIntent: false };
}

console.log('Testing product intent detection...\n');
testMessages.forEach(msg => detectProductIntent(msg));
