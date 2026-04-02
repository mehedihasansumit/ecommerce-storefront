export const DEFAULT_THEME = {
  primaryColor: "#3B82F6",
  secondaryColor: "#10B981",
  accentColor: "#F59E0B",
  backgroundColor: "#FFFFFF",
  textColor: "#111827",
  headerBg: "#111827",
  headerText: "#FFFFFF",
  fontFamily: "Inter",
  borderRadius: "0.5rem",
  layoutStyle: "grid" as const,
};

export const ITEMS_PER_PAGE = 12;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};
