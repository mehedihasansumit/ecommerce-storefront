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
  COUPONS_VIEW: "coupons.view",
  COUPONS_CREATE: "coupons.create",
  COUPONS_EDIT: "coupons.edit",
  COUPONS_DELETE: "coupons.delete",
  ANNOUNCEMENTS_VIEW: "announcements.view",
  ANNOUNCEMENTS_CREATE: "announcements.create",
  ANNOUNCEMENTS_SEND: "announcements.send",
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
  "coupons.view": "View Coupons",
  "coupons.create": "Create Coupons",
  "coupons.edit": "Edit Coupons",
  "coupons.delete": "Delete Coupons",
  "announcements.view": "View Announcements",
  "announcements.create": "Create Announcements",
  "announcements.send": "Send Announcements",
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
  {
    label: "Coupons",
    permissions: [
      PERMISSIONS.COUPONS_VIEW,
      PERMISSIONS.COUPONS_CREATE,
      PERMISSIONS.COUPONS_EDIT,
      PERMISSIONS.COUPONS_DELETE,
    ],
  },
  {
    label: "Announcements",
    permissions: [
      PERMISSIONS.ANNOUNCEMENTS_VIEW,
      PERMISSIONS.ANNOUNCEMENTS_CREATE,
      PERMISSIONS.ANNOUNCEMENTS_SEND,
    ],
  },
] as const;

/**
 * Admin permission context — accepts either:
 * - A flat shape: `{ isSuperAdmin, permissions?, assignedStores? }`
 * - An IAdminUserWithRole: `{ role: { isSuperAdmin, permissions }, assignedStores? }`
 */
type AdminCtx = {
  isSuperAdmin?: boolean;
  permissions?: string[] | null;
  assignedStores?: string[] | null;
  role?: { isSuperAdmin: boolean; permissions?: string[] | null };
};

function resolveCtx(admin: AdminCtx) {
  const isSuperAdmin = admin.role?.isSuperAdmin ?? admin.isSuperAdmin ?? false;
  const permissions = admin.role?.permissions ?? admin.permissions ?? [];
  const assignedStores = admin.assignedStores ?? [];
  return { isSuperAdmin, permissions, assignedStores };
}

export function hasPermission(admin: AdminCtx, permission: Permission): boolean {
  const { isSuperAdmin, permissions } = resolveCtx(admin);
  if (isSuperAdmin) return true;
  return permissions.includes(permission);
}

/**
 * Check if an admin can access a specific store.
 * - SuperAdmin: always true
 * - Admin with empty assignedStores: access all stores (no restriction)
 * - Admin with specific assignedStores: only those stores
 */
export function canAccessStore(admin: AdminCtx, storeId: string): boolean {
  const { isSuperAdmin, assignedStores } = resolveCtx(admin);
  if (isSuperAdmin) return true;
  if (assignedStores.length === 0) return true;
  return assignedStores.includes(storeId);
}
