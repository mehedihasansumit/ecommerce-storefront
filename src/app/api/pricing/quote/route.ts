import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { ProductRepository } from "@/features/products/repository";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import {
  allocateBulkLineTotals,
  getBulkUnitPrice,
  normalizeTiers,
  round2,
} from "@/shared/lib/pricing";
import type { IProduct } from "@/features/products/types";

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const body = await request.json();
    const validated = quoteSchema.parse(body);

    const productCache = new Map<string, IProduct>();
    for (const item of validated.items) {
      if (productCache.has(item.productId)) continue;
      const product = await ProductRepository.findById(item.productId);
      if (!product || product.storeId !== storeId) {
        return errorResponse(`Product not found: ${item.productId}`, 404);
      }
      productCache.set(product._id, product);
    }

    // Group by productId for tier aggregation.
    const indicesByProduct = new Map<string, number[]>();
    validated.items.forEach((item, i) => {
      const list = indicesByProduct.get(item.productId) ?? [];
      list.push(i);
      indicesByProduct.set(item.productId, list);
    });

    const lines = new Array(validated.items.length);
    let subtotal = 0;

    for (const [productId, indices] of indicesByProduct) {
      const product = productCache.get(productId)!;
      const tiers = normalizeTiers(product.pricingTiers);
      const qtys = indices.map((i) => validated.items[i].quantity);
      const totalQty = qtys.reduce((s, q) => s + q, 0);

      let lineTotals: number[];
      let unitPrice: number;
      if (tiers.length > 0) {
        unitPrice = round2(getBulkUnitPrice(product.price, totalQty, tiers));
        lineTotals = allocateBulkLineTotals(product.price, qtys, tiers);
      } else {
        // No tiers — use variant price override if provided.
        const baseFor = (variantId?: string): number => {
          if (!variantId) return product.price;
          const v = product.variants.find((x) => x._id === variantId);
          return v?.price ?? product.price;
        };
        unitPrice = baseFor(validated.items[indices[0]].variantId);
        lineTotals = indices.map((i) =>
          round2(baseFor(validated.items[i].variantId) * validated.items[i].quantity),
        );
      }

      indices.forEach((i, k) => {
        const lineUnit = tiers.length > 0
          ? unitPrice
          : round2(lineTotals[k] / validated.items[i].quantity);
        lines[i] = {
          productId,
          variantId: validated.items[i].variantId,
          quantity: validated.items[i].quantity,
          unitPrice: lineUnit,
          lineTotal: lineTotals[k],
          appliedTier:
            tiers.length > 0
              ? { totalQty, effectiveUnit: unitPrice }
              : null,
        };
        subtotal += lineTotals[k];
      });
    }

    return successResponse({ lines, subtotal: round2(subtotal) });
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message || "Validation error", 400);
    }
    if (err instanceof Error) {
      return errorResponse(err.message, 400);
    }
    return errorResponse("Internal server error", 500);
  }
}
