'use client';

import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * Restaurant Business Layer Helpers
 * Provides utilities for detecting restaurant businesses and handling restaurant-specific logic
 */

export type BusinessCategory = 'Restaurant' | 'Retail' | 'Service' | 'Manufacturing' | 'Other';

export type ProductType = 'product' | 'dish' | 'ingredient';

export type DishCategory = 'Rice' | 'Soups' | 'Swallow' | 'Grills' | 'Drinks' | 'Snacks' | 'Breakfast' | 'Desserts' | 'Other';

export type IngredientUnit = 'Kg' | 'Gram' | 'Liter' | 'Bottle' | 'Pack' | 'Carton' | 'Piece';

/**
 * Check if a business is a restaurant based on its category
 */
export async function isRestaurantBusiness(businessId: string): Promise<boolean> {
  try {
    const { firestore } = initializeFirebase();
    const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
    
    if (businessDoc.exists()) {
      const data = businessDoc.data();
      const category = data.category || data.businessCategory || '';
      return category.toLowerCase() === 'restaurant';
    }
    
    return false;
  } catch (error) {
    console.error('Error checking business category:', error);
    return false;
  }
}

/**
 * Get business category from Firestore
 */
export async function getBusinessCategory(businessId: string): Promise<BusinessCategory> {
  try {
    const { firestore } = initializeFirebase();
    const businessDoc = await getDoc(doc(firestore, 'businesses', businessId));
    
    if (businessDoc.exists()) {
      const data = businessDoc.data();
      const category = data.category || data.businessCategory || 'Other';
      
      // Normalize category to known types
      const normalized = category.toLowerCase();
      if (normalized === 'restaurant') return 'Restaurant';
      if (normalized === 'retail') return 'Retail';
      if (normalized === 'service') return 'Service';
      if (normalized === 'manufacturing') return 'Manufacturing';
      
      return 'Other';
    }
    
    return 'Other';
  } catch (error) {
    console.error('Error getting business category:', error);
    return 'Other';
  }
}

/**
 * Check if product type is restaurant-specific
 */
export function isRestaurantProductType(type: ProductType): boolean {
  return type === 'dish' || type === 'ingredient';
}

/**
 * Get dish categories for dropdown
 */
export function getDishCategories(): DishCategory[] {
  return ['Rice', 'Soups', 'Swallow', 'Grills', 'Drinks', 'Snacks', 'Breakfast', 'Desserts', 'Other'];
}

/**
 * Get ingredient unit types for dropdown
 */
export function getIngredientUnits(): IngredientUnit[] {
  return ['Kg', 'Gram', 'Liter', 'Bottle', 'Pack', 'Carton', 'Piece'];
}
