import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/shared/lib/api-response";
import { RoleService } from "@/features/roles/service";
import { updateRoleSchema } from "@/features/roles/schemas";
import { getAdminDbUser } from "@/shared/lib/auth";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!admin.role.isSuperAdmin) return forbiddenResponse("Superadmin only");

    const { roleId } = await params;
    const role = await RoleService.getById(roleId);
    if (!role) return notFoundResponse("Role not found");
    return successResponse(role);
  } catch {
    return errorResponse("Failed to fetch role", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!admin.role.isSuperAdmin) return forbiddenResponse("Superadmin only");

    const { roleId } = await params;
    const body = await request.json();
    const validated = updateRoleSchema.parse(body);
    const role = await RoleService.update(roleId, validated);
    return successResponse(role);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(error.issues[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to update role", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!admin.role.isSuperAdmin) return forbiddenResponse("Superadmin only");

    const { roleId } = await params;
    await RoleService.delete(roleId);
    return successResponse({ message: "Role deleted" });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to delete role", 500);
  }
}
