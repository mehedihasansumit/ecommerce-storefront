"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useTenant } from "@/shared/hooks/useTenant";

export interface LocalCartItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  variantSelections: Record<string, string>;
  quantity: number;
  priceAtAdd: number;
}

interface LocalCart {
  storeId: string;
  items: LocalCartItem[];
}

interface CartContextValue {
  items: LocalCartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: LocalCartItem) => void;
  updateQuantity: (
    productId: string,
    variantSelections: Record<string, string>,
    quantity: number
  ) => void;
  removeItem: (
    productId: string,
    variantSelections: Record<string, string>
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = "cart";

function isSameItem(
  a: LocalCartItem,
  b: { productId: string; variantSelections: Record<string, string> }
) {
  return (
    a.productId === b.productId &&
    JSON.stringify(a.variantSelections) === JSON.stringify(b.variantSelections)
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const tenant = useTenant();
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (!tenant?._id) return;
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const stored: LocalCart = JSON.parse(raw);
        // Clear if storeId doesn't match current store
        if (stored.storeId === tenant._id) {
          setItems(stored.items ?? []);
        } else {
          localStorage.removeItem(CART_KEY);
        }
      }
    } catch {
      localStorage.removeItem(CART_KEY);
    }
    setHydrated(true);
  }, [tenant?._id]);

  // Persist to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated || !tenant?._id) return;
    const cart: LocalCart = { storeId: tenant._id, items };
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [items, hydrated, tenant?._id]);

  const addItem = useCallback((newItem: LocalCartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => isSameItem(i, newItem));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...prev, newItem];
    });
  }, []);

  const updateQuantity = useCallback(
    (
      productId: string,
      variantSelections: Record<string, string>,
      quantity: number
    ) => {
      setItems((prev) => {
        if (quantity <= 0) {
          return prev.filter(
            (i) => !isSameItem(i, { productId, variantSelections })
          );
        }
        return prev.map((i) =>
          isSameItem(i, { productId, variantSelections })
            ? { ...i, quantity }
            : i
        );
      });
    },
    []
  );

  const removeItem = useCallback(
    (productId: string, variantSelections: Record<string, string>) => {
      setItems((prev) =>
        prev.filter((i) => !isSameItem(i, { productId, variantSelections }))
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_KEY);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + i.priceAtAdd * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
