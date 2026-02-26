import { createResponse } from "../../helpers/responseHandler.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";
import { adminOrderService } from "../../services/admin/admin.order.service.js";

const getAllOrders = asyncHandler(async (req, res) => {
  const result = await adminOrderService.getAllOrders();
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const changeOrderStatus = asyncHandler(async (req, res) => {
  const { status, orderId } = req.body;
  const result = await adminOrderService.changeOrderStatus({ status, orderId });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { getAllOrders, changeOrderStatus };
