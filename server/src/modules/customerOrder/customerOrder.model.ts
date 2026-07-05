import { model, Schema } from 'mongoose';
import { ICustomerOrder } from './customerOrder.interface';

const customerOrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, required: true, ref: 'product' },
    productName: { type: String, required: true },
    categoryName: { type: String, required: true },
    brandName: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  },
  { _id: false }
);

const customerOrderSchema = new Schema<ICustomerOrder>(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'user' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    items: { type: [customerOrderItemSchema], required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'CONFIRMED'], default: 'PENDING' },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

const CustomerOrder = model<ICustomerOrder>('customerOrder', customerOrderSchema);
export default CustomerOrder;
