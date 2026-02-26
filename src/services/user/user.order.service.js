import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { Variant } from "../../models/variant.model.js";
import Wallet from "../../models/wallet.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const getUserOrders = async (userId) => {
  const orders = await Order.find({ user: userId })
    .populate("user")
    .populate("shippingAddress")
    .populate({
      path: "items",
      populate: {
        path: "productId",
        populate: {
          path: "Variants",
        },
      },
    })
    .sort({ createdAt: -1 });

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: messages.ORDER.RETRIEVED,
    data: orders,
  };
};

const cancelOrReturnOrder = async (userId, { id, reason, type, payment }) => {
  if (!id) {
    throw new CustomError(messages.ORDER.ID_REQUIRED, statusCodes.BAD_REQUEST);
  }

  if (!type || (type !== "cancel" && type !== "return")) {
    throw new CustomError(messages.ORDER.ACTION_REQUIRED, statusCodes.BAD_REQUEST);
  }

  const order = await Order.findById(id);

  if (!order) {
    throw new CustomError(messages.ORDER.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  if (type === "cancel") {
    const cancellableStatuses = ["Pending", "Confirmed"];
    if (!cancellableStatuses.includes(order.status)) {
      throw new CustomError(messages.ORDER.CANCEL_FORBIDDEN, statusCodes.BAD_REQUEST);
    }

    if (payment === "Razorpay" || payment === "Wallet") {
      let wallet = await Wallet.findOne({ userID: userId });
      if (!wallet) {
        await Wallet.create({
          userID: userId,
          balance: order.totalAmount,
          transactions: [{
            orderID: order._id,
            type: "credit",
            date: Date.now(),
            method: order.paymentMethod,
            amount: order.totalAmount,
          }],
        });
      } else {
        wallet.balance += order.totalAmount;
        wallet.transactions.push({
          orderID: order._id,
          type: "credit",
          date: Date.now(),
          method: order.paymentMethod,
          amount: order.totalAmount,
        });
        await wallet.save();
      }
    }
    order.status = "Cancelled";
    order.cancellationReason = reason;
  } else if (type === "return") {
    if (order.status !== "Delivered") {
      throw new CustomError(messages.ORDER.RETURN_FORBIDDEN, statusCodes.BAD_REQUEST);
    }

    if (payment === "Razorpay" || payment === "Wallet") {
      let wallet = await Wallet.findOne({ userID: userId });
      if (!wallet) {
        await Wallet.create({
          userID: userId,
          balance: order.totalAmount,
          transactions: [{
            orderID: order._id,
            type: "credit",
            date: Date.now(),
            method: order.paymentMethod,
            amount: order.totalAmount,
          }],
        });
      } else {
        wallet.balance += order.totalAmount;
        wallet.transactions.push({
          orderID: order._id,
          type: "credit",
          date: Date.now(),
          method: order.paymentMethod,
          amount: order.totalAmount,
        });
        await wallet.save();
      }
    }
    order.status = "Returned";
    order.returnReason = reason;
  }

  await Promise.all(
    order.items.map(async (item) => {
      const product = await Product.findById(item.productId).populate("Variants");
      const variant = product.Variants.find(
        (variant) =>
          variant.price - (variant.price * item.discountPercentage) / 100 === item.price
      );

      if (!variant) throw new CustomError(`Variant not found for ${product.Name}`, statusCodes.NOT_FOUND);

      variant.stock += item.quantity;
      await Variant.findByIdAndUpdate(variant._id, { stock: variant.stock });
    })
  );

  await order.save();

  return {
    statusCode: statusCodes.OK,
    success: true,
    message: type === "cancel" ? messages.ORDER.CANCEL_SUCCESS : messages.ORDER.RETURN_SUCCESS,
    data: type,
  };
};

export const orderService = {
  getUserOrders,
  cancelOrReturnOrder,
};
