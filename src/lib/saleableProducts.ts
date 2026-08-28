/**
 * Helpers for record-sale product lists.
 * Ingredients must never appear as saleable items for food-service businesses.
 */

const FOOD_SERVICE_KEYWORDS = [
  'restaurant',
  'cafe',
  'café',
  'coffee',
  'bakery',
  'catering',
  'food',
  'bar',
  'lounge',
  'hotel',
  'fast food',
  'fastfood',
  'kitchen',
  'bistro',
  'diner',
  'canteen',
  'eatery',
];

export function isFoodServiceBusiness(category?: string | null): boolean {
  const c = String(category || '').toLowerCase();
  if (!c) return false;
  return FOOD_SERVICE_KEYWORDS.some((k) => c.includes(k));
}

/** Detect ingredient rows from products table / metadata. */
export function isIngredientProduct(data: Record<string, any> | null | undefined): boolean {
  if (!data) return false;
  const meta =
    data.metadata && typeof data.metadata === 'object' ? (data.metadata as any) : {};
  const candidates = [
    data.productType,
    data.product_type,
    data.type,
    data.itemType,
    data.item_type,
    meta.productType,
    meta.product_type,
    meta.type,
    meta.itemType,
  ]
    .filter((v) => v != null && v !== '')
    .map((v) => String(v).toLowerCase().trim());

  if (candidates.some((c) => c === 'ingredient' || c.includes('ingredient'))) {
    return true;
  }

  // Explicit ingredient unit fields used by add-product flow
  if (data.ingredientUnit || data.ingredient_unit || meta.ingredientUnit || meta.ingredient_unit) {
    return true;
  }

  // Emoji convention for ingredients in add product
  const emoji = String(data.emoji || meta.emoji || data.attributes?.emoji || '');
  if (emoji === '🥘' && Number(data.price || data.sellPrice || 0) === 0) {
    // weak signal — only treat as ingredient if also not a dish
    const typeHint = candidates.join(' ');
    if (!typeHint.includes('dish') && !typeHint.includes('product')) {
      return true;
    }
  }

  return false;
}

/** Filter a product list for the record-sale UI. */
export function filterSaleableProducts<T extends Record<string, any>>(
  products: T[],
  businessCategory?: string | null
): T[] {
  const food = isFoodServiceBusiness(businessCategory);
  return products.filter((p) => {
    if (isIngredientProduct(p)) {
      // Always hide ingredients from sale screens for food businesses
      if (food) return false;
      // Also hide if productType is explicitly ingredient even outside food
      return false;
    }
    return true;
  });
}
