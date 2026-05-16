"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useTenant } from "@/shared/hooks/useTenant";
import {
  allocateBulkLineTotals,
  getBulkUnitPrice,
  normalizeTiers,
  round2,
  type PricingTier,
} from "@/shared/lib/pricing";

export interface LocalCartItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  variantSelections: Record<string, string>;
  quantity: number;
  priceAtAdd: number;
  pricingTiers?: PricingTier[];
  productBasePrice?: number;
}

export interface CartLineComputed {
  unitPrice: number;
  lineTotal: number;
  appliedTierQty: number | null;
  appliedTierTotal: number | null;
}

interface LocalCart {
  storeId: string;
  items: LocalCartItem[];
}

interface CouponDetails {
  code: string;
  discount: number;
  couponId: string;
}

interface CartContextValue {
  items: LocalCartItem[];
  itemCount: number;
  subtotal: number;
  coupon: CouponDetails | null;
  discount: number;
  total: number;
  couponLoading: boolean;
  couponError: string;
  computedLines: CartLineComputed[];
  getLineByItem: (item: LocalCartItem) => CartLineComputed;
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
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
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
  const [coupon, setCoupon] = useState<CouponDetails | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

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
    setCoupon(null);
    setCouponError("");
    localStorage.removeItem(CART_KEY);
  }, []);

  const applyCoupon = useCallback(
    async (code: string): Promise<boolean> => {
      if (items.length === 0) {
        setCouponError("Cart is empty");
        return false;
      }
      setCouponLoading(true);
      setCouponError("");
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              // Server re-applies tier math; sent value is a hint only.
              price: i.priceAtAdd,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setCouponError(data.error || "Invalid coupon");
          setCoupon(null);
          return false;
        }
        if (!data.valid) {
          setCouponError(data.reason || "Invalid coupon");
          setCoupon(null);
          return false;
        }
        setCoupon({
          code: code.toUpperCase(),
          discount: data.discount,
          couponId: data.couponId,
        });
        return true;
      } catch {
        setCouponError("Failed to validate coupon");
        setCoupon(null);
        return false;
      } finally {
        setCouponLoading(false);
      }
    },
    [items]
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponError("");
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Derive per-line unit + total prices applying bulk tiers across same-product
  // lines (mixing variants of the same product counts toward one bundle).
  const computedLines = useMemo<CartLineComputed[]>(() => {
    const lines: CartLineComputed[] = new Array(items.length);
    const indicesByProduct = new Map<string, number[]>();
    items.forEach((it, i) => {
      const list = indicesByProduct.get(it.productId) ?? [];
      list.push(i);
      indicesByProduct.set(it.productId, list);
    });

    for (const [, idxs] of indicesByProduct) {
      const sample = items[idxs[0]];
      const tiers = normalizeTiers(sample.pricingTiers);
      const basePrice = sample.productBasePrice ?? sample.priceAtAdd;
      const qtys = idxs.map((i) => items[i].quantity);
      const totalQty = qtys.reduce((s, q) => s + q, 0);

      if (tiers.length > 0) {
        const unit = round2(getBulkUnitPrice(basePrice, totalQty, tiers));
        const lineTotals = allocateBulkLineTotals(basePrice, qtys, tiers);
        let appliedTierQty: number | null = null;
        let appliedTierTotal: number | null = null;
        for (const t of tiers) {
          if (t.quantity <= totalQty) {
            appliedTierQty = t.quantity;
            appliedTierTotal = t.totalPrice;
          } else break;
        }
        idxs.forEach((i, k) => {
          lines[i] = {
            unitPrice: unit,
            lineTotal: lineTotals[k],
            appliedTierQty,
            appliedTierTotal,
          };
        });
      } else {
        idxs.forEach((i) => {
          const it = items[i];
          lines[i] = {
            unitPrice: it.priceAtAdd,
            lineTotal: round2(it.priceAtAdd * it.quantity),
            appliedTierQty: null,
            appliedTierTotal: null,
          };
        });
      }
    }
    return lines;
  }, [items]);

  const subtotal = round2(
    computedLines.reduce((sum, l) => sum + l.lineTotal, 0),
  );
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const getLineByItem = useCallback(
    (item: LocalCartItem): CartLineComputed => {
      const idx = items.findIndex((i) => isSameItem(i, item));
      return (
        computedLines[idx] ?? {
          unitPrice: item.priceAtAdd,
          lineTotal: item.priceAtAdd * item.quantity,
          appliedTierQty: null,
          appliedTierTotal: null,
        }
      );
    },
    [items, computedLines],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        coupon,
        discount,
        total,
        couponLoading,
        couponError,
        computedLines,
        getLineByItem,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
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
