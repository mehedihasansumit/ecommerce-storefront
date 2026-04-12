import { Types } from "mongoose";

export interface INewsletter {
  _id: string;
  storeId: string;
  email: string;
  status: "subscribed" | "unsubscribed";
  createdAt: Date;
  updatedAt: Date;
}

export interface INewsletterDocument extends Omit<INewsletter, "_id" | "storeId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
}
