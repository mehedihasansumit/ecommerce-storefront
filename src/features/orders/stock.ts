import { ProductRepository } from "@/features/products/repository";
import { invalidateStore } from "@/shared/lib/data-cache";

export interface StockLine {
  productId: string;
  variantId?: string;
  quantity: number;
}

/** Takes ordered quantities out of stock (order placed). */
export async function takeStock(storeId: string, lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    if (line.variantId) {
      await ProductRepository.decreaseVariantStock(line.productId, line.variantId, line.quantity);
    } else {
      await ProductRepository.decreaseStock(line.productId, line.quantity);
    }
  }
  // Product cards show sold-out and "only N left".
  invalidateStore(storeId);
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
