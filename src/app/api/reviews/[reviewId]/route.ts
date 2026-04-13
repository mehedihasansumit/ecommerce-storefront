import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ReviewService } from "@/features/reviews/service";
import { updateReviewSchema } from "@/features/reviews/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(admin, PERMISSIONS.REVIEWS_MODERATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, ...rest } = body as { storeId: string; isApproved: boolean };

    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }
    if (!canAccessStore(admin, storeId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const validated = updateReviewSchema.parse(rest);
    const { reviewId } = await params;

    const review = validated.isApproved
      ? await ReviewService.approve(storeId, reviewId)
      : await ReviewService.reject(storeId, reviewId);

    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      const status = error.message === "Review not found" ? 404
        : error.message === "Forbidden" ? 403
        : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(admin, PERMISSIONS.REVIEWS_MODERATE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId is required" }, { status: 400 });
    }
    if (!canAccessStore(admin, storeId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { reviewId } = await params;
    await ReviewService.delete(storeId, reviewId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      const status = error.message === "Review not found" ? 404
        : error.message === "Forbidden" ? 403
        : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
