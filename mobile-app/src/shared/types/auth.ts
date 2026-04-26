export interface IAddress {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface INotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface IUser {
  _id: string;
  storeId: string;
  name: string;
  email: string;
  phone: string;
  addresses: IAddress[];
  isActive: boolean;
  points: number;
  notificationPreferences: INotificationPreferences;
  createdAt: string;
  updatedAt: string;
}
