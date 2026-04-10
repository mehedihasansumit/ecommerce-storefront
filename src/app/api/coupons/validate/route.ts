import { NextRequest } from "next/server";
import { CouponService } from "@/features/coupons/service";
import { applyCouponSchema } from "@/features/coupons/schemas";
import { ProductRepository } from "@/features/products/repository";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { ZodError } from "zod";

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

    // Enrich cart items with server-side prices and category info
    const enrichedItems = await Promise.all(
      validated.items.map(async (item) => {
        const product = await ProductRepository.findById(item.productId);
        if (!product || product.storeId !== storeId) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
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
