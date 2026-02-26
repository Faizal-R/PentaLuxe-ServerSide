import { createResponse } from "../../helpers/responseHandler.js";
import { orderService } from "../../services/user/user.order.service.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";

const getUserOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getUserOrders(req.user._id);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const cancelOrReturnOrder = asyncHandler(async (req, res) => {
  const { id, reason, type, payment } = req.body;
  const result = await orderService.cancelOrReturnOrder(req.user._id, { id, reason, type, payment });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

export { getUserOrders, cancelOrReturnOrder };
