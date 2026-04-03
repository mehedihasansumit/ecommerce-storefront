import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/features/categories/service";
import { createCategorySchema } from "@/features/categories/schemas";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);

    const categories = await CategoryService.getByStore(storeId);
    return successResponse(categories);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);

    const validated = createCategorySchema.parse(rest);
    const category = await CategoryService.create(storeId, validated as Parameters<typeof CategoryService.create>[1]);
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = (err as any).issues || (err as any).errors;
      return errorResponse(issues?.[0]?.message || "Validation error", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}
