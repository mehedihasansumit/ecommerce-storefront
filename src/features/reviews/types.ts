export interface IReview {
  _id: string;
  storeId: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  reviewerAvatarPosition: { x: number; y: number; zoom: number } | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

