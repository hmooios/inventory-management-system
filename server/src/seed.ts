import mongoose, { Types } from 'mongoose';
import config from './config';
import User from './modules/user/user.model';
import Seller from './modules/seller/seller.model';
import Category from './modules/category/category.model';
import Brand from './modules/brand/brand.model';
import Product from './modules/product/product.model';
import Purchase from './modules/purchase/purchase.model';
import Sale from './modules/sale/sale.model';

const seedUser = {
  name: 'Demo Admin',
  email: 'admin@example.com',
  password: 'password123',
  phone: '09123456789',
  city: 'Yangon',
  country: 'Myanmar'
};

const sellers = [
  { name: 'Yangon Wholesale', email: 'yangon-wholesale@example.com', contactNo: '09111111111' },
  { name: 'Mandalay Trading', email: 'mandalay-trading@example.com', contactNo: '09222222222' },
  { name: 'Naypyitaw Supplies', email: 'naypyitaw-supplies@example.com', contactNo: '09333333333' }
];

const categories = ['Office Supplies', 'Electronics', 'Home Essentials', 'Warehouse'];
const brands = ['Atlas', 'Nova', 'Everstock', 'Prime'];

const products = [
  {
    name: 'A4 Copy Paper Pack',
    category: 'Office Supplies',
    brand: 'Atlas',
    seller: 'Yangon Wholesale',
    size: 'MEDIUM',
    price: 18500,
    stock: 80,
    description: 'Bright white A4 paper pack for daily office printing.'
  },
  {
    name: 'Wireless Barcode Scanner',
    category: 'Electronics',
    brand: 'Nova',
    seller: 'Mandalay Trading',
    size: 'SMALL',
    price: 145000,
    stock: 18,
    description: 'Portable scanner for inventory checkout and stock counts.'
  },
  {
    name: 'Storage Bin Set',
    category: 'Warehouse',
    brand: 'Everstock',
    seller: 'Naypyitaw Supplies',
    size: 'LARGE',
    price: 52000,
    stock: 35,
    description: 'Durable labeled bins for clean shelf organization.'
  },
  {
    name: 'Thermal Label Roll',
    category: 'Warehouse',
    brand: 'Prime',
    seller: 'Yangon Wholesale',
    size: 'SMALL',
    price: 9500,
    stock: 120,
    description: 'Thermal labels for product tags and shipping labels.'
  },
  {
    name: 'Desk Organizer Tray',
    category: 'Office Supplies',
    brand: 'Everstock',
    seller: 'Mandalay Trading',
    size: 'MEDIUM',
    price: 24500,
    stock: 42,
    description: 'Compact tray for stationery, slips, and counter tools.'
  },
  {
    name: 'LED Stockroom Lamp',
    category: 'Home Essentials',
    brand: 'Nova',
    seller: 'Naypyitaw Supplies',
    size: 'MEDIUM',
    price: 39000,
    stock: 27,
    description: 'Energy-saving LED lamp for storage rooms and counters.'
  }
];

const sales = [
  { productName: 'A4 Copy Paper Pack', buyerName: 'Moe Office', quantity: 6, daysAgo: 1 },
  { productName: 'Wireless Barcode Scanner', buyerName: 'Shwe Market', quantity: 2, daysAgo: 4 },
  { productName: 'Storage Bin Set', buyerName: 'Bright Warehouse', quantity: 5, daysAgo: 8 },
  { productName: 'Thermal Label Roll', buyerName: 'Quick Delivery', quantity: 12, daysAgo: 14 },
  { productName: 'Desk Organizer Tray', buyerName: 'City Bookstore', quantity: 4, daysAgo: 32 },
  { productName: 'LED Stockroom Lamp', buyerName: 'North Depot', quantity: 3, daysAgo: 64 }
];

async function main() {
  await mongoose.connect(config.database_url as string);
  console.log('Connected to MongoDB');

  const oldUser = await User.findOne({ email: seedUser.email });

  if (oldUser) {
    await Promise.all([
      Sale.deleteMany({ user: oldUser._id }),
      Purchase.deleteMany({ user: oldUser._id }),
      Product.deleteMany({ user: oldUser._id }),
      Seller.deleteMany({ user: oldUser._id }),
      Category.deleteMany({ user: oldUser._id }),
      Brand.deleteMany({ user: oldUser._id })
    ]);
    await User.deleteOne({ _id: oldUser._id });
  }

  const user = await User.create(seedUser);
  const userId = user._id as Types.ObjectId;

  const createdSellers = await Seller.insertMany(sellers.map((seller) => ({ ...seller, user: userId })));
  const createdCategories = await Category.insertMany(categories.map((name) => ({ name, user: userId })));
  const createdBrands = await Brand.insertMany(brands.map((name) => ({ name, user: userId })));

  const sellerMap = new Map(createdSellers.map((seller) => [seller.name, seller]));
  const categoryMap = new Map(createdCategories.map((category) => [category.name, category]));
  const brandMap = new Map(createdBrands.map((brand) => [brand.name, brand]));

  const createdProducts = await Product.insertMany(
    products.map((product) => ({
      user: userId,
      name: product.name,
      seller: sellerMap.get(product.seller)!._id,
      category: categoryMap.get(product.category)!._id,
      brand: brandMap.get(product.brand)!._id,
      size: product.size,
      price: product.price,
      stock: product.stock,
      description: product.description
    }))
  );

  await Purchase.insertMany(
    createdProducts.map((product) => {
      const seller = createdSellers.find((item) => item._id.equals(product.seller));

      return {
        user: userId,
        seller: product.seller,
        product: product._id,
        sellerName: seller?.name || 'Seed Seller',
        productName: product.name,
        quantity: product.stock,
        unitPrice: product.price,
        totalPrice: product.stock * product.price,
        paid: 0
      };
    })
  );

  await Sale.insertMany(
    sales.map((sale) => {
      const product = createdProducts.find((item) => item.name === sale.productName)!;
      const date = new Date();
      date.setDate(date.getDate() - sale.daysAgo);

      return {
        user: userId,
        product: product._id,
        buyerName: sale.buyerName,
        productName: product.name,
        quantity: sale.quantity,
        productPrice: product.price,
        totalPrice: product.price * sale.quantity,
        date
      };
    })
  );

  console.log(`Seed completed:`);
  console.log(`- Admin login: ${seedUser.email} / ${seedUser.password}`);
  console.log(`- Sellers: ${createdSellers.length}`);
  console.log(`- Categories: ${createdCategories.length}`);
  console.log(`- Brands: ${createdBrands.length}`);
  console.log(`- Products: ${createdProducts.length}`);
  console.log(`- Sales: ${sales.length}`);

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
