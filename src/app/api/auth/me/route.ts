import { NextRequest, NextResponse } from "next/server";
import { getAdminDbUser } from "@/shared/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role.name,
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
