'use client';

import { getSupabase } from '@/lib/supabase';

/**
 * Restaurant Business Layer Helpers
 */

export type BusinessCategory = 'Restaurant' | 'Retail' | 'Service' | 'Manufacturing' | 'Other';

export type ProductType = 'product' | 'dish' | 'ingredient';

export type DishCategory =
  | 'Rice'
  | 'Soups'
  | 'Swallow'
  | 'Grills'
  | 'Drinks'
  | 'Snacks'
  | 'Breakfast'
  | 'Desserts'
  | 'Other';

export type IngredientUnit = 'Kg' | 'Gram' | 'Liter' | 'Bottle' | 'Pack' | 'Carton' | 'Piece';

export function categoryLooksLikeRestaurant(category: unknown): boolean {
  const c = String(category || '').toLowerCase().trim();
  if (!c) return false;
  return (
    c === 'restaurant' ||
    c === 'resturant' ||
    c === 'cafe' ||
    c === 'café' ||
    c.includes('restaurant') ||
    c.includes('resturant') ||
    c.includes('food service') ||
    c.includes('food &') ||
    c.includes('catering') ||
    c === 'food' ||
    c.includes('eatery') ||
    c.includes('bistro') ||
    c.includes('kitchen')
  );
}

/**
 * Check if a business is a restaurant (Supabase only — real columns only).
 * Also treats catalogs with dish/ingredient products as restaurant.
 */
export async function isRestaurantBusiness(businessId: string): Promise<boolean> {
  if (!businessId) return false;
  try {
    const supabase = getSupabase();

    // Only columns that exist on public.businesses (see migration 0001)
    const { data, error } = await supabase
      .from('businesses')
      .select('category, industry, metadata, name')
      .eq('id', businessId)
      .maybeSingle();

    if (!error && data) {
      const meta =
        data.metadata && typeof data.metadata === 'object'
          ? (data.metadata as Record<string, unknown>)
          : {};

      const candidates = [
        data.category,
        data.industry,
        data.name,
        meta.selectedCategory,
        meta.category,
        meta.categoryLabel,
        meta.businessType,
        meta.businessCategory,
        meta.business_type,
      ];

      if (candidates.some((v) => categoryLooksLikeRestaurant(v))) {
        return true;
      }
    } else if (error) {
      console.warn('[isRestaurantBusiness] businesses select failed', error.message);
    }

    // Fallback: dish/ingredient products imply restaurant workflow
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id, metadata, category')
      .eq('business_id', businessId)
      .limit(40);

    if (pErr) {
      console.warn('[isRestaurantBusiness] products select failed', pErr.message);
      return false;
    }

    for (const row of products || []) {
      const meta =
        row.metadata && typeof row.metadata === 'object'
          ? (row.metadata as Record<string, unknown>)
          : {};
      const pt = String(meta.productType || meta.product_type || '').toLowerCase();
      if (pt === 'ingredient' || pt === 'dish') return true;
      if (categoryLooksLikeRestaurant(row.category) || categoryLooksLikeRestaurant(meta.category)) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking business category:', error);
    return false;
  }
}

/**
 * Canonical category id for nav (restaurant | cafe | retail | …).
 */
export async function resolveBusinessCategoryId(businessId: string): Promise<string> {
  if (!businessId) return 'other';
  try {
    if (await isRestaurantBusiness(businessId)) return 'restaurant';

    const supabase = getSupabase();
    const { data } = await supabase
      .from('businesses')
      .select('category, industry, metadata')
      .eq('id', businessId)
      .maybeSingle();

    const meta =
      data?.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {};
    const raw = String(
      data?.category || data?.industry || meta.selectedCategory || meta.category || 'other'
    ).toLowerCase();

    if (raw.includes('cafe') || raw.includes('café')) return 'cafe';
    if (raw.includes('grocery')) return 'grocery';
    if (raw.includes('pharmacy')) return 'pharmacy';
    if (raw.includes('supermarket')) return 'supermarket';
    if (raw.includes('wholesale')) return 'wholesale';
    if (raw.includes('distribut')) return 'distributor';
    if (raw.includes('manufactur')) return 'manufacturing';
    if (raw.includes('fashion')) return 'fashion';
    if (raw.includes('electronic')) return 'electronics';
    if (raw.includes('service')) return 'services';
    if (raw.includes('health')) return 'healthcare';
    if (raw.includes('educat')) return 'education';
    if (raw.includes('retail')) return 'retail';
    return 'other';
  } catch {
    return 'other';
  }
}

export async function getBusinessCategory(businessId: string): Promise<BusinessCategory> {
  try {
    const id = await resolveBusinessCategoryId(businessId);
    if (id === 'restaurant' || id === 'cafe') return 'Restaurant';
    if (id === 'manufacturing') return 'Manufacturing';
    if (id === 'services') return 'Service';
    if (id === 'retail' || id === 'grocery' || id === 'supermarket') return 'Retail';
    return 'Other';
  } catch (error) {
    console.error('Error getting business category:', error);
    return 'Other';
  }
}

export function isRestaurantProductType(type: ProductType): boolean {
  return type === 'dish' || type === 'ingredient';
}

export function getDishCategories(): DishCategory[] {
  return ['Rice', 'Soups', 'Swallow', 'Grills', 'Drinks', 'Snacks', 'Breakfast', 'Desserts', 'Other'];
}

export function getIngredientUnits(): IngredientUnit[] {
  return ['Kg', 'Gram', 'Liter', 'Bottle', 'Pack', 'Carton', 'Piece'];
}
