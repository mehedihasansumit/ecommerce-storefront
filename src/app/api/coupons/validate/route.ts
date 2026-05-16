import { NextRequest } from "next/server";
import { CouponService } from "@/features/coupons/service";
import { applyCouponSchema } from "@/features/coupons/schemas";
import { ProductRepository } from "@/features/products/repository";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { ZodError } from "zod";
import { getBulkUnitPrice, normalizeTiers } from "@/shared/lib/pricing";

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const body = await request.json();
    const validated = applyCouponSchema.parse(body);

    // Get userId if logged in (optional for validation)
    let userId: string | undefined;
    const payload = await getCustomerToken();
    if (payload && payload.type === "customer") {
      userId = (payload as JwtCustomerPayload).userId;
    }

    // Enrich cart items with server-side prices, applying bulk pricing tiers per
    // product (aggregated qty across all variant lines).
    const qtyByProduct = new Map<string, number>();
    for (const item of validated.items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    const productCache = new Map<string, Awaited<ReturnType<typeof ProductRepository.findById>>>();
    const enrichedItems = await Promise.all(
      validated.items.map(async (item) => {
        let product = productCache.get(item.productId);
        if (product === undefined) {
          product = await ProductRepository.findById(item.productId);
          productCache.set(item.productId, product);
        }
        if (!product || product.storeId !== storeId) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        const tiers = normalizeTiers(product.pricingTiers);
        const effectiveUnit = tiers.length > 0
          ? getBulkUnitPrice(product.price, qtyByProduct.get(item.productId) ?? item.quantity, tiers)
          : product.price;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: effectiveUnit,
          categoryId: product.categoryId?.toString(),
        };
      })
    );

    const result = await CouponService.validate(
      storeId,
      validated.code,
      enrichedItems,
      userId
    );

    return successResponse(result);
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
