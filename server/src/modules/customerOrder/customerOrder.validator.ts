import { z } from 'zod';

const createSchema = z.object({
  customerName: z.string().trim().min(1, { message: 'Name is required' }),
  phone: z.string().trim().min(1, { message: 'Phone is required' }),
  address: z.string().trim().min(1, { message: 'Address is required' }),
  items: z
    .array(
      z.object({
        product: z.string().trim().min(1, { message: 'Product is required' }),
        quantity: z.number().int().min(1, { message: 'Quantity must be at least 1' })
      })
    )
    .min(1, { message: 'At least one product is required' })
});

const customerOrderValidator = { createSchema };
export default customerOrderValidator;
