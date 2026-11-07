import { ProductRepository } from "@/features/products/repository";
import { invalidateStore } from "@/shared/lib/data-cache";

export interface StockLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

/**
 * Takes ordered quantities out of stock before the order is saved. Each line is
 * one guarded update (never below zero), so two orders at once can't both take
 * the last item. If any line is short, what was already taken is put back and
 * the short line is returned; null means everything was taken.
 */
export async function takeStock(storeId: string, lines: StockLine[]): Promise<StockLine | null> {
  const taken: StockLine[] = [];
  for (const line of lines) {
    const ok = line.variantId
      ? await ProductRepository.tryTakeVariantStock(line.productId, line.variantId, line.quantity)
      : await ProductRepository.tryTakeStock(line.productId, line.quantity);
    if (!ok) {
      await restoreStock(storeId, taken);
      return line;
    }
    taken.push(line);
  }
  // Product cards show sold-out and "only N left".
  invalidateStore(storeId);
  return null;
}

/** Puts ordered quantities back into stock (order cancelled). */
export async function restoreStock(storeId: string, lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    if (line.variantId) {
      await ProductRepository.increaseVariantStock(line.productId, line.variantId, line.quantity);
    } else {
      await ProductRepository.increaseStock(line.productId, line.quantity);
    }
  }
  invalidateStore(storeId);
}
