import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { ReviewService } from "@/features/reviews/service";
import { createReviewSchema, getReviewsQuerySchema } from "@/features/reviews/schemas";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { serviceErrorResponse } from "@/shared/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { searchParams } = request.nextUrl;
    const query = getReviewsQuerySchema.parse(Object.fromEntries(searchParams));

    if (!query.productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const result = await ReviewService.getApprovedForProduct(
      storeId,
      query.productId,
      query.page,
      query.limit
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const customerPayload = payload as JwtCustomerPayload;
    const user = await AuthRepository.findUserById(customerPayload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createReviewSchema.parse(body);

    const review = await ReviewService.create(
      storeId,
      customerPayload.userId,
      user.name,
      validated
    );

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return serviceErrorResponse(error, 400);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
