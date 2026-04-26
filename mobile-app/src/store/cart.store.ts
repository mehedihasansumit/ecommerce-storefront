import { create } from "zustand";
import { createMMKV } from "react-native-mmkv";
import type { ICartItem } from "@/shared/types/cart";
import type { CouponValidationResult } from "@/shared/types/coupon";

const storage = createMMKV({ id: "cart-store" });

interface CartState {
  storeId: string | null;
  items: ICartItem[];
  coupon: (CouponValidationResult & { code: string }) | null;
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
  addItem: (item: ICartItem) => void;
  updateQuantity: (productId: string, variantSelections: Record<string, string>, qty: number) => void;
  removeItem: (productId: string, variantSelections: Record<string, string>) => void;
  clearCart: () => void;
  setCoupon: (coupon: CouponValidationResult & { code: string }) => void;
  removeCoupon: () => void;
  initForStore: (storeId: string) => void;
}

function isSameItem(
  a: Pick<ICartItem, "productId" | "variantSelections">,
  b: Pick<ICartItem, "productId" | "variantSelections">
): boolean {
  if (a.productId !== b.productId) return false;
  const aKeys = Object.keys(a.variantSelections).sort();
  const bKeys = Object.keys(b.variantSelections).sort();
  if (aKeys.join() !== bKeys.join()) return false;
  return aKeys.every((k) => a.variantSelections[k] === b.variantSelections[k]);
}

function computeTotals(items: ICartItem[], discount: number) {
  const subtotal = items.reduce((s, i) => s + i.priceAtAdd * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  return { subtotal, total, itemCount };
}

function persist(storeId: string | null, items: ICartItem[], coupon: CartState["coupon"]) {
  storage.set("cart-v1", JSON.stringify({ storeId, items, coupon }));
}

export const useCartStore = create<CartState>((set, get) => ({
  storeId: null,
  items: [],
  coupon: null,
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  total: 0,

  initForStore: (storeId) => {
    const raw = storage.getString("cart-v1");
    if (raw) {
      try {
        const saved = JSON.parse(raw);
        if (saved.storeId === storeId) {
          const { subtotal, total, itemCount } = computeTotals(
            saved.items,
            saved.coupon?.discount ?? 0
          );
          set({
            storeId,
            items: saved.items,
            coupon: saved.coupon,
            subtotal,
            total,
            itemCount,
            discount: saved.coupon?.discount ?? 0,
          });
          return;
        }
      } catch {}
    }
    set({ storeId, items: [], coupon: null, itemCount: 0, subtotal: 0, discount: 0, total: 0 });
  },

  addItem: (item) => {
    const { items, storeId, coupon } = get();
    const idx = items.findIndex((i) => isSameItem(i, item));
    let next: ICartItem[];
    if (idx >= 0) {
      next = items.map((i, n) =>
        n === idx ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      next = [...items, item];
    }
    const { subtotal, total, itemCount } = computeTotals(next, coupon?.discount ?? 0);
    persist(storeId, next, coupon);
    set({ items: next, subtotal, total, itemCount });
  },

  updateQuantity: (productId, variantSelections, qty) => {
    const { items, storeId, coupon } = get();
    const next = qty <= 0
      ? items.filter((i) => !isSameItem(i, { productId, variantSelections }))
      : items.map((i) =>
          isSameItem(i, { productId, variantSelections }) ? { ...i, quantity: qty } : i
        );
    const { subtotal, total, itemCount } = computeTotals(next, coupon?.discount ?? 0);
    persist(storeId, next, coupon);
    set({ items: next, subtotal, total, itemCount });
  },

  removeItem: (productId, variantSelections) => {
    const { items, storeId, coupon } = get();
    const next = items.filter((i) => !isSameItem(i, { productId, variantSelections }));
    const { subtotal, total, itemCount } = computeTotals(next, coupon?.discount ?? 0);
    persist(storeId, next, coupon);
    set({ items: next, subtotal, total, itemCount });
  },

  clearCart: () => {
    const { storeId } = get();
    persist(storeId, [], null);
    set({ items: [], coupon: null, itemCount: 0, subtotal: 0, discount: 0, total: 0 });
  },

  setCoupon: (coupon) => {
    const { items, storeId } = get();
    const { subtotal, total, itemCount } = computeTotals(items, coupon.discount);
    persist(storeId, items, coupon);
    set({ coupon, discount: coupon.discount, subtotal, total, itemCount });
  },

  removeCoupon: () => {
    const { items, storeId } = get();
    const { subtotal, total, itemCount } = computeTotals(items, 0);
    persist(storeId, items, null);
    set({ coupon: null, discount: 0, subtotal, total, itemCount });
  },
}));
