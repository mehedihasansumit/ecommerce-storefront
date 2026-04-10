import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { AuthService } from "@/features/auth/service";
import { createAdminSchema } from "@/features/auth/schemas";
import { getAdminDbUser } from "@/shared/lib/auth";
import { ZodError } from "zod";

export async function GET() {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (admin.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const admins = await AuthService.listAdmins();
    return successResponse(admins);
  } catch {
    return errorResponse("Failed to fetch admins", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (admin.role !== "superadmin") return forbiddenResponse("Superadmin only");

    const body = await request.json();
    const validated = createAdminSchema.parse(body);
    const newAdmin = await AuthService.createAdmin(validated);
    const { passwordHash: _, ...safe } = newAdmin;
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
