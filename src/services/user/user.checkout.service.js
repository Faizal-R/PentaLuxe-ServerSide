import Address from "../../models/address.model.js";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { Variant } from "../../models/variant.model.js";
import Cart from "../../models/cart.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import Wallet from "../../models/wallet.model.js";
import { statusCodes } from "../../constant/statusCodes.js";
import { messages } from "../../constant/messages/messages.js";
import CustomError from "../../utils/CustomError.js";

const createRazorpayOrder = async (totalPrice) => {
  try {
    const razorPayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    const options = {
      amount: totalPrice.toFixed(0) * 100,
      currency: "INR",
    };

    const order = await razorPayInstance.orders.create(options);
    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.CHECKOUT.PAYMENT_CREATED,
      data: order,
    };
  } catch (error) {
    throw new CustomError(messages.CHECKOUT.PAYMENT_FAILED, statusCodes.UNAUTHORIZED);
  }
};

const createOrder = async (userId, orderDetails, status = "", transactionId) => {
  const {
    addressId,
    items,
    paymentMethod,
    totalAmount,
    couponDiscount,
    couponCode,
  } = orderDetails;

  const estimatedDeliveryDate = new Date();
  const shippingAddress = await Address.findById(addressId).select(
    "-_id -Phone -user -addressType -default"
  );

  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

  let orderId = "#";
  for (let i = 0; i < 6; i++) {
    orderId += Math.floor(Math.random() * 10);
  }

  const order = await Order.create({
    _id: orderId,
    user: userId,
    shippingAddress,
    items,
    totalAmount,
    paymentMethod,
    status: status
      ? status
      : paymentMethod === "Razorpay" || paymentMethod === "Wallet"
      ? "Confirmed"
      : "Pending",
    orderDate: new Date(),
    estimatedDeliveryDate,
    couponDiscount,
    couponCode,
    transactionId: transactionId ? transactionId : null,
  });

  if (order.status !== "Payment Failed") {
    for (const item of items) {
      const product = await Product.findById(item.productId).populate("Variants");

      const variant = product.Variants.find(
        (variant) =>
          variant.price - (variant.price * item.discountPercentage) / 100 === item.price
      );

      if (!variant) {
        throw new CustomError(`Variant not found for ${product.Name}`, statusCodes.NOT_FOUND);
      }

      if (variant.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for ${product.Name} variant`, statusCodes.BAD_REQUEST);
      }

      variant.stock -= item.quantity;
      await Variant.findByIdAndUpdate(variant._id, { stock: variant.stock });
    }
  }

  await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });
  return order;
};

const paymentVerification = async (userId, body) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderDetails,
    retryPayment,
    orderId,
  } = body;

  const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(signatureBody.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic && retryPayment) {
    const order = await Order.findById(orderId);
    if (!order) throw new CustomError(messages.ORDER.NOT_FOUND, statusCodes.NOT_FOUND);

    await Promise.all(
      order.items.map(async (item) => {
        const product = await Product.findById(item.productId).populate("Variants");
        const variant = product.Variants.find(
          (variant) =>
            variant.price - (variant.price * item.discountPercentage) / 100 === item.price
        );

        if (!variant) throw new CustomError(`Variant not found for ${product.Name}`, statusCodes.NOT_FOUND);
        if (variant.stock <= item.quantity) throw new CustomError(`Insufficient stock for ${product.Name} variant`, statusCodes.BAD_REQUEST);

        variant.stock -= item.quantity;
        await Variant.findByIdAndUpdate(variant._id, { stock: variant.stock });
      })
    );

    order.status = "Confirmed";
    await order.save();

    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.CHECKOUT.ORDER_CONFIRMED,
    };
  }

  if (isAuthentic) {
    const order = await createOrder(userId, orderDetails, "", razorpay_payment_id);
    return {
      statusCode: statusCodes.CREATED,
      success: true,
      message: messages.CHECKOUT.ORDER_PLACED,
      data: {
        orderId: order._id,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
      },
    };
  }

  throw new CustomError(messages.CHECKOUT.VERIFICATION_FAILED, statusCodes.BAD_REQUEST);
};

const placeOrder = async (userId, body) => {
  const order = await createOrder(userId, body);
  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.CHECKOUT.ORDER_PLACED,
    data: {
      orderId: order._id,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
    },
  };
};

const handleWalletPayment = async (userId, { totalPrice, orderDetails }) => {
  const wallet = await Wallet.findOne({ userID: userId });

  if (!wallet) {
    throw new CustomError(messages.WALLET.NOT_FOUND, statusCodes.NOT_FOUND);
  }

  if (wallet.balance < totalPrice) {
    throw new CustomError(messages.WALLET.INSUFFICIENT_BALANCE, statusCodes.BAD_REQUEST);
  }

  wallet.balance -= totalPrice;
  const order = await createOrder(userId, orderDetails);

  wallet.transactions.push({
    orderID: order._id,
    amount: totalPrice,
    method: order.paymentMethod,
    type: "debit",
    date: Date.now(),
  });

  await wallet.save();

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.CHECKOUT.ORDER_PLACED,
    data: {
      orderId: order._id,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
    },
  };
};

const handlePaymentFailed = async (userId, { response, orderDetails }) => {
  const paymentId = response.error.metadata.payment_id;
  const existingOrder = await Order.findOne({ transactionId: paymentId });

  if (existingOrder) {
    return {
      statusCode: statusCodes.OK,
      success: true,
      message: messages.CHECKOUT.ORDER_EXISTS,
    };
  }

  await createOrder(userId, orderDetails, "Payment Failed", paymentId);

  return {
    statusCode: statusCodes.CREATED,
    success: true,
    message: messages.CHECKOUT.PAYMENT_FAILED_ORDER,
  };
};

export const checkoutService = {
  createRazorpayOrder,
  paymentVerification,
  placeOrder,
  handleWalletPayment,
  handlePaymentFailed,
};
