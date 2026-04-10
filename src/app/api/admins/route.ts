import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { AuthService } from "@/features/auth/service";
import { createAdminSchema } from "@/features/auth/schemas";
import { getAdminToken } from "@/shared/lib/auth";
import type { JwtAdminPayload } from "@/features/auth/types";
import { ZodError } from "zod";

export async function GET() {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const admins = await AuthService.listAdmins();
    return successResponse(admins);
  } catch {
    return errorResponse("Failed to fetch admins", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await getAdminToken()) as JwtAdminPayload | null;
    if (!payload || payload.type !== "admin") return unauthorizedResponse();
    if (payload.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const body = await request.json();
    const validated = createAdminSchema.parse(body);
    const admin = await AuthService.createAdmin(validated);
    const { passwordHash: _, ...safe } = admin;
    return successResponse(safe, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(error.issues[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return errorResponse("Failed to create admin", 500);
  }
}
