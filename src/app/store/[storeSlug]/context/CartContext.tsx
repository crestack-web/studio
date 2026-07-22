'use client';

import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  displayName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
  productType: 'physical' | 'digital' | 'service';
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({
  children,
  storeSlug,
}: {
  children: React.ReactNode;
  storeSlug: string;
}) {
  const storageKey = `mo_cart_${storeSlug}`;

  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch { /* storage full / private mode */ }
  }, [items, storageKey]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === newItem.productId);
      if (existing) {
        return prev.map(i =>
          i.productId === newItem.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.maxStock) }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId));
    } else {
      setItems(prev =>
        prev.map(i =>
          i.productId === productId
            ? { ...i, quantity: Math.min(qty, i.maxStock) }
            : i
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal   = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(() => ({
    items, totalItems, subtotal, isOpen,
    openCart:   () => setIsOpen(true),
    closeCart:  () => setIsOpen(false),
    toggleCart: () => setIsOpen(v => !v),
    addItem, removeItem, updateQty, clearCart,
  }), [items, totalItems, subtotal, isOpen, addItem, removeItem, updateQty, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
