export interface IOrderItem {
  productId: string;
  variantId?: string;
  productName: string;
  productSlug: string;
  variantSelections: Record<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  note?: string;
}

export type RefundRequestStatus = "pending" | "approved" | "rejected" | "processed";

export interface IRefundRequest {
  status: RefundRequestStatus;
  reason: string;
  requestedAt: Date;
  adminNote?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
  refundAmount: number;
  gatewayRefundId?: string;
  processedAt?: Date;
}

export interface IOrder {
  _id: string;
  storeId: string;
  orderNumber: string;
  userId: string | null;
  guestPhone?: string;
  guestEmail?: string;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  couponCode: string;
  total: number;
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentIntentId: string;
  status: OrderStatus;
  statusHistory: IStatusHistoryEntry[];
  refundRequest?: IRefundRequest;
  notes: string;
  clientIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

