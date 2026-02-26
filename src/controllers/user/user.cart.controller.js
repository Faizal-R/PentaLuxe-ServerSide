import { createResponse } from "../../helpers/responseHandler.js";
import { cartService } from "../../services/user/user.cart.service.js";
import { asyncHandler } from "../../helpers/asyncHandler.js";

const addToCart = asyncHandler(async (req, res) => {
  const { productId, volume } = req.body;
  const user = req.user;
  const result = await cartService.addToCart(user._id, { productId, volume });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const getUserCart = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const result = await cartService.getUserCart(token);
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const changeProductQuantity = asyncHandler(async (req, res) => {
  const { itemId, action, stock } = req.body;
  const userId = req.user._id;
  const result = await cartService.changeProductQuantity(userId, { itemId, action, stock });
  return createResponse(res, result.statusCode, result.success, result.message, result.data);
});

const removeProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const result = await cartService.removeProduct(userId, id);
  return createResponse(res, result.statusCode, result.success, result.message);
});

const updateCartTotalPrice = asyncHandler(async (req, res) => {
  const { totalPrice } = req.body;
  const userId = req.user.id;
  const result = await cartService.updateCartTotalPrice(userId, totalPrice);
  return createResponse(res, result.statusCode, result.success, result.message);
});

export {
  addToCart,
  getUserCart,
  changeProductQuantity,
  removeProduct,
  updateCartTotalPrice,
};
