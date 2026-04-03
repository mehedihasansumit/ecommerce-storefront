import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/shared/lib/auth";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtAdminPayload } from "@/features/auth/types";

export async function GET(request: NextRequest) {
  try {
    const payload = await getAdminToken();

    if (!payload || payload.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch fresh admin data
    const adminPayload = payload as JwtAdminPayload;
    const admin = await AuthRepository.findAdminById(adminPayload.adminId);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
