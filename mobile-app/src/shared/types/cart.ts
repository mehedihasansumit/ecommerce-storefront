export interface ICartItem {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  variantSelections: Record<string, string>;
  quantity: number;
  priceAtAdd: number;
}
