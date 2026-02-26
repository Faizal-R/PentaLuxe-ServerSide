import Order from "../../models/order.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const getAllOrders = async () => {
  const orders = await Order.find()
    .populate("user")
    .populate("shippingAddress")
    .sort({ createdAt: -1 });

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.ORDER_LIST_RETRIEVED,
    data: orders,
  };
};

const changeOrderStatus = async ({ status, orderId }) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new CustomError(messages.ORDER.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  order.status = status;
  await order.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ADMIN.ORDER_STATUS_UPDATED,
    data: order,
  };
};

export const adminOrderService = {
  getAllOrders,
  changeOrderStatus,
};
