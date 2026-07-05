/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import CustomError from '../../errors/customError';
import Product from '../product/product.model';
import CustomerOrder from './customerOrder.model';
import { ICreateCustomerOrderPayload } from './customerOrder.interface';

class CustomerOrderServices {
  async create(payload: ICreateCustomerOrderPayload) {
    const productIds = payload.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();

    if (products.length !== productIds.length) {
      throw new CustomError(httpStatus.BAD_REQUEST, 'Some products are not available.');
    }

    const productMap = new Map(products.map((product: any) => [String(product._id), product]));
    const ownerId = String(products[0].user);

    if (products.some((product: any) => String(product.user) !== ownerId)) {
      throw new CustomError(httpStatus.BAD_REQUEST, 'Please checkout products from the same shop at a time.');
    }

    const items = payload.items.map((item) => {
      const product = productMap.get(item.product);

      if (!product) {
        throw new CustomError(httpStatus.BAD_REQUEST, 'Product is not available.');
      }

      if (item.quantity > product.stock) {
        throw new CustomError(httpStatus.BAD_REQUEST, `${product.name} has only ${product.stock} item(s) in stock.`);
      }

      const unitPrice = Number(product.price);
      const quantity = Number(item.quantity);

      return {
        product: new Types.ObjectId(product._id),
        productName: product.name,
        categoryName: product.category?.name || 'General',
        brandName: product.brand?.name,
        unitPrice,
        quantity,
        totalPrice: unitPrice * quantity
      };
    });

    const totalPrice = items.reduce((total, item) => total + item.totalPrice, 0);

    await Product.bulkWrite(
      items.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { stock: -item.quantity } }
        }
      }))
    );

    return CustomerOrder.create({
      user: new Types.ObjectId(ownerId),
      customerName: payload.customerName,
      phone: payload.phone,
      address: payload.address,
      items,
      totalPrice,
      status: 'PENDING'
    });
  }

  async getAll(userId: string, query: Record<string, unknown>) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const search = query.search ? String(query.search) : '';
    const status = query.status ? String(query.status) : '';
    const filter: Record<string, unknown> = {
      user: new Types.ObjectId(userId)
    };

    if (status === 'PENDING' || status === 'CONFIRMED') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { 'items.productName': { $regex: search, $options: 'i' } }
      ];
    }

    const [data, totalCount] = await Promise.all([
      CustomerOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CustomerOrder.countDocuments(filter)
    ]);

    return { data, totalCount };
  }

  async confirm(id: string, userId: string) {
    const order = await CustomerOrder.findOne({
      _id: id,
      user: new Types.ObjectId(userId)
    });

    if (!order) {
      throw new CustomError(httpStatus.NOT_FOUND, 'Customer order is not found!');
    }

    if (order.status === 'CONFIRMED') {
      return order;
    }

    order.status = 'CONFIRMED';
    order.confirmedAt = new Date();

    return order.save();
  }
}

const customerOrderServices = new CustomerOrderServices();
export default customerOrderServices;
