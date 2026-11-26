import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Bird, CartItem } from '../types';

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotalInr: number;
  getQuantity: (birdId: number) => number;
  setQuantity: (bird: Bird, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const getQuantity = useCallback(
    (birdId: number) => items.find((i) => i.bird.id === birdId)?.quantity ?? 0,
    [items]
  );

  const setQuantity = useCallback((bird: Bird, quantity: number) => {
    const clamped = Math.max(0, Math.min(quantity, bird.stockQuantity));
    setItems((prev) => {
      if (clamped === 0) {
        return prev.filter((i) => i.bird.id !== bird.id);
      }
      const exists = prev.some((i) => i.bird.id === bird.id);
      if (exists) {
        return prev.map((i) => (i.bird.id === bird.id ? { bird, quantity: clamped } : i));
      }
      return [...prev, { bird, quantity: clamped }];
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotalInr = useMemo(
    () => items.reduce((sum, i) => sum + i.bird.priceInr * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, totalItems, subtotalInr, getQuantity, setQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
