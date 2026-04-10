import { Types } from "mongoose";

export interface IOrderItem {
  productId: string;
  productName: string;
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
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItemDocument {
  productId: Types.ObjectId;
  productName: string;
  variantSelections: Map<string, string>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IOrderDocument
  extends Omit<IOrder, "_id" | "storeId" | "userId" | "items"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  userId: Types.ObjectId | null;
  items: IOrderItemDocument[];
}
