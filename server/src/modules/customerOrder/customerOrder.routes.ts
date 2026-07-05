import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import verifyAuth from '../../middlewares/verifyAuth';
import customerOrderController from './customerOrder.controller';
import customerOrderValidator from './customerOrder.validator';

const customerOrderRoutes = Router();

customerOrderRoutes.post('/', validateRequest(customerOrderValidator.createSchema), customerOrderController.create);

customerOrderRoutes.use(verifyAuth);

customerOrderRoutes.get('/', customerOrderController.getAll);
customerOrderRoutes.patch('/:id/confirm', customerOrderController.confirm);

export default customerOrderRoutes;
