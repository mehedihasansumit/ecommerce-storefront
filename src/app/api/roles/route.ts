import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { RoleService } from "@/features/roles/service";
import { createRoleSchema } from "@/features/roles/schemas";
import { getAdminToken } from "@/shared/lib/auth";
import type { JwtAdminPayload } from "@/features/auth/types";
import { ZodError } from "zod";

export async function GET() {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const roles = await RoleService.list();
    return successResponse(roles);
  } catch {
    return errorResponse("Failed to fetch roles", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const body = await request.json();
    const validated = createRoleSchema.parse(body);
    const role = await RoleService.create(validated);
    return successResponse(role, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(error.issues[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to create role", 500);
  }
}
