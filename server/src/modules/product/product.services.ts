/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import sortAndPaginatePipeline from '../../lib/sortAndPaginate.pipeline';
import BaseServices from '../baseServices';
import Product from './product.model';
import matchStagePipeline from './product.aggregation.pipeline';
import CustomError from '../../errors/customError';
import Purchase from '../purchase/purchase.model';
import Seller from '../seller/seller.model';
import { IProduct } from './product.interface';

class ProductServices extends BaseServices<any> {
  constructor(model: any, modelName: string) {
    super(model, modelName);
  }

  /**
   * Create new product
   */
  async create(payload: IProduct, userId: string) {
    type str = keyof IProduct;
    (Object.keys(payload) as str[]).forEach((key: str) => {
      if (payload[key] === '') {
        delete payload[key];
      }
    });

    payload.user = new Types.ObjectId(userId);

    try {
      const seller = await Seller.findById(payload.seller);
      const product: any = await this.model.create(payload);

      await Purchase.create({
        user: userId,
        seller: product.seller,
        product: product._id,
        sellerName: seller?.name,
        productName: product.name,
        quantity: product.stock,
        unitPrice: product.price,
        totalPrice: product.stock * product.price
      });

      return product;
    } catch (error) {
      console.log(error);
      throw new CustomError(400, 'Product create failed');
    }
  }

  /**
   * Count Total Product
   */
  async countTotalProduct(userId: string) {
    return this.model.aggregate([
      {
        $match: {
          user: new Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$stock' }
        }
      },
      {
        $project: {
          totalQuantity: 1,
          _id: 0
        }
      }
    ]);
  }

  /**
   * Get All product of user
   */
  async readAll(query: Record<string, unknown> = {}, userId: string) {
    let data = await this.model.aggregate([...matchStagePipeline(query, userId), ...sortAndPaginatePipeline(query)]);

    const totalCount = await this.model.aggregate([
      ...matchStagePipeline(query, userId),
      {
        $group: {
          _id: null,
          total: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0
        }
      }
    ]);

    data = await this.model.populate(data, { path: 'category', select: '-__v -user' });
    data = await this.model.populate(data, { path: 'brand', select: '-__v -user' });
    data = await this.model.populate(data, { path: 'seller', select: '-__v -user -createdAt -updatedAt' });

    return { data, totalCount };
  }

  /**
   * Get products for public customer storefront
   */
  async readPublic(query: Record<string, unknown> = {}) {
    const search = query.search ? String(query.search) : '';
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = {
      stock: { $gt: 0 },
      ...(search ? { name: { $regex: search, $options: 'i' } } : {})
    };

    const data = await this.model
      .find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await this.model.countDocuments(filter);

    return { data, total };
  }

  /**
   * Get Single product of user
   */
  async read(id: string, userId: string) {
    await this._isExists(id);
    return this.model.findOne({ user: new Types.ObjectId(userId), _id: id });
  }

  /**
   * Multiple delete
   */
  async bulkDelete(payload: string[]) {
    const data = payload.map((item) => new Types.ObjectId(item));

    return this.model.deleteMany({ _id: { $in: data } });
  }

  /**
   * Create new product
   */
  async addToStock(id: string, payload: Pick<IProduct, 'seller' | 'stock'>, userId: string) {
    try {
      const product: any = await this.model.findByIdAndUpdate(id, { $inc: { stock: payload.stock } });
      const seller = await Seller.findById(product.seller);

      await Purchase.create({
        user: userId,
        seller: product.seller,
        product: product._id,
        sellerName: seller?.name,
        productName: product.name,
        quantity: Number(payload.stock),
        unitPrice: Number(product.price),
        totalPrice: Number(payload.stock) * Number(product.price)
      });

      return product;
    } catch (error) {
      console.log(error);
      throw new CustomError(400, 'Product create failed');
    }
  }
}

const productServices = new ProductServices(Product, 'Product');
export default productServices;
