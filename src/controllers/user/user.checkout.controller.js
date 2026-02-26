import { createResponse } from "../../helpers/responseHandler.js";
import { checkoutService } from "../../services/user/user.checkout.service.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { totalPrice } = req.body;
  const result = await checkoutService.createRazorpayOrder(totalPrice);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const paymentVerification = asyncHandler(async (req, res) => {
  const result = await checkoutService.paymentVerification(req.user.id, req.body);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const placeOrder = asyncHandler(async (req, res) => {
  const result = await checkoutService.placeOrder(req.user.id, req.body);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const handleWalletPayment = asyncHandler(async (req, res) => {
  const { totalPrice, orderDetails } = req.body;
  const result = await checkoutService.handleWalletPayment(req.user._id, { totalPrice, orderDetails });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const handlePaymentFailed = asyncHandler(async (req, res) => {
  const { response, orderDetails } = req.body;
  const result = await checkoutService.handlePaymentFailed(req.user._id, { response, orderDetails });
  return createResponse(res, result.statusCode, result.success, result.message);
});

export {
  placeOrder,
  createRazorpayOrder,
  paymentVerification,
  handlePaymentFailed,
  handleWalletPayment,
};
