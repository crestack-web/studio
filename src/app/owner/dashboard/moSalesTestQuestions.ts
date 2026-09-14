/**
 * Category-aware sample questions for MO Sales "Test MO".
 */
export function normalizeBusinessCategory(raw: unknown): string {
  const c = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/[_-]+/g, ' ');
  if (!c) return 'retail';
  if (
    c.includes('restaurant') ||
    c.includes('resturant') ||
    c.includes('cafe') ||
    c.includes('café') ||
    c.includes('catering') ||
    c.includes('eatery') ||
    c.includes('food service') ||
    c === 'food'
  ) {
    return 'restaurant';
  }
  if (c.includes('wholesale') || c.includes('wholesaler')) return 'wholesale';
  if (c.includes('distributor') || c.includes('distribution')) return 'distributor';
  if (c.includes('manufactur') || c.includes('factory') || c.includes('production')) return 'manufacturing';
  if (
    c.includes('service') ||
    c.includes('salon') ||
    c.includes('spa') ||
    c.includes('consult') ||
    c.includes('agency') ||
    c.includes('repair')
  ) {
    return 'service';
  }
  if (c.includes('pharmacy') || c.includes('chemist')) return 'pharmacy';
  if (c.includes('fashion') || c.includes('clothing') || c.includes('apparel') || c.includes('boutique')) {
    return 'fashion';
  }
  if (c.includes('electronics') || c.includes('gadget') || c.includes('phone')) return 'electronics';
  if (c.includes('grocery') || c.includes('supermarket') || c.includes('minimart')) return 'grocery';
  if (c.includes('retail') || c.includes('shop') || c.includes('store')) return 'retail';
  return c.split(/\s+/)[0] || 'retail';
}

const BY_CATEGORY: Record<string, string[]> = {
  restaurant: [
    'Do you have jollof rice available today?',
    'How much is your fried rice?',
    'What drinks do you have?',
    'Can I order for delivery this evening?',
  ],
  retail: [
    'Do you have this item in stock?',
    'How much does it cost?',
    'Do you deliver within the city?',
    'What sizes or variants do you have?',
  ],
  fashion: [
    'Do you have this in size 42?',
    'How much is the black dress?',
    'Do you have other colours?',
    'Can I reserve one for pickup?',
  ],
  electronics: [
    'Do you have the latest phone model in stock?',
    'How much is it, and is it original?',
    'Do you offer warranty?',
    'Can I pay in instalments?',
  ],
  grocery: [
    'Do you have rice in stock?',
    'How much is a carton of noodles?',
    'Do you deliver to my area?',
    'What is the price of cooking oil?',
  ],
  wholesale: [
    'What is your wholesale price for a carton?',
    'What is the minimum order quantity?',
    'Do you deliver to retailers?',
    'Do you offer credit terms for bulk orders?',
  ],
  distributor: [
    'Can you supply this product in bulk?',
    'What is your distributor price list?',
    'How long does delivery take?',
    'Do you cover my state?',
  ],
  manufacturing: [
    'Can you produce a custom order?',
    'What is the lead time for bulk production?',
    'Do you supply to retailers?',
    'What is the minimum order quantity?',
  ],
  service: [
    'How much does your service cost?',
    'Are you available this weekend?',
    'How long does a session take?',
    'Do I need to book in advance?',
  ],
  pharmacy: [
    'Do you have this medicine in stock?',
    'How much does it cost?',
    'Do you need a prescription for this?',
    'Can you deliver to my area?',
  ],
};

const FALLBACK = BY_CATEGORY.retail;

export function testQuestionsForCategory(category: unknown): string[] {
  const key = normalizeBusinessCategory(category);
  return BY_CATEGORY[key] || FALLBACK;
}

export function defaultTestQuestionForCategory(category: unknown): string {
  return testQuestionsForCategory(category)[0];
}
