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

function categoryLooksLikeRestaurant(category: unknown): boolean {
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
    c === 'food'
  );
}

/**
 * Check if a business is a restaurant based on its category (Supabase).
 */
export async function isRestaurantBusiness(businessId: string): Promise<boolean> {
  if (!businessId) return false;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('businesses')
      .select('category, industry, business_type, type, metadata')
      .eq('id', businessId)
      .maybeSingle();

    if (error || !data) return false;

    const meta =
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {};

    const candidates = [
      data.category,
      data.industry,
      (data as any).business_type,
      (data as any).type,
      meta.selectedCategory,
      meta.category,
      meta.categoryLabel,
      meta.businessType,
    ];

    return candidates.some((v) => categoryLooksLikeRestaurant(v));
  } catch (error) {
    console.error('Error checking business category:', error);
    return false;
  }
}

/**
 * Get business category from Supabase (coarse label).
 */
export async function getBusinessCategory(businessId: string): Promise<BusinessCategory> {
  try {
    if (await isRestaurantBusiness(businessId)) return 'Restaurant';

    const supabase = getSupabase();
    const { data } = await supabase
      .from('businesses')
      .select('category, industry, metadata')
      .eq('id', businessId)
      .maybeSingle();

    const category = String(
      data?.category || data?.industry || (data?.metadata as any)?.category || 'Other'
    );
    const normalized = category.toLowerCase();
    if (normalized.includes('retail')) return 'Retail';
    if (normalized.includes('service')) return 'Service';
    if (normalized.includes('manufactur')) return 'Manufacturing';
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
