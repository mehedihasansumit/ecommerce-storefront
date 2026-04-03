import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/features/categories/service";
import { updateCategorySchema } from "@/features/categories/schemas";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const category = await CategoryService.getById(categoryId);
    if (!category) return errorResponse("Category not found", 404);
    return successResponse(category);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);
    const category = await CategoryService.update(categoryId, validated);
    if (!category) return errorResponse("Category not found", 404);
    return successResponse(category);
  } catch (err) {
    if (err instanceof ZodError) {
      const issues = (err as any).issues || (err as any).errors;
      return errorResponse(issues?.[0]?.message || "Validation error", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const deleted = await CategoryService.delete(categoryId);
    if (!deleted) return errorResponse("Category not found", 404);
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
