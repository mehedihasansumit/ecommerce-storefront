import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/shared/lib/api-response";
import { AuthService } from "@/features/auth/service";
import { updateAdminSchema } from "@/features/auth/schemas";
import { getAdminToken } from "@/shared/lib/auth";
import type { JwtAdminPayload } from "@/features/auth/types";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const { adminId } = await params;
    const { AuthRepository } = await import("@/features/auth/repository");
    const admin = await AuthRepository.findAdminById(adminId);
    if (!admin) return notFoundResponse("Admin not found");
    const { passwordHash: _, ...safe } = admin;
    return successResponse(safe);
  } catch {
    return errorResponse("Failed to fetch admin", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const { adminId } = await params;
    const body = await request.json();
    const validated = updateAdminSchema.parse(body);
    const admin = await AuthService.updateAdmin(adminId, validated);
    return successResponse(admin);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(error.issues[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to update admin", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const { adminId } = await params;
    // Prevent self-deletion
    if (adminId === payload.adminId) {
      return errorResponse("Cannot delete your own account", 400);
    }
    await AuthService.deleteAdmin(adminId);
    return successResponse({ message: "Admin deleted" });
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to delete admin", 500);
  }
}
