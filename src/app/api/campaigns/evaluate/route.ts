import { NextRequest } from "next/server";
import { CampaignService } from "@/features/campaigns/service";
import { evaluateCartSchema } from "@/features/campaigns/schemas";
import { ProductRepository } from "@/features/products/repository";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";
import type { EvaluationCartItem } from "@/features/campaigns/types";
import { getBulkUnitPrice, normalizeTiers } from "@/shared/lib/pricing";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const body = await request.json();
    const validated = evaluateCartSchema.parse(body);

    let userId: string | undefined;
    const payload = await getCustomerToken();
    if (payload && payload.type === "customer") {
      userId = (payload as JwtCustomerPayload).userId;
    }

    const qtyByProduct = new Map<string, number>();
    for (const item of validated.items) {
      qtyByProduct.set(
        item.productId,
        (qtyByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }

    const productCache = new Map<string, Awaited<ReturnType<typeof ProductRepository.findById>>>();
    const enriched: EvaluationCartItem[] = [];
    for (const item of validated.items) {
      let product = productCache.get(item.productId);
      if (product === undefined) {
        product = await ProductRepository.findById(item.productId);
        productCache.set(item.productId, product);
      }
      if (!product || product.storeId !== storeId) {
        return errorResponse(`Product not found: ${item.productId}`, 400);
      }
      const tiers = normalizeTiers(product.pricingTiers);
      const totalQty = qtyByProduct.get(item.productId) ?? item.quantity;

      let activeVariant: typeof product.variants[number] | undefined;
      if (item.variantId) {
        activeVariant = product.variants?.find((v) => v._id?.toString() === item.variantId);
      } else if (item.variantSelections && Object.keys(item.variantSelections).length > 0) {
        activeVariant = product.variants?.find((v) =>
          Object.entries(item.variantSelections!).every(
            ([k, val]) => v.optionValues?.[k] === val,
          ),
        );
      }

      const basePrice = activeVariant?.price ?? product.price;
      const unitPrice =
        tiers.length > 0 ? getBulkUnitPrice(product.price, totalQty, tiers) : basePrice;

      enriched.push({
        productId: item.productId,
        variantId: activeVariant?._id?.toString() ?? item.variantId,
        categoryId: product.categoryId || undefined,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const result = await CampaignService.evaluateCart(storeId, userId, enriched, {
      shippingCost: validated.shippingCost ?? 0,
    });
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
