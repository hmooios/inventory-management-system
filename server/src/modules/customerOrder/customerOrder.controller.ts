import httpStatus from 'http-status';
import asyncHandler from '../../lib/asyncHandler';
import sendResponse from '../../lib/sendResponse';
import customerOrderServices from './customerOrder.services';

class CustomerOrderController {
  private services = customerOrderServices;

  create = asyncHandler(async (req, res) => {
    const result = await this.services.create(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: 'Order submitted successfully!',
      data: result
    });
  });

  getAll = asyncHandler(async (req, res) => {
    const result = await this.services.getAll(req.user._id, req.query);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Customer orders retrieved successfully!',
      meta: {
        page,
        limit,
        total: result.totalCount,
        totalPage: Math.ceil(result.totalCount / limit)
      },
      data: result.data
    });
  });

  confirm = asyncHandler(async (req, res) => {
    const result = await this.services.confirm(req.params.id, req.user._id);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'Customer order confirmed successfully!',
      data: result
    });
  });
}

const customerOrderController = new CustomerOrderController();
export default customerOrderController;
