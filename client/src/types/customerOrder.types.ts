export type CustomerOrderStatus = 'PENDING' | 'CONFIRMED';

export interface ICustomerOrderItem {
  product: string;
  productName: string;
  categoryName: string;
  brandName?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface ICustomerOrder {
  _id: string;
  user: string;
  customerName: string;
  phone: string;
  address: string;
  items: ICustomerOrderItem[];
  totalPrice: number;
  status: CustomerOrderStatus;
  confirmedAt?: string;
  createdAt: string;
}
