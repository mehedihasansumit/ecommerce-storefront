export const PERMISSIONS = {
  STORES_CREATE: "stores.create",
  STORES_EDIT: "stores.edit",
  STORES_DELETE: "stores.delete",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_EDIT: "products.edit",
  PRODUCTS_DELETE: "products.delete",
  ORDERS_VIEW: "orders.view",
  ORDERS_UPDATE_STATUS: "orders.updateStatus",
  CUSTOMERS_VIEW: "customers.view",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_UPDATE_STATUS: "payments.updateStatus",
  PAYMENTS_DISCOUNT: "payments.discount",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "stores.create": "Create Stores",
  "stores.edit": "Edit Stores",
  "stores.delete": "Delete Stores",
  "products.create": "Create Products",
  "products.edit": "Edit Products",
  "products.delete": "Delete Products",
  "orders.view": "View Orders",
  "orders.updateStatus": "Update Order Status",
  "customers.view": "View Customers",
  "payments.view": "View Payments",
  "payments.updateStatus": "Update Payment Status",
  "payments.discount": "Apply Payment Discounts",
};

export const PERMISSION_GROUPS = [
  {
    label: "Stores",
    permissions: [
      PERMISSIONS.STORES_CREATE,
      PERMISSIONS.STORES_EDIT,
      PERMISSIONS.STORES_DELETE,
    ],
  },
  {
    label: "Products",
    permissions: [
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_DELETE,
    ],
  },
  {
    label: "Orders",
    permissions: [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.ORDERS_UPDATE_STATUS],
  },
  {
    label: "Customers",
    permissions: [PERMISSIONS.CUSTOMERS_VIEW],
  },
  {
    label: "Payments",
    permissions: [
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.PAYMENTS_UPDATE_STATUS,
      PERMISSIONS.PAYMENTS_DISCOUNT,
    ],
  },
] as const;

export function hasPermission(
  admin: { role: string; permissions?: string[] | null },
  permission: Permission
): boolean {
  if (admin.role === "superadmin") return true;
  return (admin.permissions ?? []).includes(permission);
}

/**
 * Check if an admin can access a specific store.
 * - Superadmin: always true
 * - Manager with empty assignedStores: access all stores (no restriction)
 * - Manager with specific assignedStores: only those stores
 */
export function canAccessStore(
  admin: { role: string; assignedStores?: string[] | null },
  storeId: string
): boolean {
  if (admin.role === "superadmin") return true;
  const stores = admin.assignedStores ?? [];
  if (stores.length === 0) return true; // no restriction = all stores
  return stores.includes(storeId);
}
