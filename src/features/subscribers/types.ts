import { Types } from "mongoose";

export interface ISubscriber {
  _id: string;
  storeId: string;
  email?: string;
  phone?: string;
  status: "subscribed" | "unsubscribed";
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriberDocument extends Omit<ISubscriber, "_id" | "storeId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
}
