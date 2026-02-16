import Order from "../../models/order.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import {
  createResponse,
  serverErrorResponse,
} from "../../helpers/responseHandler.js";

const getAllOrders = async (req, res) => {
  console.log("Fetching all orders...");

  try {
    const orders = await Order.find()
      .populate("user")
      .populate("shippingAddress")
      .sort({ createAt: -1 });

    console.log(orders);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Orders retrieved successfully",
      orders
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return serverErrorResponse(res);
  }
};

const changeOrderStatus = async (req, res) => {
  const { status, orderId } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "Order not found"
      );
    }

    order.status = status;
    await order.save();

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Order status updated successfully",
      order
    );
  } catch (error) {
    return serverErrorResponse(res);
  }
};

export { getAllOrders, changeOrderStatus };
