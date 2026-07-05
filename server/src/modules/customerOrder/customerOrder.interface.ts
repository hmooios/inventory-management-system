import { Types } from 'mongoose';

export type CustomerOrderStatus = 'PENDING' | 'CONFIRMED';

export interface ICustomerOrderItem {
  product: Types.ObjectId;
  productName: string;
  categoryName: string;
  brandName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ICustomerOrder {
  user: Types.ObjectId;
  customerName: string;
  phone: string;
  address: string;
  items: ICustomerOrderItem[];
  totalPrice: number;
  status: CustomerOrderStatus;
  confirmedAt?: Date;
}

export interface ICreateCustomerOrderItem {
  product: string;
  quantity: number;
}

export interface ICreateCustomerOrderPayload {
  customerName: string;
  phone: string;
  address: string;
  items: ICreateCustomerOrderItem[];
}
