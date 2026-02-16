import Address from "../../models/address.model.js";
import Order from "../../models/order.model.js";
import Product from "../../models/product.model.js";
import { Variant } from "../../models/variant.model.js";
import Cart from "../../models/cart.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { createResponse, serverErrorResponse } from "../../helpers/responseHandler.js";
import Wallet from "../../models/wallet.model.js";
import { statusCodes } from "../../constant/statusCodes.js";

const createRazorpayOrder = async (req, res) => {
  try {
    const razorPayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });

    console.log(req.body.totalPrice);

    const options = {
      amount: req.body.totalPrice.toFixed(0) * 100,
      currency: "INR",
    };

    const order = await razorPayInstance.orders.create(options);

    return createResponse(
      res,
      statusCodes.OK,
      true,
      "Order created successfully",
      order
    );
  } catch (error) {
    console.log("paymentError", error);
    return createResponse(
      res,
      statusCodes.UNAUTHORIZED,
      false,
      "Failed to create payment"
    );
  }
};

const paymentVerification = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderDetails,
    retryPayment,
    orderId,
  } = req.body;

  console.log("insidePaymentVerfication", req.body);

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  try {
    if (isAuthentic && retryPayment) {
      const order = await Order.findById(orderId);

      await Promise.all(
        order.items.map(async (item) => {
          const product = await Product.findById(item.productId).populate(
            "Variants"
          );

          const variant = product.Variants.find(
            (variant) =>
              variant.price -
                (variant.price * item.discountPercentage) / 100 ===
              item.price
          );

          if (!variant) {
            throw new Error(`Variant not found for ${product.Name}`);
          }

          if (variant.stock <= item.quantity) {
            throw new Error(`Insufficient stock for ${product.Name} variant`);
          }

          variant.stock -= item.quantity;

          await Variant.findByIdAndUpdate(variant._id, {
            stock: variant.stock,
          });
        })
      );

      order.status = "Confirmed";
      await order.save();

      return createResponse(
        res,
        statusCodes.OK,
        true,
        "Order Confirmed Successfully"
      );
    }

    if (isAuthentic) {
      const order = await createOrder(
        req.user.id,
        orderDetails,
        "",
        razorpay_payment_id
      );

      return createResponse(
        res,
        statusCodes.CREATED,
        true,
        "Order created successfully",
        {
          orderId: order._id,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
        }
      );
    }

    return createResponse(
      res,
      statusCodes.BAD_REQUEST,
      false,
      "Payment verification failed."
    );
  } catch (error) {
    console.log(error);
    return createResponse(
      res,
      statusCodes.INTERNAL_SERVER_ERROR,
      false,
      error.message
    );
  }
};

const placeOrder = async (req, res) => {
  try {
    const order = await createOrder(req.user.id, req.body);
    console.log("Order", order);

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "Order created successfully",
      {
        orderId: order._id,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
      }
    );
  } catch (error) {
    console.log("order Erroro", error);
    return serverErrorResponse(res, "Error creating order");
  }
};

const createOrder = async (
  userId,
  orderDetails,
  status = "",
  transactionId
) => {
  const {
    addressId,
    items,
    paymentMethod,
    totalAmount,
    couponDiscount,
    couponCode,
  } = orderDetails;

  console.log("items", items);

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
      const product = await Product.findById(item.productId).populate(
        "Variants"
      );

      const variant = product.Variants.find(
        (variant) =>
          variant.price -
            (variant.price * item.discountPercentage) / 100 ===
          item.price
      );

      if (!variant) {
        throw new Error(`Variant not found for ${product.Name}`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.Name} variant`);
      }

      variant.stock -= item.quantity;

      await Variant.findByIdAndUpdate(variant._id, {
        stock: variant.stock,
      });
    }
  }

  await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

  return order;
};

const handleWalletPayment = async (req, res) => {
  try {
    const userID = req.user._id;
    const { totalPrice, orderDetails } = req.body;

    const wallet = await Wallet.findOne({ userID });

    if (!wallet) {
      return createResponse(
        res,
        statusCodes.NOT_FOUND,
        false,
        "User Dont Have Wallet Change the Payment Method"
      );
    }

    if (wallet.balance < totalPrice) {
      return createResponse(
        res,
        statusCodes.BAD_REQUEST,
        false,
        "Insufficient wallet balance"
      );
    }

    wallet.balance -= totalPrice;

    const order = await createOrder(userID, orderDetails);

    wallet.transactions.push({
      orderID: order._id,
      amount: totalPrice,
      method: order.paymentMethod,
      type: "debit",
      date: Date.now(),
    });

    await wallet.save();

    return createResponse(
      res,
      statusCodes.CREATED,
      true,
      "Order created successfully",
      {
        orderId: order._id,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
      }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return serverErrorResponse(res);
  }
};

const handlePaymentFailed = async (req, res) => {
  const existingOrder = await Order.findOne({
    transactionId: req.body.response.error.metadata.payment_id,
  });

  if (existingOrder) {
    return createResponse(res, statusCodes.OK, true, "Order already exists");
  }

  const order = await createOrder(
    req.user._id,
    req.body.orderDetails,
    "Payment Failed",
    req.body.response.error.metadata.payment_id
  );

  console.log(order);

  return createResponse(
    res,
    statusCodes.CREATED,
    true,
    "Payment failed order created"
  );
};

export {
  placeOrder,
  createRazorpayOrder,
  paymentVerification,
  handlePaymentFailed,
  handleWalletPayment,
};
