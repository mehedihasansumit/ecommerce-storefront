import { NextResponse } from "next/server";
import { PERMISSION_LABELS, type Permission } from "@/shared/lib/permissions";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function notFoundResponse(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Returns a structured 403 when the admin lacks a specific permission.
 *
 * Response shape:
 * {
 *   "error": "Forbidden",
 *   "message": "You do not have the \"Apply Payment Discounts\" permission.",
 *   "requiredPermission": "payments.discount"
 * }
 */
export function permissionDeniedResponse(permission: Permission) {
  const label = PERMISSION_LABELS[permission];
  return NextResponse.json(
    {
      error: "Forbidden",
      message: `You do not have the "${label}" permission.`,
      requiredPermission: permission,
    },
    { status: 403 }
  );
}

/**
 * Returns a structured 403 when the admin is not assigned to the requested store.
 *
 * Response shape:
 * {
 *   "error": "Forbidden",
 *   "message": "You do not have access to this store."
 * }
 */
export function storeAccessDeniedResponse() {
  return NextResponse.json(
    {
      error: "Forbidden",
      message: "You do not have access to this store.",
    },
    { status: 403 }
  );
}
