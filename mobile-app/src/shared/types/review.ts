export interface IReview {
  _id: string;
  storeId: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  reviewerName: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}
