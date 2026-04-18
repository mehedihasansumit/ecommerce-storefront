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
  newsletterBg: undefined as string | undefined,
  newsletterText: undefined as string | undefined,
  newsletterBtnBg: undefined as string | undefined,
  newsletterBtnText: undefined as string | undefined,
  priceColor: undefined as string | undefined,
  saleBadgeBg: undefined as string | undefined,
  saleBadgeText: undefined as string | undefined,
  footerBg: undefined as string | undefined,
  footerText: undefined as string | undefined,
  linkColor: undefined as string | undefined,
  dark: {
    backgroundColor: "#111827",
    textColor: "#F9FAFB",
    surfaceColor: "#1F2937",
    borderColor: "#374151",
    headerBg: "#0F172A",
    headerText: "#F8FAFC",
    newsletterBg: undefined as string | undefined,
    newsletterText: undefined as string | undefined,
    newsletterBtnBg: undefined as string | undefined,
    newsletterBtnText: undefined as string | undefined,
    priceColor: undefined as string | undefined,
    saleBadgeBg: undefined as string | undefined,
    saleBadgeText: undefined as string | undefined,
    footerBg: undefined as string | undefined,
    footerText: undefined as string | undefined,
    linkColor: undefined as string | undefined,
  },
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
