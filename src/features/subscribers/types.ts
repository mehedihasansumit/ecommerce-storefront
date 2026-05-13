export interface ISubscriber {
  _id: string;
  storeId: string;
  email?: string;
  phone?: string;
  status: "subscribed" | "unsubscribed";
  createdAt: Date;
  updatedAt: Date;
}

