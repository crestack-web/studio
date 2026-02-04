
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string; // This will be the product ID
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
  businessId: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string, variantId?: string) => void;
  updateQuantity: (itemId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // Load cart from localStorage on initial render
    try {
      const storedCart = localStorage.getItem('busmo-cart');
      if (storedCart) {
        setItems(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
        localStorage.removeItem('busmo-cart');
    }
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('busmo-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (itemToAdd: CartItem) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.id === itemToAdd.id && item.variantId === itemToAdd.variantId
      );

      if (existingItemIndex > -1) {
        // Item with same variant already exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += itemToAdd.quantity;
        return updatedItems;
      } else {
        // New item or new variant
        return [...prevItems, itemToAdd];
      }
    });
  };

  const removeItem = (itemId: string, variantId?: string) => {
    setItems(prevItems =>
      prevItems.filter(item => !(item.id === itemId && item.variantId === variantId))
    );
  };

  const updateQuantity = (itemId: string, variantId: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId, variantId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
